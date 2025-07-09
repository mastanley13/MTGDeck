# Deck Builder Speed-Up & Optimization Plan

## 0. Context
The current **Auto-Deck-Builder** flow delivers high-quality, validated 99-card Commander decks but the end-to-end latency (≈ 40-60 s) is becoming a UX pain-point.  We want to reach an "instant-ish" experience (< 10 s perceived, < 20 s actual) **without sacrificing** validation accuracy or deck quality.

This document merges insights from:
* `DECK_VALIDATION_ISSUES_ANALYSIS.md` (Phase-1 parsing / validation fixes)
* The recent latency audit & brainstorming session (see chat log)
* Known best practices for OpenAI latency tuning

---

## 1. Latency Reduction Techniques

| ID | Category | Idea | Effort | Expected Win |
|----|----------|------|--------|--------------|
| L-1 | _Low-Hanging_ | Cache commander analysis & Scryfall look-ups in **`sessionStorage`** | S | 300–800 ms |
| L-2 | _Low-Hanging_ | Run `generateInitialDeck()` **in parallel** with `analyzeCommander()` via `Promise.all` | S | 30–40 % overall |
| L-3 | _Low-Hanging_ | Request **streamed** completions from OpenAI (`stream:true`) and incrementally parse → show cards | M | Huge perceived (spinner → cards within 2-3 s) |
| L-4 | _Low-Hanging_ | Trim *outbound* prompt + *inbound* `max_tokens` (200-300 is enough for 99 cards) | S | 0–20 % |
| L-5 | _Low-Hanging_ | Skip duplicate validation passes; only validate **new/replaced** cards | S | 0–10 % |
| L-6 | _Structural_ | Two-tier model: **GPT-3.5-Turbo** for skeleton → **GPT-4.x** for polish | M | 40-60 % |
| L-7 | _Structural_ | Return first pass immediately, run an async "auto-heal" worker for polish | M | Perceived 100 % |
| L-8 | _Structural_ | Pre-bake skeleton decks for Top-100 commanders on CDN | L | Cold-start ≈200 ms |

_Notes:_  **Effort Legend** S = ≤ ½ day, M = 1–3 days, L = 4-10 days.

---

## 2. Target Service-Level Objectives (SLO)
* **T1 – Perceived Latency (spinner→first card)**: ≤ 3 s (P95)
* **T2 – Full Deck Ready**: ≤ 10 s (P95)
* **T3 – Background Polish Pass**: ≤ 30 s (P99)

If P95 > T2 for two consecutive deploys → treat as regression.

---

## 3. Roadmap & Milestones

### Milestone A – Quick Wins (Week 1)
1. **L-1** Cache commander analysis & Scryfall data.
2. **L-2** Parallelise analysis + generation.
3. **L-4** Reduce token counts & strip explanations.
4. **L-5** Short-circuit duplicate validation.

_Exit Criteria:_ Average build time < 25 s, P95 < 30 s.

### Milestone B – Perceived Instant (Week 2–3)
1. Implement **L-3** streaming responses.
2. Add progressive UI (card list grows as JSON chunks arrive).
3. Instrument frontend with **`performance.mark()`** to capture real user metrics (RUM).

_Exit Criteria:_ First card visible ≤ 3 s for 90 % of real users.

### Milestone C – Structural Refactor (Week 4–5)
1. **L-6** two-tier model pipeline.
   * P0: spike in dev branch, benchmark vs vanilla flow.
   * P1: integrate behind feature flag.
2. **L-7** background "auto-heal" worker (web-worker or serverless cron).

_Exit Criteria:_ Full deck ≤ 10 s (P95) on prod, auto-heal delivers improvements w/o blocking UI.

### Milestone D – CDN Skeletons (Backlog / Nice-to-have)
1. Off-line job generates & stores skeleton decks for most-played commanders.
2. At runtime: fetch skeleton, then patch with user prefs & launch polish.

---

## 4. Implementation Checklist (per Item)

<details>
<summary><strong>L-2 Parallelise Functions</strong></summary>

- [ ] Replace sequential call in `useAutoDeckBuilder.buildCompleteDeck`:
  ```js
  // BEFORE
  const analysis   = await analyzeCommander(commander, deckStyle);
  const initialDeck = await generateInitialDeck(commander, analysis, rules, deckStyle);
  ```
  with
  ```js
  const [analysis, initialDeck] = await Promise.all([
    analyzeCommander(commander, deckStyle),
    generateInitialDeck(commander, /* analysis stub */ {}, rules, deckStyle)
  ]);
  ```
- [ ] Pipe `analysis` into optimisation after both resolve.

</details>

<details>
<summary><strong>L-3 Streaming Responses</strong></summary>

1. Add util `streamOpenAI` (wrapper around `fetch` & `ReadableStream`).
2. Modify `generateInitialDeck` & `optimizeDeckWithO3` to push chunks into an incremental JSON parser (`clarinet`, `oboe`, or custom).
3. Fire `addCard()` for each fully-parsed object.
4. Add AbortController timeout (40 s hard stop).

</details>

<!-- More checklists truncated for brevity -->

---

## 5. Risk & Mitigation
* **Model Drift** – keep regression tests (validation + cost caps) on CI.
* **Cost Spike** – short prompts + two-tier model cut total tokens ≈35 %.
* **Concurrency Limits** – cache & CDN skeletons lower real-time API bursts.

---

## 6. Ownership & Tracking
| Component | Driver | Reviewers |
|-----------|--------|-----------|
| Prompt & Token Trim | @backend-ai | @deck-lead |
| Streaming & UI | @frontend | @ux-lead |
| Two-tier Pipeline | @backend-ai | @ops |
| Metrics & Alerting | @ops | @backend-ai |

Progress will be tracked in GitHub project **"Deck-Builder Speed"** with automated links to the performance dashboard.

---

## 7. Appendix – Validation Guarantees (Snapshot)
The fixes described in `DECK_VALIDATION_ISSUES_ANALYSIS.md` (Phase-1) remain **non-negotiable gates** in every build:
1. JSON must parse (comment-stripping stays in place).
2. 0 ✗ colour-identity or banned-card violations.
3. Card distribution within archetype‐specified bounds.

Any speed optimisation **must** respect these gates (CI test suite will fail otherwise). 