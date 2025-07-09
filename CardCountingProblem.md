# Deck Commander Change & Card Counting Analysis

## 1. Card Counting Bug Analysis

### Problem Statement
Some decks display a card count of 101 instead of the expected 100. This is visible in the deck list UI, where most decks show 100 cards, but a few show 101.

### Root Cause
- **Double-counting the commander**: The commander card is present both in the `commander` field and in the `cards` array, causing it to be counted twice.
- **Expected structure**: 
  - `commander`: single card object (should count as 1)
  - `cards`: array of main deck cards (should total 99)
  - **Total**: 100 cards (99 + 1)
- **Actual issue**: Some decks have the commander in both places, so the count is 99 + 1 + 1 = 101.

### Evidence from Code
- `getTotalCardCount` in `deckHelpers.js`:
  ```js
  const mainDeckCount = cards.reduce((total, card) => total + (card.quantity || 1), 0);
  const commanderCount = deckData.commander ? 1 : 0;
  return mainDeckCount + commanderCount;
  ```
- `validateDeckStructure` attempts to remove the commander from the main deck:
  ```js
  if (deck.commander) {
    const commanderId = deck.commander.id;
    deck.cards = deck.cards.filter(card => card.id !== commanderId);
  }
  ```
- Deck import and loading logic may not always call this validation, or legacy decks may have been saved before this was enforced.

### Proposed Solution
1. **Immediate fix**: Ensure `validateDeckStructure` is always called when loading or importing decks.
2. **Preventive fix**: Always remove the commander from the main deck array when setting/changing the commander, importing, or saving a deck.
3. **Add defensive checks**: Warn or auto-fix if a commander is found in both places.

---

## 2. Impact of Adding Commander Change Feature

### Risks
- If a user changes their commander, the old commander might remain in the main deck, or the new commander might not be removed from the main deck, causing double-counting.
- If the user wants to keep the old commander in the main deck, the deck could exceed 99 main deck cards if not handled properly.
- Promoting a card from the main deck to commander must remove it from the main deck.

### Safe Implementation Strategy
- **Reducer logic for safe commander change**:
  ```js
  case Actions.CHANGE_COMMANDER: {
    const { newCommander, keepOldCommanderInDeck } = action.payload;
    const currentCommander = state.commander;
    let updatedCards = [...state.cards];
    // Step 1: Handle the old commander
    if (currentCommander) {
      if (keepOldCommanderInDeck) {
        // Only add if deck is not full
        if (getMainDeckCardCount({ cards: updatedCards }) < 99) {
          updatedCards.push({ ...currentCommander, quantity: 1 });
        }
      }
    }
    // Step 2: Remove new commander from main deck if present
    if (newCommander) {
      updatedCards = updatedCards.filter(card => card.id !== newCommander.id);
    }
    // Step 3: Validate
    const finalDeck = { cards: updatedCards, commander: newCommander };
    const validatedDeck = validateDeckStructure(finalDeck);
    return {
      ...state,
      commander: newCommander,
      cards: validatedDeck.cards,
      error: null
    };
  }
  ```
- **UI Considerations**:
  - Allow user to choose whether to keep the old commander in the main deck.
  - Warn if the deck would exceed 99 main deck cards.
  - Allow promoting a main deck card to commander (removing it from main deck).

### Enhanced Validation
- Always run `validateDeckStructure` after commander changes.
- Log or warn if a commander is found in both places.

### Migration for Existing Decks
- Run validation on all loaded decks to clean up any double-counting.

---

## 3. Summary
- The card count bug is caused by double-counting the commander.
- Adding a commander change feature increases the risk of this bug if not handled carefully.
- The solution is to always validate deck structure and ensure the commander is only present in one place.
- Defensive programming and user feedback are key to maintaining deck integrity.

---

## 4. References & Code Snippets

### `getTotalCardCount` (deckHelpers.js)
```js
export const getTotalCardCount = (deckData) => {
  if (Array.isArray(deckData)) {
    return deckData.reduce((total, card) => total + (card.quantity || 1), 0);
  }
  if (deckData && typeof deckData === 'object') {
    const cards = Array.isArray(deckData.cards) ? deckData.cards : [];
    const mainDeckCount = cards.reduce((total, card) => total + (card.quantity || 1), 0);
    const commanderCount = deckData.commander ? 1 : 0;
    return mainDeckCount + commanderCount;
  }
  return 0;
};
```

### `validateDeckStructure` (deckHelpers.js)
```js
export const validateDeckStructure = (deck) => {
  // ...
  if (deck.commander) {
    const commanderId = deck.commander.id;
    deck.cards = deck.cards.filter(card => card.id !== commanderId);
  }
  // ...
  return deck;
};
```

### Commander Change Reducer Example
```js
case Actions.CHANGE_COMMANDER: {
  const { newCommander, keepOldCommanderInDeck } = action.payload;
  const currentCommander = state.commander;
  let updatedCards = [...state.cards];
  if (currentCommander && keepOldCommanderInDeck) {
    if (getMainDeckCardCount({ cards: updatedCards }) < 99) {
      updatedCards.push({ ...currentCommander, quantity: 1 });
    }
  }
  if (newCommander) {
    updatedCards = updatedCards.filter(card => card.id !== newCommander.id);
  }
  const finalDeck = { cards: updatedCards, commander: newCommander };
  const validatedDeck = validateDeckStructure(finalDeck);
  return {
    ...state,
    commander: newCommander,
    cards: validatedDeck.cards,
    error: null
  };
}
```

---

*Prepared by AI analysis, based on your codebase and requirements.* 