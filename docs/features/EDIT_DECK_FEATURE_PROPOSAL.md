# Edit Deck Feature - Complete Implementation Proposal

## Executive Summary

This proposal outlines a **focused, core Edit Deck feature** that eliminates the current redirect-based editing workflow and provides essential in-place deck editing directly within the DeckViewer component. The feature prioritizes **immediate value delivery** through core functionality while leveraging existing infrastructure for rapid implementation.

## Current State Analysis

### Current Issues
- **Context Loss**: "Edit Deck" button redirects to `/builder`, losing deck context
- **Poor UX**: Users must manually reload their deck or start over
- **Inefficient Workflow**: Requires navigation away from deck view
- **No In-Place Editing**: Cannot make quick adjustments while viewing deck

### Existing Infrastructure (Strengths)
- **Robust DeckContext**: Full GHL integration, card management, categories
- **Comprehensive Components**: DeckBuilder, SearchBar, CardCategory, modals
- **Tabbed Interface**: Already supports Cards, Analytics, Export, Share tabs
- **Card Display**: Category view, list view, card detail modals
- **Authentication**: User management and subscription handling

## Proposed Solution: Edit Mode Toggle

### Core Concept
Transform the DeckViewer into a dual-mode interface:
- **View Mode** (current): Read-only deck viewing with analytics
- **Edit Mode** (new): Full editing capabilities with live updates

## Feature Specifications

### 1. Edit Mode Toggle System

#### Toggle Implementation
```jsx
// State management
const [isEditMode, setIsEditMode] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [editBuffer, setEditBuffer] = useState(null); // Temporary changes before save
```

#### Mode Switching
- **Enter Edit Mode**: Transform "Edit Deck" button to toggle edit mode ON
- **Exit Edit Mode**: Provide "View Mode" button + save/discard options
- **Unsaved Changes Warning**: Prevent accidental data loss

### 2. Enhanced User Interface

#### Edit Mode Visual Indicators
- **Header Badge**: "EDITING" badge with orange/yellow accent
- **Background Overlay**: Subtle darkening with edit-specific styling
- **Button States**: Primary actions change to save/cancel/discard
- **Card Interactions**: Hover states show edit options (quantity, remove, category)

#### Edit Mode Tab Structure
```
┌─────────────────────────────────────────────────┐
│  [View Mode] [EDITING - Unsaved Changes]        │
├─────────────────────────────────────────────────┤
│  Cards(99) │ Search & Add │ Analytics │ Settings │
├─────────────────────────────────────────────────┤
│  ✓ Save Changes │ ↶ Discard │ ✕ Cancel Edit    │
└─────────────────────────────────────────────────┘
```

### 3. Core Editing Features

#### 3.1 Card Quantity Management
- **Inline Quantity Controls**: +/- buttons on card hover
- **Bulk Quantity Modal**: Multi-card quantity adjustment
- **Quantity Validation**: Enforce format rules (max 4 copies, basic lands unlimited)
- **Real-time Updates**: Live count updates in deck totals

#### 3.2 Card Addition System
**New "Search & Add" Tab**:
- **Integrated Search**: Full Scryfall search within edit mode
- **Quick Add**: One-click card addition with quantity selector
- **Recently Added**: Show last 10 added cards for easy removal

#### 3.3 Card Removal System
- **Hover Controls**: Remove button appears on card hover
- **Bulk Removal**: Multi-select with bulk remove option
- **Category Removal**: Remove entire categories
- **Confirmation Modals**: Prevent accidental removal of expensive/key cards

#### 3.4 Card Category Management
- **Basic Category Assignment**: Simple dropdown to change card categories
- **Bulk Categorization**: Select multiple cards → assign category

### 4. Core System Integration

#### 4.1 Basic Validation
- **Format Compliance**: Basic deck size and format checking
- **Simple Warnings**: Alert users to common issues (deck size, duplicates)

#### 4.2 Import Integration
- **Import Cards**: Leverage existing DeckImporter component

### 5. GHL Integration & Data Management

#### 5.1 Save Strategy
```javascript
// Multi-tier saving approach
const saveDeck = async () => {
  setIsSaving(true);
  try {
    // 1. Optimistic local save
    await saveToLocalStorage(editBuffer);
    
    // 2. GHL cloud save
    const result = await saveCurrentDeckToGHL(
      currentUser.id, 
      commander.name, 
      deckName, 
      editBuffer
    );
    
    if (result.success) {
      setHasUnsavedChanges(false);
      setEditBuffer(null);
      showSuccessMessage('Deck saved successfully!');
    }
  } catch (error) {
    // Fallback: Keep local changes, show retry option
    showErrorMessage('Cloud save failed. Changes saved locally.');
  } finally {
    setIsSaving(false);
  }
};
```

#### 5.2 Simple Auto-Save
- **Basic Auto-Save**: Save to localStorage every 30 seconds
- **Manual Save**: Primary save button for GHL sync

### 6. Essential UX Features

#### 6.1 Basic Responsiveness
- **Mobile-Friendly**: Ensure edit controls work on mobile
- **Touch Targets**: Appropriately sized buttons for touch

#### 6.2 Core Accessibility
- **Keyboard Navigation**: Basic keyboard support
- **Focus Management**: Logical tab order

### 7. Component Architecture

#### 7.1 New Components (Core Only)
```
src/components/deck/edit/
├── EditModeToggle.jsx          # Main edit mode controller
├── CardQuantityControls.jsx    # Inline +/- controls
├── CardSearchPanel.jsx         # Integrated search interface
├── BulkEditModal.jsx          # Multi-card operations
└── UnsavedChangesWarning.jsx  # Data loss prevention
```

#### 7.2 Enhanced Existing Components
- **DeckViewer.jsx**: Add edit mode state and controls
- **CardCategory.jsx**: Add inline editing capabilities
- **DeckContext.jsx**: Extend with edit buffer management
- **SearchResults.jsx**: Add "Add to Deck" quick actions

### 8. Streamlined Implementation Phases

#### Phase 1: Core Edit Mode (Week 1)
- [ ] Edit mode toggle functionality
- [ ] Basic card quantity controls (+/- buttons)
- [ ] Simple card removal (hover + click)
- [ ] Save/discard workflow
- [ ] Unsaved changes warning

#### Phase 2: Search & Add (Week 2)
- [ ] Integrated card search tab
- [ ] Quick add functionality
- [ ] Recently added cards panel

#### Phase 3: Essential Features (Week 3)
- [ ] Bulk operations modal (select multiple cards)
- [ ] Basic category management
- [ ] Auto-save to localStorage
- [ ] Mobile responsiveness

### 9. Technical Implementation Details

#### 9.1 Simplified State Management
```javascript
// Core edit state in DeckViewer component
const [isEditMode, setIsEditMode] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [selectedCards, setSelectedCards] = useState(new Set()); // For bulk operations

// Leverage existing DeckContext functions:
// - addCard, removeCard, updateCardQuantity
// - saveCurrentDeckToGHL
// - updateCardCategory
```

#### 9.2 Leverage Existing API
```javascript
// Use existing DeckContext functions - no new API needed
const { 
  addCard, 
  removeCard, 
  updateCardQuantity,
  saveCurrentDeckToGHL,
  updateCardCategory 
} = useDeck();

// Simple localStorage for drafts
const saveDraft = () => {
  localStorage.setItem(`deck_draft_${deckId}`, JSON.stringify({
    cards,
    commander,
    lastSaved: Date.now()
  }));
};
```

### 10. UI/UX Design Specifications

#### 10.1 Color Scheme
- **Edit Mode Accent**: Orange (#f97316) for edit indicators
- **Success States**: Green (#10b981) for saved changes
- **Warning States**: Yellow (#f59e0b) for unsaved changes
- **Danger States**: Red (#ef4444) for removal actions

#### 10.2 Animation & Transitions
- **Mode Transition**: 300ms fade between view/edit modes
- **Card Hover**: 150ms scale transform on hover
- **Button States**: 200ms color transitions
- **Loading States**: Skeleton loaders during operations

#### 10.3 Responsive Breakpoints
```css
/* Mobile First Approach */
.edit-controls {
  /* Base: Mobile (320px+) */
  
  @media (min-width: 640px) {
    /* Small tablet */
  }
  
  @media (min-width: 768px) {
    /* Tablet */
  }
  
  @media (min-width: 1024px) {
    /* Desktop */
  }
}
```

### 11. Quality Assurance & Testing

#### 11.1 Test Coverage Areas
- **Edit Mode Transitions**: Enter/exit edit mode
- **Card Operations**: Add/remove/quantity changes
- **Data Persistence**: Local and GHL saving
- **Conflict Resolution**: Simultaneous edit handling
- **Performance**: Large deck handling
- **Mobile Experience**: Touch interactions

#### 11.2 User Acceptance Criteria
- [ ] Can enter edit mode without page reload
- [ ] Can add cards through integrated search
- [ ] Can modify card quantities inline
- [ ] Can remove cards with confirmation
- [ ] Can save changes to cloud storage
- [ ] Can discard unsaved changes
- [ ] Mobile experience is fully functional
- [ ] No data loss during edit sessions

### 12. Security & Data Integrity

#### 12.1 Data Validation
- **Client-side Validation**: Immediate feedback on invalid operations
- **Server-side Validation**: GHL API validates all changes
- **Sanitization**: Clean all user inputs before processing
- **Rate Limiting**: Prevent API abuse during editing

#### 12.2 Conflict Resolution
- **Version Checking**: Detect concurrent edits
- **Merge Strategies**: Intelligent conflict resolution
- **User Choice**: Allow manual conflict resolution
- **Backup Strategy**: Always maintain edit history

### 13. Performance Metrics & Monitoring

#### 13.1 Key Performance Indicators
- **Edit Mode Load Time**: < 500ms to enter edit mode
- **Search Response Time**: < 300ms for card search results
- **Save Operation Time**: < 2s for typical deck saves
- **Mobile Touch Response**: < 100ms touch feedback

#### 13.2 Analytics Tracking
- **Feature Usage**: Track edit mode adoption
- **User Flows**: Monitor common editing patterns
- **Error Rates**: Track save failures and recoveries
- **Performance**: Monitor load times and bottlenecks

## Conclusion

This **focused Edit Deck feature** will eliminate the current redirect workflow and provide essential in-place editing capabilities. By prioritizing core functionality and leveraging existing infrastructure, we can deliver immediate value to users within 3 weeks while maintaining full GHL integration.

The streamlined approach ensures rapid delivery of working functionality that users need most: **edit mode toggle, card quantity management, search & add, and basic bulk operations**. Advanced features can be added iteratively based on user feedback and usage patterns. 