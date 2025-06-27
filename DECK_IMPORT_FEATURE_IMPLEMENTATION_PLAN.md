# MTG Deck Import Feature - Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding comprehensive deck import functionality to the MTG Commander deck builder application. The feature will support multiple import formats, provide intelligent card resolution, and integrate seamlessly with the existing validation and deck management systems.

## Current System Analysis

### Existing Architecture
- **DeckContext**: State management with `IMPORT_DECK` action already implemented
- **DeckExporter**: Export functionality for text and Moxfield formats
- **Validation System**: AI-powered validation with centralized legality service
- **Card Cache**: Efficient card data storage and retrieval
- **Scryfall Integration**: Card search and data fetching

### Current Deck Data Structure
```javascript
{
  id: "unique_identifier",
  name: "Deck Name", 
  description: "Optional description",
  commander: { /* Full Scryfall card object */ },
  cards: [{ /* Card objects with quantity property */ }],
  cardCategories: { cardId: "category_name" },
  lastUpdated: "2025-01-01T00:00:00.000Z"
}
```

## Feature Requirements

### Core Functionality
1. **Multi-Format Support**
   - Plain text deck lists
   - Moxfield format
   - EDHREC format
   - MTGGoldfish format
   - Archidekt format
   - Generic quantity-based formats

2. **Import Methods**
   - File upload (drag & drop)
   - Clipboard paste
   - URL import from major platforms
   - Batch import for multiple decks

3. **Smart Processing**
   - Automatic format detection
   - Intelligent commander identification
   - Fuzzy card name matching
   - Category auto-assignment

4. **Validation & Error Handling**
   - Format compliance checking
   - Unresolved card reporting
   - Duplicate detection
   - Graceful failure recovery

## Implementation Architecture

### 1. Core Import Service

**File**: `src/services/deckImportService.js`

```javascript
// Format Detection Engine
const FORMAT_PATTERNS = {
  moxfield: /^Commander:\s*(.+)$/m,
  edhrec: /^1x?\s+(.+)\s+\*CMDR\*$/m,
  mtggoldfish: /^Deck$/m,
  archidekt: /^Commander\s*\(1\)$/m,
  generic: /^\d+x?\s+(.+)$/m
};

// Card Resolution with Fuzzy Matching
const resolveCardName = async (cardName, options = {}) => {
  try {
    // 1. Exact match from cache
    const cached = getCachedCardByName(cardName);
    if (cached) return cached;
    
    // 2. Clean name for better matching
    const cleanName = cardName
      .replace(/^\d+x?\s+/, '')     // Remove quantity
      .replace(/\s*\/\/.*$/, '')    // Remove flip card back
      .replace(/\s*\*.*\*$/, '')    // Remove format markers
      .replace(/\s*\([^)]*\)$/, '') // Remove set info
      .trim();
    
    // 3. Scryfall exact search
    const exactMatch = await searchCardByName(cleanName);
    if (exactMatch) {
      cacheCard(exactMatch);
      return exactMatch;
    }
    
    // 4. Scryfall fuzzy search
    const fuzzyMatch = await scryfallFuzzySearch(cleanName);
    if (fuzzyMatch) {
      cacheCard(fuzzyMatch);
      return fuzzyMatch;
    }
    
    return null;
  } catch (error) {
    console.warn(`Card resolution failed: ${cardName}`, error);
    return null;
  }
};

// Main Import Function
export const importDeckFromText = async (content, options = {}) => {
  const format = detectDeckFormat(content);
  const parsed = await parseByFormat(content, format);
  
  // Progress tracking
  const totalCards = parsed.cards.length + (parsed.commander ? 1 : 0);
  let processedCards = 0;
  
  const updateProgress = (stage, cardName = '') => {
    if (options.onProgress) {
      options.onProgress({
        stage,
        current: processedCards,
        total: totalCards,
        cardName,
        format
      });
    }
  };
  
  updateProgress('parsing');
  
  // Resolve commander
  let commander = null;
  if (parsed.commander) {
    updateProgress('resolving', parsed.commander);
    commander = await resolveCardName(parsed.commander);
    processedCards++;
  }
  
  // Resolve cards
  const resolvedCards = [];
  const unresolvedCards = [];
  
  for (const cardData of parsed.cards) {
    updateProgress('resolving', cardData.name);
    
    const resolved = await resolveCardName(cardData.name);
    if (resolved) {
      resolvedCards.push({
        ...resolved,
        quantity: cardData.quantity || 1
      });
    } else {
      unresolvedCards.push(cardData.name);
    }
    
    processedCards++;
  }
  
  // Auto-detect commander if not specified
  if (!commander && resolvedCards.length > 0) {
    commander = detectCommanderFromCards(resolvedCards);
  }
  
  // Validate if commander found
  let validation = null;
  if (commander) {
    updateProgress('validating');
    validation = await validateDeckWithAI(resolvedCards, commander);
  }
  
  updateProgress('complete');
  
  return {
    commander,
    cards: resolvedCards,
    unresolvedCards,
    validation,
    format,
    stats: {
      totalRequested: totalCards,
      resolved: resolvedCards.length + (commander ? 1 : 0),
      unresolved: unresolvedCards.length + (commander && !commander ? 1 : 0)
    }
  };
};
```

### 2. Format Parsers

```javascript
const PARSERS = {
  moxfield: (content) => {
    const lines = content.split('\n').filter(l => l.trim());
    
    const commanderLine = lines.find(l => l.startsWith('Commander:'));
    const commander = commanderLine?.replace('Commander:', '').trim();
    
    const cards = lines
      .filter(l => /^\d+\s+/.test(l) && !l.startsWith('Commander:'))
      .map(l => {
        const match = l.match(/^(\d+)\s+(.+)$/);
        return match ? { name: match[2], quantity: parseInt(match[1]) } : null;
      })
      .filter(Boolean);
    
    return { commander, cards };
  },
  
  edhrec: (content) => {
    const lines = content.split('\n').filter(l => l.trim());
    let commander = null;
    const cards = [];
    
    for (const line of lines) {
      if (line.includes('*CMDR*')) {
        const match = line.match(/^(\d+)x?\s+(.+?)\s+\*CMDR\*/);
        if (match) commander = match[2];
      } else {
        const match = line.match(/^(\d+)x?\s+(.+)$/);
        if (match) {
          cards.push({ name: match[2], quantity: parseInt(match[1]) });
        }
      }
    }
    
    return { commander, cards };
  },
  
  generic: (content) => {
    const lines = content.split('\n').filter(l => l.trim());
    let commander = null;
    const cards = [];
    let currentSection = 'mainboard';
    
    for (const line of lines) {
      // Skip comments
      if (line.startsWith('//') || line.startsWith('#')) {
        if (line.toLowerCase().includes('commander')) {
          currentSection = 'commander';
        }
        continue;
      }
      
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        
        if (currentSection === 'commander' || (quantity === 1 && !commander)) {
          commander = name;
          currentSection = 'mainboard';
        } else {
          cards.push({ name, quantity });
        }
      }
    }
    
    return { commander, cards };
  }
};
```

### 3. Import UI Component

**File**: `src/components/deck/DeckImporter.jsx`

```javascript
const DeckImporter = ({ onImportComplete, onClose }) => {
  const [importMethod, setImportMethod] = useState('file');
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [pasteContent, setPasteContent] = useState('');
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processImport = async (content, fileName = 'Imported Deck') => {
    setIsProcessing(true);
    setErrors([]);
    
    try {
      const result = await importDeckFromText(content, {
        onProgress: setImportProgress
      });
      
      setImportResult({
        ...result,
        name: fileName.replace(/\.[^/.]+$/, ''),
        description: `Imported from ${result.format} format`
      });
      
    } catch (error) {
      setErrors([`Import failed: ${error.message}`]);
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };
  
  const handleFileUpload = async (file) => {
    try {
      const content = await file.text();
      await processImport(content, file.name);
    } catch (error) {
      setErrors([`Failed to read file: ${error.message}`]);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-400">Import Deck</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Method Selection */}
        <div className="mb-6">
          <div className="flex space-x-2 mb-4">
            {[
              { id: 'file', label: 'Upload File', icon: '📁' },
              { id: 'paste', label: 'Paste Text', icon: '📋' },
              { id: 'url', label: 'From URL', icon: '🔗' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setImportMethod(method.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  importMethod === method.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{method.icon}</span>
                <span>{method.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Import Interface */}
        {importMethod === 'file' && (
          <FileUploadZone 
            onFileUpload={handleFileUpload}
            disabled={isProcessing}
          />
        )}
        
        {importMethod === 'paste' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Paste Deck List
            </label>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your deck list here..."
              className="w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
              disabled={isProcessing}
            />
            <button
              onClick={() => processImport(pasteContent)}
              disabled={!pasteContent.trim() || isProcessing}
              className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              Import from Clipboard
            </button>
          </div>
        )}
        
        {/* Progress Display */}
        {importProgress && (
          <ImportProgressDisplay progress={importProgress} />
        )}
        
        {/* Results Display */}
        {importResult && (
          <ImportResultsDisplay 
            result={importResult}
            onConfirm={() => {
              onImportComplete(importResult);
              onClose();
            }}
            onCancel={() => setImportResult(null)}
          />
        )}
        
        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <h3 className="text-red-400 font-semibold mb-2">Import Errors</h3>
            {errors.map((error, index) => (
              <p key={index} className="text-gray-300">{error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. File Upload Zone

**File**: `src/components/ui/FileUploadZone.jsx`

```javascript
const FileUploadZone = ({ onFileUpload, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => 
      file.type === 'text/plain' || 
      file.name.endsWith('.txt') || 
      file.name.endsWith('.dec')
    );
    
    if (textFile) {
      onFileUpload(textFile);
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        disabled 
          ? 'border-gray-700 bg-gray-800/50 opacity-50'
          : isDragOver
          ? 'border-primary-400 bg-primary-400/10'
          : 'border-gray-600 hover:border-gray-500'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-4xl mb-4">📁</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {disabled ? 'Processing...' : 'Drop your deck file here'}
      </h3>
      <p className="text-gray-400 mb-4">
        Supports .txt, .dec files from popular deck builders
      </p>
      <button
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Choose File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.dec"
        onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};
```

### 5. Integration with DeckBuilder

**Modification to**: `src/pages/DeckBuilder.jsx`

```javascript
// Add state for import modal
const [isImportModalOpen, setIsImportModalOpen] = useState(false);

// Add import completion handler
const handleImportComplete = (importedDeck) => {
  const { commander, cards, name, description, unresolvedCards } = importedDeck;
  
  // Import the deck
  importDeck({
    commander,
    cards,
    name: name || 'Imported Deck',
    description: description || '',
    cardCategories: {} // Will be auto-assigned
  });
  
  // Show results
  let message = `Successfully imported "${name}" with ${cards.length} cards.`;
  if (unresolvedCards.length > 0) {
    message += ` ${unresolvedCards.length} cards could not be resolved.`;
  }
  
  setAlertModalConfig({
    title: 'Import Complete',
    message,
    onConfirm: () => setIsAlertModalOpen(false),
    confirmText: 'OK',
    showCancelButton: false,
  });
  setIsAlertModalOpen(true);
};

// Add import button to deck controls
const deckSaveControls = (
  <div className="flex gap-2 mb-4">
    {/* Existing save controls */}
    <button
      onClick={() => setIsImportModalOpen(true)}
      className="btn-modern btn-modern-secondary"
    >
      Import Deck
    </button>
  </div>
);

// Add import modal
{isImportModalOpen && (
  <DeckImporter
    onImportComplete={handleImportComplete}
    onClose={() => setIsImportModalOpen(false)}
  />
)}
```

## Advanced Features

### 1. Smart Commander Detection

```javascript
const detectCommanderFromCards = (cards) => {
  // Priority order for commander detection
  const candidates = cards.filter(card => {
    const typeLine = card.type_line?.toLowerCase() || '';
    const oracleText = card.oracle_text?.toLowerCase() || '';
    
    return (
      // Legendary creatures
      (typeLine.includes('legendary') && typeLine.includes('creature')) ||
      // Planeswalkers that can be commanders
      (typeLine.includes('planeswalker') && oracleText.includes('can be your commander')) ||
      // Known commander-only cards
      oracleText.includes('can be your commander')
    );
  });
  
  // If only one candidate, that's likely the commander
  if (candidates.length === 1) {
    return candidates[0];
  }
  
  // If multiple candidates, prefer legendary creatures
  const legendaryCreatures = candidates.filter(card =>
    card.type_line?.includes('Legendary') && card.type_line?.includes('Creature')
  );
  
  return legendaryCreatures[0] || candidates[0] || null;
};
```

### 2. Batch Processing for Large Imports

```javascript
const batchProcessCards = async (cardNames, batchSize = 10) => {
  const results = [];
  
  for (let i = 0; i < cardNames.length; i += batchSize) {
    const batch = cardNames.slice(i, i + batchSize);
    const promises = batch.map(name => resolveCardName(name));
    
    try {
      const batchResults = await Promise.allSettled(promises);
      results.push(...batchResults.map((result, index) => ({
        name: batch[index],
        card: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      })));
    } catch (error) {
      console.error('Batch processing error:', error);
    }
    
    // Rate limiting to respect API limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};
```

### 3. URL Import Support

```javascript
const URL_IMPORTERS = {
  moxfield: {
    pattern: /moxfield\.com\/decks\/([^\/\?]+)/,
    import: async (deckId) => {
      // Note: This would require CORS proxy or API access
      const response = await fetch(`/api/proxy/moxfield/${deckId}`);
      const data = await response.json();
      return convertMoxfieldData(data);
    }
  },
  
  edhrec: {
    pattern: /edhrec\.com\/decks\/([^\/\?]+)/,
    import: async (deckId) => {
      // Similar implementation
    }
  }
};

const importFromUrl = async (url) => {
  for (const [platform, importer] of Object.entries(URL_IMPORTERS)) {
    const match = url.match(importer.pattern);
    if (match) {
      return await importer.import(match[1]);
    }
  }
  throw new Error('Unsupported URL format');
};
```

## Error Handling & UX

### 1. Progress Feedback Component

```javascript
const ImportProgressDisplay = ({ progress }) => {
  const getStageLabel = (stage) => {
    const labels = {
      parsing: 'Analyzing deck format',
      resolving: 'Resolving cards',
      validating: 'Validating deck',
      complete: 'Import complete'
    };
    return labels[stage] || 'Processing';
  };
  
  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">
          {getStageLabel(progress.stage)}
        </span>
        <span className="text-gray-400 text-sm">
          {progress.current}/{progress.total} ({progressPercent}%)
        </span>
      </div>
      
      {progress.cardName && (
        <p className="text-gray-400 text-sm mb-2">
          Resolving: {progress.cardName}
        </p>
      )}
      
      <div className="w-full bg-gray-600 rounded-full h-2">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
```

### 2. Results Display Component

```javascript
const ImportResultsDisplay = ({ result, onConfirm, onCancel }) => {
  const { commander, cards, unresolvedCards, validation, stats } = result;
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-4">Import Results</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
          <div className="text-sm text-gray-400">Resolved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.unresolved}</div>
          <div className="text-sm text-gray-400">Unresolved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{cards.length}</div>
          <div className="text-sm text-gray-400">Total Cards</div>
        </div>
      </div>
      
      {/* Commander */}
      {commander && (
        <div className="mb-4">
          <h4 className="font-semibold text-primary-400 mb-2">Commander</h4>
          <div className="flex items-center space-x-2">
            <span className="text-white">{commander.name}</span>
            <span className="text-gray-400">({commander.type_line})</span>
          </div>
        </div>
      )}
      
      {/* Unresolved Cards */}
      {unresolvedCards.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-red-400 mb-2">
            Unresolved Cards ({unresolvedCards.length})
          </h4>
          <div className="max-h-32 overflow-y-auto">
            {unresolvedCards.map((cardName, index) => (
              <div key={index} className="text-gray-300 text-sm">
                • {cardName}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Validation Results */}
      {validation && !validation.isValid && (
        <div className="mb-4">
          <h4 className="font-semibold text-yellow-400 mb-2">Validation Issues</h4>
          <div className="text-sm text-gray-300">
            {validation.summary?.deck_assessment || 'Deck has validation issues'}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Import Deck
        </button>
      </div>
    </div>
  );
};
```

## Testing Strategy

### 1. Unit Tests

```javascript
// src/services/__tests__/deckImportService.test.js
describe('Deck Import Service', () => {
  describe('Format Detection', () => {
    test('detects Moxfield format', () => {
      const content = 'Commander: Alesha, Who Smiles at Death\n\n1 Sol Ring';
      expect(detectDeckFormat(content)).toBe('moxfield');
    });
    
    test('detects generic format', () => {
      const content = '1 Sol Ring\n1 Command Tower';
      expect(detectDeckFormat(content)).toBe('generic');
    });
  });
  
  describe('Card Resolution', () => {
    test('resolves exact card names', async () => {
      const card = await resolveCardName('Sol Ring');
      expect(card).toBeTruthy();
      expect(card.name).toBe('Sol Ring');
    });
    
    test('handles unresolvable cards', async () => {
      const card = await resolveCardName('Nonexistent Card');
      expect(card).toBeNull();
    });
  });
  
  describe('Commander Detection', () => {
    test('detects legendary creatures as commanders', () => {
      const cards = [
        { name: 'Sol Ring', type_line: 'Artifact' },
        { name: 'Alesha, Who Smiles at Death', type_line: 'Legendary Creature — Human Warrior' }
      ];
      const commander = detectCommanderFromCards(cards);
      expect(commander.name).toBe('Alesha, Who Smiles at Death');
    });
  });
});
```

### 2. Integration Tests

```javascript
describe('Import Integration', () => {
  test('imports complete deck successfully', async () => {
    const deckContent = `Commander: Alesha, Who Smiles at Death
    
1 Sol Ring
1 Command Tower
1 Path to Exile`;
    
    const result = await importDeckFromText(deckContent);
    
    expect(result.commander).toBeTruthy();
    expect(result.cards).toHaveLength(3);
    expect(result.unresolvedCards).toHaveLength(0);
  });
});
```

## Performance Optimization

### 1. Caching Strategy
- **Card Cache**: Leverage existing card cache system
- **Format Cache**: Cache parsed deck formats for repeat imports
- **Batch Processing**: Process cards in batches to avoid API rate limits

### 2. Memory Management
- **Streaming**: Process large files in chunks
- **Cleanup**: Clear temporary data after import
- **Error Boundaries**: Prevent memory leaks from failed imports

## Security Considerations

### 1. Input Validation
- **File Size Limits**: Maximum 1MB for text files
- **Content Sanitization**: Strip potentially dangerous content
- **Format Validation**: Verify file formats before processing

### 2. Rate Limiting
- **API Throttling**: Respect Scryfall API rate limits
- **User Limits**: Prevent abuse with import frequency limits

## Deployment Timeline

### Phase 1: Core Import (Week 1-2)
- [ ] Implement `deckImportService.js`
- [ ] Create basic import UI components
- [ ] Add file upload functionality
- [ ] Integrate with existing DeckContext

### Phase 2: Enhanced Parsing (Week 3)
- [ ] Add support for multiple deck formats
- [ ] Implement fuzzy card name matching
- [ ] Add commander auto-detection
- [ ] Create comprehensive error handling

### Phase 3: Advanced Features (Week 4)
- [ ] Add clipboard import functionality
- [ ] Implement progress feedback
- [ ] Add validation integration
- [ ] Create comprehensive test suite

### Phase 4: Polish & Testing (Week 5)
- [ ] Performance optimization
- [ ] User experience improvements
- [ ] Security hardening
- [ ] Documentation and deployment

## Success Metrics

### Technical Metrics
- **Import Success Rate**: >95% for standard formats
- **Card Resolution Rate**: >90% for common cards
- **Performance**: <5 seconds for 100-card imports
- **Error Rate**: <2% for supported formats

### User Experience Metrics
- **Feature Adoption**: Track import usage vs manual building
- **User Satisfaction**: Collect feedback on import experience
- **Support Tickets**: Monitor import-related issues

## Conclusion

This implementation plan provides a comprehensive approach to adding robust deck import functionality that integrates seamlessly with the existing MTG deck builder. The phased development approach ensures manageable implementation while delivering immediate value to users.

The focus on multiple format support, intelligent card resolution, and excellent error handling will create a professional-grade import system that enhances the overall deck building experience.

## Deck Import Feature Implementation Plan

### 1. Import Format Support
- Implement parsers for common deck formats:
  - Plain text format (current export format)
  - Moxfield format
  - Archidekt format
  - TappedOut format
  - MTGGoldfish format

### 2. Parser Implementation
- Create a unified parser interface
- Implement format detection
- Extract deck components:
  - Commander
  - Main deck cards
  - Categories/tags if available
  - Deck name and description

### 3. Card Data Resolution
- Resolve card names to full Scryfall data
- Handle alternate card names and versions
- Cache resolved card data
- Handle errors for unrecognized cards

### 4. Validation
- Validate imported deck against format rules
- Check commander legality
- Verify color identity compliance
- Ensure singleton rule compliance
- Handle validation errors gracefully

### 5. UI Implementation
- Add import button/interface
- Support drag-and-drop file import
- Show import progress indicator
- Display validation results
- Allow user to review and confirm import
- Provide error feedback

### 6. GoHighLevel Integration
- After successful import:
  1. Prompt user for deck name if not provided in import
  2. Use DeckContext's saveCurrentDeckToGHL function to save:
     - Commander name as GHL deck name field
     - Full deck data in deck_data field
     - Create user-deck association
  3. Update local state and UI
  4. Handle any GHL storage errors
  5. Update subscription usage metrics

### 7. Error Handling
- Graceful handling of:
  - Invalid file formats
  - Unrecognized cards
  - Network errors
  - GHL API errors
  - Storage limits
  - Validation failures

### 8. Testing
- Unit tests for parsers
- Integration tests for import flow
- Validation tests
- GHL integration tests
- Error handling tests

### 9. Documentation
- Document supported formats
- Add import instructions
- Update API documentation
- Document error codes and handling 