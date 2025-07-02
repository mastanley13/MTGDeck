# Deck Import Guide

## Overview

The MTG Commander Deck Builder now supports importing decks from various popular formats and platforms. This feature allows you to quickly import existing deck lists and continue building or analyzing them within our platform.

## Supported Formats

### 1. Moxfield Format
The most common format used by Moxfield.com:

```
Commander: Alesha, Who Smiles at Death

Main:
1 Sol Ring
1 Command Tower
1 Path to Exile
2 Mountain
1 Swamp

Sideboard:
1 Maybe Card
```

### 2. EDHREC Format
Used by EDHREC.com and some other platforms:

```
1x Alesha, Who Smiles at Death *CMDR*
1x Sol Ring
1x Command Tower
1x Path to Exile
2x Mountain
1x Swamp
```

### 3. Archidekt Format
Used by Archidekt.com:

```
Commander (1)
1 Alesha, Who Smiles at Death

Mainboard (99)
1 Sol Ring
1 Command Tower
1 Path to Exile
2 Mountain
1 Swamp

Sideboard (0)
```

### 4. TappedOut Format
Similar to EDHREC with *CMDR* notation:

```
1x Alesha, Who Smiles at Death *CMDR*
1x Sol Ring
1x Command Tower
```

### 5. MTGGoldfish Format
Used by MTGGoldfish.com:

```
Commander
1 Alesha, Who Smiles at Death

Deck
1 Sol Ring
1 Command Tower
1 Path to Exile

Sideboard
1 Maybe Card
```

### 6. Generic Text Format
A flexible format that works with most text-based deck lists:

```
// My Alesha Deck
// Commander
1 Alesha, Who Smiles at Death

// Ramp
1 Sol Ring
1 Command Tower

// Removal
1 Path to Exile
1 Swords to Plowshares
```

## How to Import

### Method 1: File Upload
1. Click the "Import Deck" button in the deck builder
2. Select "Upload File" tab
3. Drag and drop your deck file (.txt or .dec) or click "Choose File"
4. The system will automatically detect the format and process your deck

### Method 2: Copy & Paste
1. Click the "Import Deck" button in the deck builder
2. Select "Paste Text" tab
3. Copy your deck list from another platform
4. Paste it into the text area
5. Click "Import from Clipboard"

### Method 3: URL Import (Coming Soon)
1. Click the "Import Deck" button in the deck builder
2. Select "From URL" tab
3. Enter the URL of your deck from supported platforms
4. Click "Import from URL"

## Import Process

### 1. Format Detection
The system automatically detects which format your deck list uses based on patterns and keywords.

### 2. Card Resolution
Each card name is resolved against the Scryfall database:
- **Exact Match**: Direct name lookup
- **Fuzzy Match**: Handles minor spelling variations
- **Cache Lookup**: Previously resolved cards load instantly

### 3. Commander Detection
If no commander is explicitly marked, the system will:
- Look for legendary creatures
- Check for planeswalkers that can be commanders
- Select the most likely candidate

### 4. Validation
The imported deck is validated for:
- Commander format legality
- Color identity compliance
- Singleton rule adherence
- Minimum/maximum deck size

### 5. Cloud Storage
If you're logged in, the imported deck is automatically:
- Saved to your GoHighLevel account
- Associated with your user profile
- Available across all your devices

## Import Results

After processing, you'll see:

### Success Metrics
- **Resolved**: Cards successfully found and added
- **Unresolved**: Cards that couldn't be matched
- **Format**: Detected deck format
- **Commander**: Identified commander card

### Warnings & Errors
- **Unresolved Cards**: List of cards that couldn't be found
- **Validation Issues**: Format or rule violations
- **Size Warnings**: Deck too large or too small

### Actions
- **Import Deck**: Proceed with the import
- **Cancel**: Discard the import and try again

## Troubleshooting

### Common Issues

#### Cards Not Resolving
**Problem**: Some cards show as "unresolved"
**Solutions**:
- Check spelling and exact card names
- Use the full official card name
- Remove set information in parentheses
- Try alternative card names for reprints

#### Commander Not Detected
**Problem**: No commander found or wrong commander selected
**Solutions**:
- Ensure commander is marked properly (format-specific)
- Use the full legendary creature name
- Place commander at the top of the list
- Use proper format notation (*CMDR*, Commander:, etc.)

#### Format Not Detected
**Problem**: System uses generic format instead of specific format
**Solutions**:
- Include format-specific headers
- Use proper section dividers
- Follow exact format conventions
- Remove extra formatting or characters

#### Import Fails Completely
**Problem**: Import process fails with an error
**Solutions**:
- Check file encoding (use UTF-8)
- Remove special characters or symbols
- Ensure proper line breaks
- Try copy/paste instead of file upload

### Best Practices

1. **Clean Your Deck List**
   - Remove extra whitespace
   - Use consistent formatting
   - Remove non-card lines (descriptions, etc.)

2. **Use Standard Card Names**
   - Copy names exactly from Scryfall
   - Avoid nicknames or abbreviations
   - Include full card names with punctuation

3. **Mark Your Commander Clearly**
   - Use format-appropriate commander notation
   - Place commander at the beginning
   - Use only one commander (for standard Commander format)

4. **Check Before Importing**
   - Verify card count (usually 100 total)
   - Ensure all cards are Commander-legal
   - Check color identity compliance

## Advanced Features

### Batch Import
- Import multiple deck lists at once
- Useful for testing different builds
- Each deck saved separately

### Smart Categorization
- Cards automatically sorted by type
- Custom categories preserved when possible
- Manual recategorization after import

### Validation Integration
- AI-powered deck analysis
- Suggestions for improvements
- Format compliance checking

### Export Compatibility
- Imported decks can be exported to any supported format
- Maintains original structure when possible
- Adds proper formatting for target platform

## API Integration

For developers who want to integrate with our import system:

```javascript
import { importDeckFromText } from './services/deckImportService';

const result = await importDeckFromText(deckContent, {
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.current}/${progress.total}`);
  },
  validateDeck: true
});

if (result.commander && result.cards.length > 0) {
  // Import successful
  console.log(`Imported: ${result.commander.name} with ${result.cards.length} cards`);
} else {
  // Handle errors
  console.log('Import failed:', result.unresolvedCards);
}
```

## Support

If you encounter issues with deck importing:

1. **Check this guide** for common solutions
2. **Verify your format** against the examples above
3. **Try different import methods** (file vs. paste)
4. **Contact support** with your deck list for assistance

## Feedback

We're constantly improving the import system. Please let us know:
- Formats you'd like to see supported
- Platforms you import from frequently
- Issues you encounter regularly
- Features that would be helpful

Your feedback helps us make the import process better for everyone! 