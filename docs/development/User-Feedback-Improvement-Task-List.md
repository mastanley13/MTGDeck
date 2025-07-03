# AIDeckTutor User Feedback – Improvement Task List

This document outlines user-reported issues and suggestions for improving the AIDeckTutor MTG deck-building app. Tasks are grouped by category and prioritized for implementation.

---

## 🐞 Bugs & Technical Issues

### 1. Wrong Dual-Colored Lands in Decks
- **Problem:** AI-generated decks include dual lands outside of the commander's color identity.
- **Examples:** Urza, Chief Artificer and The Archimandrite.

**🔧 Implementation Strategy:**
- **Current State:** ✅ **EXCELLENT SYSTEM ALREADY EXISTS!**
- **Discovery:** The app already has a sophisticated 3-layer dynamic validation system:
  1. **Quick static check** (small hardcoded list for performance)
  2. **Learning cache** (`validateColorIdentityWithLearning`)
  3. **Real-time Scryfall validation** (`validateColorIdentityFromScryfall`)

**🚀 Better Approach - Optimize Existing System:**
- **Files to modify:**
  - `src/hooks/useAutoDeckBuilder.js` - Enhance `filterColorIdentityViolations` visibility
  - `src/services/commanderLegalityService.js` - Improve learning cache persistence
  - `src/components/deck/DeckAnalytics.jsx` - Show filtered violations to user

**Technical Implementation:**
1. **Reduce Static List to Critical Cards Only**
   ```javascript
   // Keep only the most problematic 20-30 cards for speed
   const CRITICAL_COLOR_VIOLATIONS = {
     // Only keep frequently-seen violations that cause the most issues
     'Raugrin Triome': ['R', 'U', 'W'],
     'Savai Triome': ['R', 'W', 'B'], 
     'Zagoth Triome': ['B', 'G', 'U'],
     'Ketria Triome': ['G', 'U', 'R'],
     'Indatha Triome': ['W', 'B', 'G'],
     // Remove the 85+ others - let dynamic system handle them
   };
   ```

2. **Enhance Learning System Persistence**
   ```javascript
   // Store learned violations in localStorage for persistence
   const persistLearnedViolations = () => {
     localStorage.setItem('learned_violations', JSON.stringify([...learnedViolations]));
   };
   
   const loadLearnedViolations = () => {
     const stored = localStorage.getItem('learned_violations');
     if (stored) {
       const parsed = JSON.parse(stored);
       parsed.forEach(([name, colors]) => learnedViolations.set(name, colors));
     }
   };
   ```

3. **User Feedback Display**
   ```javascript
   // Show users what was automatically filtered
   const displayFilteredViolations = (violations) => {
     console.log(`🛡️ Automatically prevented ${violations.length} color identity violations:`);
     violations.forEach(v => {
       console.log(`   ✓ ${v.cardName} [${v.cardColorIdentity?.join(', ')}] → Filtered`);
     });
   };
   ```

**Implementation Steps:**
1. **Trim static list** to ~20 most problematic cards (reduce maintenance)
2. **Add localStorage persistence** for learned violations
3. **Enhance user feedback** to show what was filtered
4. **Trust the dynamic system** - it's already excellent!

**Why This Approach is Superior:**
- ✅ **Handles ALL cards** (including new releases)
- ✅ **Self-improving** through learning cache
- ✅ **100% accurate** using Scryfall data
- ✅ **Low maintenance** - no hardcoded lists to update
- ✅ **User transparency** - shows what was filtered
- ✅ **Performance optimized** - static check for speed, dynamic for accuracy

**Expected Result:**
- Color identity violations should drop to near 0%
- System learns and improves over time
- No manual card list maintenance required
- Users see transparency in filtering process

### 2. Commander Detection Fails on Import
- **Problem:** Commander not recognized if not explicitly labeled (e.g. Moxfield exports).

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/components/deck/DeckImporter.jsx` - Add post-import commander selection UI
  - `src/services/deckImportService.js` - Enhance `detectCommanderFromCards` function
  - `src/components/ui/CommanderSelectionModal.jsx` - New component for manual selection

- **Technical Approach:**
  1. **Improve Detection Algorithm (Current Logic Enhancement)**
     ```javascript
     // Enhance the existing detectCommanderFromCards function
     export const detectCommanderFromCards = (cards, options = {}) => {
       // Current algorithm is good, but add:
       // - Better heuristics for partner detection
       // - Improved artifact creature prioritization
       // - Better handling of multiple viable commanders
     };
     ```

  2. **Add Manual Selection UI**
     - Create modal that appears when commander detection fails
     - Show all legendary creatures found in deck
     - Allow user to select or search for commander
     - Integrate with existing `CommanderSearch.jsx` component

  3. **Fallback Detection Strategies**
     - If no legendary creatures, prompt user to add commander
     - Check import metadata for commander hints
     - Use EDHREC data to identify likely commanders in imported lists

**Implementation Steps:**
1. Create `CommanderSelectionModal.jsx` component
2. Add trigger in `DeckImporter.jsx` when `commander: null` in import result
3. Enhance detection logging for better debugging
4. Add "Change Commander" option to post-import results

### 3. Unknown Import Bug (Resolved Itself)
- **Problem:** Unidentified import failure (user: MagicHat01).

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/services/deckImportService.js` - Add comprehensive error logging
  - `src/components/deck/DeckImporter.jsx` - Enhanced error display
  - `src/utils/errorReporting.js` - New service for error tracking

- **Technical Approach:**
  1. **Comprehensive Error Logging**
     ```javascript
     // Add to importDeckFromText function
     const logImportError = (stage, error, context) => {
       console.error(`Import failed at ${stage}:`, {
         error: error.message,
         stack: error.stack,
         context,
         timestamp: new Date().toISOString(),
         userAgent: navigator.userAgent
       });
     };
     ```

  2. **User-Friendly Error Messages**
     - Replace technical errors with helpful guidance
     - Provide specific steps for common issues
     - Include examples of proper format

  3. **Error Recovery Mechanisms**
     - Partial import on recoverable errors
     - Format auto-detection fallbacks
     - Card name suggestion system

**Implementation Steps:**
1. Add detailed logging at each import stage
2. Create error message mapping for common failures
3. Implement error reporting dashboard (optional)
4. Add "retry with different format" options

### 4. Analytics Color Identity Mismatch
- **Problem:** Colorless mana is being counted as an additional color.

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/utils/deckAnalytics.js` - Fix `getColorDistribution` function
  - `src/components/deck/DeckAnalytics.jsx` - Update color display logic
  - `src/components/deckstats/analyzers/manaSources.js` - Fix mana source analysis

- **Technical Approach:**
  1. **Fix Color Distribution Logic**
     ```javascript
     // Current issue in getColorDistribution function
     export const getColorDistribution = (cards) => {
       // Issue: colorless mana symbols {C} being counted as color
       // Fix: Only count W, U, B, R, G as colors
       // Separate colorless artifacts from colorless mana
       
       cards.forEach(card => {
         // Fixed logic:
         if (!card.color_identity || card.color_identity.length === 0) {
           colors.Colorless += quantity; // This is correct
         } else {
           // Only count actual WUBRG colors, not {C}
           card.color_identity.forEach(color => {
             if (['W', 'U', 'B', 'R', 'G'].includes(color)) {
               colors[color] += quantity;
             }
           });
         }
       });
     };
     ```

  2. **Distinguish Colorless Types**
     - Colorless artifacts (no color identity)
     - Cards that produce colorless mana {C}
     - Generic mana costs {1}, {2}, etc.

**Implementation Steps:**
1. Audit `getColorDistribution` function in `deckAnalytics.js`
2. Fix color counting logic to exclude {C} symbols from color identity
3. Update analytics display to properly show colorless vs colored cards
4. Test with known colorless commanders (Kozilek, Ulamog, etc.)

---

## 🚧 UX / Usability Improvements

### 5. Action Buttons Placement
- **Problem:** Edit, AI Tutor, and Delete buttons are placed at the bottom.

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/pages/DeckViewer.jsx` - Move button container location
  - `src/pages/DeckBuilder.jsx` - Adjust layout structure
  - `src/components/deck/DeckBuilder.jsx` - Update button positioning

- **Technical Approach:**
  1. **Move Buttons to Top-Right**
     ```jsx
     // Current structure in DeckViewer.jsx around line 831
     <div className="flex flex-wrap gap-4"> // This is at bottom
     
     // Move to top-right near deck title:
     <div className="flex justify-between items-start mb-6">
       <div>
         <h1>Deck Title</h1>
         <p>Deck info</p>
       </div>
       <div className="flex gap-4">
         {/* Edit, AI Tutor, Delete buttons */}
       </div>
     </div>
     ```

  2. **Responsive Design Considerations**
     - Stack buttons vertically on mobile
     - Maintain accessibility
     - Preserve visual hierarchy

  3. **Update All Deck Views**
     - DeckViewer page
     - DeckBuilder page  
     - Embedded deck components

**Implementation Steps:**
1. Identify all locations with Edit/AI Tutor/Delete buttons
2. Create reusable `DeckActionButtons` component
3. Move to top-right positioning with responsive design
4. Update CSS classes for proper spacing and alignment

### 6. Deck Builder Starts with Last Used Commander
- **Problem:** Builder loads with previous commander, causing confusion.

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/context/DeckContext.jsx` - Modify initial state and commander persistence
  - `src/pages/DeckBuilder.jsx` - Add commander clearing logic
  - `src/components/search/CommanderSearch.jsx` - Auto-open on fresh visits

- **Technical Approach:**
  1. **Modify Initial State Behavior**
     ```javascript
     // In DeckContext.jsx
     const initialState = {
       commander: null, // Always start null
       cards: [],
       // Remove commander persistence or make it optional
     };
     
     // Add flag for "intentional" commander selection vs. persistence
     const [isNewDeckBuilder, setIsNewDeckBuilder] = useState(true);
     ```

  2. **Auto-open Commander Selection**
     ```javascript
     // In DeckBuilder.jsx useEffect
     useEffect(() => {
       // If no commander and this is a fresh visit (not a saved deck)
       if (!commander && !hasLoadedSavedDeck) {
         setIsCommanderSearchModalOpen(true);
       }
     }, [commander, hasLoadedSavedDeck]);
     ```

  3. **Clear Previous Session Data**
     - Add "Start New Deck" button/option
     - Clear commander when navigating to builder from home
     - Only persist commander within active building session

**Implementation Steps:**
1. Add session state tracking to DeckContext
2. Modify commander persistence logic
3. Auto-open commander search for new sessions
4. Add "Clear & Start New" functionality
5. Test navigation flows from different entry points

---

## ⚙️ Feature Improvements

### 7. Archidekt Link Import Support
- **Problem:** Archidekt URLs are not currently supported.

**🔧 Implementation Strategy:**
- **Current Status:** ✅ **ALREADY IMPLEMENTED**
- **Files involved:** `src/services/deckImportService.js` has full Archidekt parser

**Verification Needed:**
1. Test current Archidekt import functionality
2. Check if URL parsing vs. text parsing is the issue
3. May need to add URL fetching capability

**If URL fetching needed:**
- **Files to modify:**
  - `src/services/deckImportService.js` - Add `importFromURL` function
  - `src/components/deck/DeckImporter.jsx` - Enable URL import tab
  - Add CORS proxy or server-side fetching

**Technical Approach (if needed):**
```javascript
// Add URL import capability
export const importFromURL = async (url) => {
  // Parse Archidekt URL
  if (url.includes('archidekt.com')) {
    // Extract deck ID from URL
    // Fetch deck data via API or scraping
    // Convert to standard format
    // Process with existing parser
  }
};
```

### 8. Manual Commander Selection Post-Import
- **Problem:** No way to reassign commander after import.

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/components/deck/DeckBuilder.jsx` - Add "Change Commander" button (already exists!)
  - `src/components/ui/ImportResultsDisplay.jsx` - Add commander change option
  - `src/pages/DeckViewer.jsx` - Add commander editing capability

**Current Status:** ✅ **PARTIALLY IMPLEMENTED**
- "Change Commander" button exists in DeckBuilder.jsx line ~443
- Need to add to post-import flow and DeckViewer

**Technical Approach:**
1. **Add to Import Results**
   ```jsx
   // In ImportResultsDisplay.jsx
   <div className="commander-section">
     <h4>Commander: {commander.name}</h4>
     <button onClick={() => setShowCommanderSelector(true)}>
       Change Commander
     </button>
   </div>
   ```

2. **Add to Deck Viewer**
   - Copy commander selection logic from DeckBuilder
   - Add near deck title area
   - Integrate with existing commander search modal

**Implementation Steps:**
1. Add "Change Commander" to ImportResultsDisplay component
2. Add "Change Commander" to DeckViewer page
3. Ensure commander search modal works in all contexts
4. Test commander switching with color identity validation

### 9. Budget Archetype AI Sync ✅ **COMPLETED**
- **Problem:** Budget is locked to $100 for AI decks.

**🔧 Implementation Strategy:** ✅ **FULLY IMPLEMENTED**
- **Files modified:**
  - `src/components/ai/AutoDeckBuilder.jsx` - Added budget slider/input with presets
  - `src/hooks/useAutoDeckBuilder.js` - Added budget parameter to AI calls and enhanced validation
  - `src/index.css` - Added modern slider styling

**✅ Technical Implementation Completed:**
  1. **Budget Input UI** ✅
     - Dynamic budget slider ($25-$500 range)
     - 5 preset buttons for common budget ranges
     - Real-time budget display
     - Only shows when "Budget Friendly" archetype is selected

  2. **AI Generation Integration** ✅
     - Custom budget passed through to `getArchetypeRules()`
     - Dynamic max card price calculation (5-15% of total budget)
     - Budget-specific AI prompts with card recommendations
     - Tiered budget guidance (Ultra-budget, Budget, Optimized Budget, High Budget)

  3. **Enhanced Budget Validation** ✅
     - Total deck cost validation
     - Individual card price limits
     - Budget utilization feedback
     - Expensive card identification for replacement suggestions

**🚀 Features Implemented:**
- **Budget Range:** $25 (Ultra Budget) to $500 (High Budget)
- **Dynamic Pricing:** Max card price scales with budget (e.g., $50 budget = $5 max per card)
- **Smart Recommendations:** AI suggests budget-appropriate cards based on selected amount
- **Visual Feedback:** Budget amount shown in button text and progress descriptions
- **Preset Options:** Quick selection for common budget ranges

**🎯 User Experience:**
- Budget controls only appear when "Budget Friendly" is selected
- Slider with preset buttons for easy selection
- Dynamic descriptions based on budget level
- Real-time budget display in generation button

**Expected Result:** ✅ **WORKING AS DESIGNED**
- Users can now set custom budgets from $25 to $500
- AI generates budget-appropriate decks with proper cost constraints
- Budget validation provides detailed feedback on deck cost optimization

---

## 📊 Analytics & Feedback Visibility

### 10. Infinite Combo Warnings Lack Context
- **Problem:** Warning symbols for combos have no explanation.

**🔧 Implementation Strategy:**
- **Files to modify:**
  - `src/components/ui/GameChangerTooltip.jsx` - Expand for combo explanations
  - `src/components/deckstats/analyzers/bracketAnalyzer.js` - Add combo detection
  - `src/components/deck/DeckAnalytics.jsx` - Add combo section

- **Technical Approach:**
  1. **Create Combo Detection System**
     ```javascript
     // New service: src/services/comboDetectionService.js
     export const detectCombos = (cards) => {
       const knownCombos = {
         'Dramatic Reversal + Isochron Scepter': {
           cards: ['Dramatic Reversal', 'Isochron Scepter'],
           description: 'Infinite mana with 3+ mana from artifacts',
           type: 'mana',
           setupCost: 'Low'
         },
         'Thassa\'s Oracle + Demonic Consultation': {
           cards: ['Thassa\'s Oracle', 'Demonic Consultation'],
           description: 'Instant win by exiling library',
           type: 'win',
           setupCost: 'Medium'
         }
         // Add more known combos...
       };
       
       return findCombosInDeck(cards, knownCombos);
     };
     ```

  2. **Enhanced Tooltip System**
     ```jsx
     // Expand GameChangerTooltip.jsx or create ComboTooltip.jsx
     const ComboTooltip = ({ combo, card }) => (
       <div className="combo-tooltip">
         <h4>Combo Component</h4>
         <p><strong>Combo:</strong> {combo.name}</p>
         <p><strong>Effect:</strong> {combo.description}</p>
         <p><strong>Other pieces needed:</strong></p>
         <ul>
           {combo.otherCards.map(card => <li key={card}>{card}</li>)}
         </ul>
         <p><strong>Setup difficulty:</strong> {combo.setupCost}</p>
       </div>
     );
     ```

  3. **Integrate with Deck Analytics**
     - Add "Combos" section to deck stats
     - Show all detected combos with explanations
     - Color-code by combo type (mana, draw, win)

**Implementation Steps:**
1. Research and compile comprehensive combo database
2. Create combo detection service
3. Enhance tooltip system with detailed explanations
4. Add combo analytics section to deck stats
5. Test with known combo decks

---

## ✅ Implementation Priority Summary

### 🔥 **High Priority (Immediate Impact)**
1. **Color identity filtering for lands in AI decks** - Critical legality issue
2. **Action buttons placement** - User experience improvement  
3. **Manual commander selection post-import** - Complete existing partial implementation
4. **Budget slider integration** - Popular feature request

### 🚨 **Medium Priority (Quality of Life)**
5. **Deck Builder initialization** - Reduce user confusion
6. **Enhanced import error handling** - Better user experience
7. **Infinite combo explanations** - Educational value
8. **Analytics colorless mana fix** - Data accuracy

### 🔍 **Low Priority (Verification Needed)**
9. **Archidekt import support** - May already work, needs testing
10. **Import error logging** - Internal development tool

---

## 🛠️ **Technical Implementation Notes**

### **Code Quality Standards:**
- All changes should include comprehensive error handling
- Add TypeScript types where applicable
- Include unit tests for new functions
- Follow existing component patterns and styling
- Ensure mobile responsiveness
- Add loading states for async operations

### **Testing Strategy:**
- Test each improvement with multiple commanders
- Verify edge cases (colorless commanders, partner commanders, etc.)
- Test import functionality with various deck formats
- Validate AI generation with different budget ranges
- Test responsive design on mobile devices

### **Performance Considerations:**
- Cache combo detection results
- Optimize color identity validation
- Minimize re-renders in deck analytics
- Consider lazy loading for large deck lists

**Prepared by:** Claude Sonnet 4  
**Date:** January 2, 2025  
**Status:** Ready for Implementation Review
