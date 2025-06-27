import { importDeckFromText, detectDeckFormat } from '../services/deckImportService.js';

// Test deck lists in different formats
const testDecks = {
  moxfield: `Commander: Alesha, Who Smiles at Death

Main:
1 Sol Ring
1 Command Tower
1 Path to Exile
1 Swords to Plowshares
1 Lightning Bolt
1 Boros Charm
1 Mardu Charm
1 Zurgo Bellstriker
1 Karmic Guide
1 Reveillark`,

  edhrec: `1x Alesha, Who Smiles at Death *CMDR*
1x Sol Ring
1x Command Tower
1x Path to Exile
1x Swords to Plowshares
1x Lightning Bolt
1x Boros Charm
1x Mardu Charm
1x Zurgo Bellstriker
1x Karmic Guide
1x Reveillark`,

  generic: `// Alesha Reanimator Deck
// Commander
1 Alesha, Who Smiles at Death

// Ramp
1 Sol Ring
1 Command Tower

// Removal
1 Path to Exile
1 Swords to Plowshares
1 Lightning Bolt

// Synergy
1 Boros Charm
1 Mardu Charm
1 Zurgo Bellstriker
1 Karmic Guide
1 Reveillark`,

  archidekt: `Commander (1)
1 Alesha, Who Smiles at Death

Mainboard (10)
1 Sol Ring
1 Command Tower
1 Path to Exile
1 Swords to Plowshares
1 Lightning Bolt
1 Boros Charm
1 Mardu Charm
1 Zurgo Bellstriker
1 Karmic Guide
1 Reveillark`
};

// Test format detection
console.log('=== Testing Format Detection ===');
Object.entries(testDecks).forEach(([format, content]) => {
  const detected = detectDeckFormat(content);
  console.log(`${format}: ${detected} ${detected === format ? '✅' : '❌'}`);
});

// Test import functionality
console.log('\n=== Testing Import Functionality ===');

async function testImport(format, content) {
  try {
    console.log(`\nTesting ${format} format import...`);
    
    const result = await importDeckFromText(content, {
      validateDeck: false,
      onProgress: (progress) => {
        console.log(`  Progress: ${progress.stage} (${progress.current}/${progress.total})`);
      }
    });
    
    console.log(`✅ Import successful!`);
    console.log(`  Commander: ${result.commander?.name || 'Not found'}`);
    console.log(`  Cards resolved: ${result.cards?.length || 0}`);
    console.log(`  Cards unresolved: ${result.unresolvedCards?.length || 0}`);
    console.log(`  Format detected: ${result.format}`);
    
    if (result.unresolvedCards?.length > 0) {
      console.log(`  Unresolved cards: ${result.unresolvedCards.slice(0, 3).join(', ')}${result.unresolvedCards.length > 3 ? '...' : ''}`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`❌ Import failed: ${error.message}`);
    return null;
  }
}

// Run tests for each format
async function runTests() {
  for (const [format, content] of Object.entries(testDecks)) {
    await testImport(format, content);
  }
  
  console.log('\n=== Import Tests Complete ===');
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testDecks, testImport, runTests }; 