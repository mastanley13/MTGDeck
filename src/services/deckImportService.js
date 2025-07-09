import { getCachedCard, cacheCard } from '../utils/cardCache.js';
import { searchCardByName } from '../utils/scryfallAPI.js';
import { validateDeckWithAI } from './deckValidationService.js';

// Format Detection Patterns
const FORMAT_PATTERNS = {
  mtga: /^Name\s+(.+)\s+.+$/m, // MTGA format starts with "Name [Commander] [Deck Theme]"
  mtgo: /^\d+\s+[A-Z].*\n[\s\S]*\n\d+\s+[A-Z].*$/m, // MTGO has commander at end, simple format
  moxfield: /^Commander:\s*(.+)$/m,
  edhrec: /^1x?\s+(.+)\s+\*CMDR\*$/m,
  mtggoldfish: /^Deck$/m,
  archidekt: /^Commander\s*\(1\)$/m,
  tappedout: /^1x?\s+(.+)\s+\*CMDR\*$/m,
  generic: /^\d+x?\s+(.+)$/m
};

// Detect deck format from content
export const detectDeckFormat = (content) => {
  const cleanContent = content.trim();
  const lines = cleanContent.split('\n').filter(l => l.trim());
  
  // Check for MTGA format - starts with "Name [Commander] [Theme]"
  if (FORMAT_PATTERNS.mtga.test(cleanContent)) {
    return 'mtga';
  }
  
  // Check for traditional Moxfield format with "Commander:" line
  if (FORMAT_PATTERNS.moxfield.test(cleanContent)) {
    return 'moxfield';
  }
  
  // Check for Moxfield variant format (no "Commander:" but has set codes in parentheses)
  const hasSetCodes = lines.some(line => line.match(/\(\w{2,5}\)\s+\d+/));
  const hasQuantityFormat = lines.some(line => line.match(/^\d+\s+[A-Z]/));
  const hasFlags = lines.some(line => line.includes('*F*') || line.includes('*E*'));
  
  if (hasSetCodes && hasQuantityFormat && !cleanContent.includes('[') && !cleanContent.includes('*CMDR*')) {
    return 'moxfield';
  }
  
  // Check for MTGO format - simple list with commander at the end (separated by blank line)
  const hasSimpleFormat = lines.every(line => {
    if (!line.trim()) return true; // Allow blank lines
    return /^\d+\s+[A-Z]/.test(line) || line.match(/^\d+\s+[a-z]/); // Cards start with number and letter
  });
  
  // MTGO format detection - look for commander separated at the end
  // But exclude if it looks like Moxfield (has set codes)
  if (hasSimpleFormat && lines.length > 50 && !hasSetCodes) { // Reasonable deck size and no set codes
    const nonEmptyLines = lines.filter(l => l.trim());
    const lastLine = nonEmptyLines[nonEmptyLines.length - 1];
    
    // Check if last line looks like a commander (quantity 1, legendary name pattern)
    if (lastLine && lastLine.match(/^1\s+[A-Z]/)) {
      // Look for blank line separation or if it's clearly separated
      const originalLines = cleanContent.split('\n');
      const lastLineIndex = originalLines.lastIndexOf(lastLine);
      
      if (lastLineIndex > 0 && originalLines[lastLineIndex - 1].trim() === '') {
        return 'mtgo';
      }
      
      // Also check if it's the only card with quantity 1 at the end
      const quantity1Cards = nonEmptyLines.filter(line => line.match(/^1\s+/));
      if (quantity1Cards.length >= 1 && quantity1Cards[quantity1Cards.length - 1] === lastLine) {
        return 'mtgo';
      }
    }
  }
  
  // Check for EDHREC/TappedOut format
  if (FORMAT_PATTERNS.edhrec.test(cleanContent) || cleanContent.includes('*CMDR*')) {
    return 'edhrec';
  }
  
  // Check for Archidekt format - look for set codes and type tags
  if (cleanContent.includes('[Commander{top}]') || 
      (cleanContent.includes('[') && cleanContent.includes('(') && cleanContent.match(/\(\w{3,4}\)/))) {
    return 'archidekt';
  }

  if (FORMAT_PATTERNS.archidekt.test(cleanContent)) {
    return 'archidekt';
  }
  
  // Check for MTGGoldfish format
  if (cleanContent.includes('Deck') && cleanContent.includes('Sideboard')) {
    return 'mtggoldfish';
  }
  
  // Default to generic format
  return 'generic';
};

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Enhanced card name cleaning with annotation handling
const cleanCardName = (cardName) => {
  return cardName
    .replace(/^\d+x?\s+/, '')     // Remove quantity prefix
    .replace(/\s*\/\/.*$/, '')    // Remove flip card back name
    .replace(/\s*\*.*\*$/, '')    // Remove format markers like *CMDR*
    .replace(/\s*\(foil\)$/i, '') // Remove (foil) annotations
    .replace(/\s*\(commander\)$/i, '') // Remove (commander) annotations
    .replace(/\s*\([^)]*\)\s*[A-Z0-9\-]*\d+[a-z]*$/, '') // Remove set codes and collector numbers
    .replace(/\s*\([^)]*\)$/, '') // Remove remaining set info in parentheses
    .replace(/\s*\{[^}]*\}$/, '') // Remove mana cost info
    .trim();
};

// Check if a card line has explicit commander markers
const hasCommanderMarker = (line) => {
  const lowerLine = line.toLowerCase();
  return lowerLine.includes('(commander)') || 
         lowerLine.includes('*cmdr*') ||
         lowerLine.includes('[commander]') ||
         lowerLine.includes('{commander}');
};

// Parse card line and extract commander marker info
const parseCardLine = (line) => {
  const match = line.match(/^(\d+)x?\s+(.+)$/);
  if (!match) return null;
  
  const quantity = parseInt(match[1]);
  const cardPart = match[2].trim();
  const isCommander = hasCommanderMarker(line);
  const cardName = cleanCardName(cardPart);
  
  return {
    name: cardName,
    quantity,
    isCommander,
    originalLine: line
  };
};

// Resolve card name to full Scryfall data with fuzzy matching
export const resolveCardName = async (cardName, options = {}) => {
  try {
    const { enableFuzzyMatch = true, maxDistance = 2 } = options;
    const cleanName = cleanCardName(cardName);
    if (!cleanName) return { card: null, error: 'Empty card name', suggestion: null };

    // 1. Check cache first
    const cached = getCachedCard(cleanName);
    if (cached) return { card: cached, error: null, suggestion: null };

    // 2. Try card search using the existing scryfallAPI function
    try {
      const searchResult = await searchCardByName(cleanName);
      if (searchResult && searchResult.data && searchResult.data.length > 0) {
        const card = searchResult.data[0];
        cacheCard(card);
        return { card, error: null, suggestion: null };
      }
    } catch (error) {
      console.warn(`Card search failed for: ${cleanName}`, error);
    }

    // 3. Try variations of the card name
    const variations = [
      // Remove any remaining parentheses content
      cleanName.replace(/\s*\([^)]*\)/g, ''),
      // Remove any remaining bracketed content
      cleanName.replace(/\s*\[[^\]]*\]/g, ''),
      // Try with common misspellings fixed
      cleanName.replace(/ae/g, 'æ').replace(/æ/g, 'ae'),
      // Try without apostrophes and special characters
      cleanName.replace(/['']/g, '').replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim(),
      // Try without "the", "of", "a", "an" articles
      cleanName.replace(/\b(the|of|a|an)\b/gi, ' ').replace(/\s+/g, ' ').trim()
    ].filter(Boolean).filter(name => name !== cleanName && name.length > 2);

    for (const variation of variations) {
      try {
        const searchResult = await searchCardByName(variation);
        if (searchResult && searchResult.data && searchResult.data.length > 0) {
          const card = searchResult.data[0];
          cacheCard(card);
          return { 
            card, 
            error: null, 
            suggestion: `Found "${card.name}" for "${cardName}"` 
          };
        }
      } catch (error) {
        continue; // Try next variation
      }
    }

    // 4. Fuzzy matching (if enabled and no exact match found)
    if (enableFuzzyMatch) {
      try {
        // Try a broad search to get potential matches
        const broadSearch = await searchCardByName(cleanName.split(' ')[0]); // Search by first word
        if (broadSearch && broadSearch.data && broadSearch.data.length > 0) {
          // Find the closest match using Levenshtein distance
          let bestMatch = null;
          let bestDistance = Infinity;
          
          for (const card of broadSearch.data.slice(0, 10)) { // Check first 10 results
            const distance = levenshteinDistance(cleanName.toLowerCase(), card.name.toLowerCase());
            if (distance <= maxDistance && distance < bestDistance) {
              bestMatch = card;
              bestDistance = distance;
            }
          }
          
          if (bestMatch) {
            cacheCard(bestMatch);
            return { 
              card: bestMatch, 
              error: null, 
              suggestion: `Did you mean "${bestMatch.name}"? (fuzzy match for "${cardName}")` 
            };
          }
        }
      } catch (error) {
        console.warn(`Fuzzy search failed for: ${cleanName}`, error);
      }
    }

    console.warn(`All resolution attempts failed for: ${cardName}`);
    return { 
      card: null, 
      error: `Unrecognized card name: "${cardName}"`, 
      suggestion: null 
    };
  } catch (error) {
    console.warn(`Card resolution failed: ${cardName}`, error);
    return { 
      card: null, 
      error: `Resolution error: ${error.message}`, 
      suggestion: null 
    };
  }
};

// Enhanced commander detection from resolved cards with multiple methods
export const detectCommanderFromCards = (cards, options = {}) => {
  if (!cards || cards.length === 0) return null;

  const { allowPartners = true, firstCardHeuristic = true } = options;

  // DEBUG: Log the detection process
  console.log('🔍 Commander Detection Debug:');
  console.log(`  - Cards count: ${cards.length}`);
  console.log(`  - First card: ${cards[0]?.name || 'None'}`);
  console.log(`  - First card heuristic enabled: ${firstCardHeuristic}`);

  // Method 1: Look for cards with explicit commander markers
  const explicitCommanders = cards.filter(card => {
    const name = card.name?.toLowerCase() || '';
    const typeLine = card.type_line?.toLowerCase() || '';
    const oracleText = card.oracle_text?.toLowerCase() || '';
    
    // Check for explicit commander markers in metadata
    if (card.isCommander || card.commander === true) return true;
    
    // Check for commander-legal planeswalkers
    if (typeLine.includes('planeswalker') && 
        oracleText.includes('can be your commander')) return true;
    
    return false;
  });

  console.log(`  - Explicit commanders found: ${explicitCommanders.length}`);
  explicitCommanders.forEach(cmd => console.log(`    * ${cmd.name}`));

  if (explicitCommanders.length === 1) {
    console.log(`✅ Returning explicit commander: ${explicitCommanders[0].name}`);
    return { commander: explicitCommanders[0], partners: [] };
  }

  if (explicitCommanders.length === 2 && allowPartners) {
    // Check if both can be partners
    const hasPartner = explicitCommanders.every(card => {
      const oracleText = card.oracle_text?.toLowerCase() || '';
      return oracleText.includes('partner') || 
             oracleText.includes('choose a background') ||
             oracleText.includes('friends forever');
    });
    
    if (hasPartner) {
      console.log(`✅ Returning partner commanders: ${explicitCommanders[0].name} + ${explicitCommanders[1].name}`);
      return { 
        commander: explicitCommanders[0], 
        partners: [explicitCommanders[1]] 
      };
    }
  }

  // Method 2: First card heuristic - PRIORITY METHOD (should come first!)
  console.log(`🎯 Testing first card heuristic...`);
  if (firstCardHeuristic && cards.length > 0) {
    const firstCard = cards[0];
    const typeLine = firstCard.type_line?.toLowerCase() || '';
    const oracleText = firstCard.oracle_text?.toLowerCase() || '';
    
    console.log(`  - First card: ${firstCard.name}`);
    console.log(`  - Type line: "${firstCard.type_line}"`);
    
    const isCommanderLegal = (
      (typeLine.includes('legendary') && typeLine.includes('creature')) ||
      (typeLine.includes('planeswalker') && oracleText.includes('can be your commander')) ||
      // Special case: Shorikai and other artifact vehicles that can be commanders
      (typeLine.includes('legendary') && typeLine.includes('artifact') && typeLine.includes('vehicle'))
    );
    
    console.log(`  - Commander legal: ${isCommanderLegal}`);
    
    if (isCommanderLegal) {
      console.log(`✅ First card heuristic SUCCESS! Returning: ${firstCard.name}`);
      return { commander: firstCard, partners: [] };
    } else {
      console.log(`❌ First card not commander-legal, continuing...`);
    }
  } else {
    console.log(`⏭️ First card heuristic skipped (enabled: ${firstCardHeuristic}, cards: ${cards.length})`);
  }

  // Method 3: Look for legendary creatures (including artifact vehicles like Shorikai)
  const legendaryCreatures = cards.filter(card => {
    const typeLine = card.type_line?.toLowerCase() || '';
    return typeLine.includes('legendary') && (
      typeLine.includes('creature') ||
      (typeLine.includes('artifact') && typeLine.includes('vehicle'))
    );
  });

  // Method 4: Single legendary creature
  if (legendaryCreatures.length === 1) {
    return { commander: legendaryCreatures[0], partners: [] };
  }

  // Method 5: Partner commanders
  if (legendaryCreatures.length === 2 && allowPartners) {
    const hasPartner = legendaryCreatures.every(card => {
      const oracleText = card.oracle_text?.toLowerCase() || '';
      return oracleText.includes('partner') || 
             oracleText.includes('choose a background') ||
             oracleText.includes('friends forever');
    });
    
    if (hasPartner) {
      return { 
        commander: legendaryCreatures[0], 
        partners: [legendaryCreatures[1]] 
      };
    }
  }

  // Method 6: Priority system for multiple legendary creatures
  if (legendaryCreatures.length > 0) {
    // Prioritize artifact creatures (popular commanders like Shorikai, Urza, etc.)
    const artifactCreatures = legendaryCreatures.filter(card => {
      const typeLine = card.type_line?.toLowerCase() || '';
      return typeLine.includes('artifact');
    });
    
    if (artifactCreatures.length === 1) {
      return { commander: artifactCreatures[0], partners: [] };
    }
    
    // Prioritize multicolored legendary creatures (more likely to be commanders)
    const multicoloredCreatures = legendaryCreatures.filter(card => {
      const colorIdentity = card.color_identity || [];
      return colorIdentity.length >= 2;
    });
    
    if (multicoloredCreatures.length === 1) {
      return { commander: multicoloredCreatures[0], partners: [] };
    }
    
    // Return the first legendary creature found
    return { commander: legendaryCreatures[0], partners: [] };
  }

  return null;
};

// Format-specific parsers
const PARSERS = {
  mtga: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let commander = null;
    const cards = [];
    let currentSection = 'unknown';
    
    for (const line of lines) {
      // Parse the "Name" line to extract commander
      // Format: "Name Shorikai, Genesis Engine Mech Army"
      const nameMatch = line.match(/^Name\s+(.+)$/);
      if (nameMatch) {
        const fullText = nameMatch[1].trim();
        
        // For "Shorikai, Genesis Engine Mech Army", we want "Shorikai, Genesis Engine"
        // Strategy: Look for common deck theme words and exclude them
        const deckThemeWords = ['army', 'tribal', 'control', 'aggro', 'combo', 'midrange', 'tempo', 'ramp', 'voltron', 'tokens', 'artifacts', 'enchantments', 'spells', 'creatures', 'lands', 'deck', 'build', 'theme', 'mech', 'vehicle', 'vehicles', 'artifact', 'storm', 'burn', 'lifegain', 'mill', 'reanimator', 'superfriends', 'goodstuff'];
        
        const words = fullText.split(' ');
        let commanderWords = [];
        
        // Build commander name by excluding likely theme words at the end
        for (let i = 0; i < words.length; i++) {
          const word = words[i].toLowerCase();
          
          // If this word looks like a theme word and we already have a reasonable commander name
          if (deckThemeWords.includes(word) && commanderWords.length >= 2 && commanderWords.join(' ').includes(',')) {
            break; // Stop here, this is likely the start of the theme
          }
          
          commanderWords.push(words[i]);
        }
        
        // If we didn't find a clear break point, use a more conservative approach
        if (commanderWords.length === words.length) {
          // For names with commas, take everything up to and including 2 words after the comma
          if (fullText.includes(',')) {
            const commaIndex = fullText.indexOf(',');
            const beforeComma = fullText.substring(0, commaIndex + 1).trim();
            const afterComma = fullText.substring(commaIndex + 1).trim();
            const afterCommaWords = afterComma.split(' ');
            
            // Take the comma part plus up to 2 more words
            if (afterCommaWords.length >= 2) {
              commander = beforeComma + ' ' + afterCommaWords.slice(0, 2).join(' ');
            } else {
              commander = beforeComma + ' ' + afterComma;
            }
          } else {
            // No comma, take first 2-3 words
            commander = words.slice(0, Math.min(3, words.length)).join(' ');
          }
        } else {
          commander = commanderWords.join(' ');
        }
        
        continue;
      }
      
      // Section headers
      if (line.match(/^Deck$/i)) {
        currentSection = 'deck';
        continue;
      }
      
      // Parse card lines in deck section
      if (currentSection === 'deck') {
        const match = line.match(/^(\d+)\s+(.+)$/);
        if (match) {
          const quantity = parseInt(match[1]);
          let cardName = match[2].trim();
          
          // Clean up card name
          cardName = cleanCardName(cardName);
          
          if (cardName && quantity > 0) {
            cards.push({ name: cardName, quantity });
          }
        }
      }
    }
    
    return { commander, cards, format: 'mtga' };
  },

  mtgo: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let commander = null;
    const cards = [];
    
    // MTGO format typically has commander as the last line (quantity 1)
    // Find the last non-empty line that starts with "1 "
    let commanderLine = null;
    let commanderIndex = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.match(/^1\s+[A-Z]/)) {
        commanderLine = line;
        commanderIndex = i;
        break;
      }
    }
    
    // Check if there's a gap before the potential commander (indicating separation)
    let isCommanderSeparated = false;
    if (commanderIndex > 0) {
      // Look for empty line before commander or significant gap
      isCommanderSeparated = lines[commanderIndex - 1] === '' || 
                           commanderIndex === lines.length - 1;
    }
    
    // Process all lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\d+)\s+(.+)$/);
      
      if (match) {
        const quantity = parseInt(match[1]);
        let cardName = match[2].trim();
        
        // Clean up card name
        cardName = cleanCardName(cardName);
        
        // If this is the potential commander line and it's separated
        if (i === commanderIndex && isCommanderSeparated && quantity === 1) {
          commander = cardName;
        } else if (cardName && quantity > 0) {
          cards.push({ name: cardName, quantity });
        }
      }
    }
    
    return { commander, cards, format: 'mtgo' };
  },

  moxfield: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    // Find commander line (traditional format)
    const commanderLine = lines.find(l => l.match(/^Commander:\s*(.+)$/i));
    let explicitCommander = commanderLine ? cleanCardName(commanderLine.replace(/^Commander:\s*/i, '')) : null;
    
    // Parse main deck cards
    const cards = [];
    const commanderCards = [];
    let inMainDeck = false;
    
    for (const line of lines) {
      // Skip commander line
      if (line.match(/^Commander:/i)) continue;
      
      // Check for section headers
      if (line.match(/^(Main|Mainboard|Deck):/i)) {
        inMainDeck = true;
        continue;
      }
      if (line.match(/^(Sideboard|Maybe):/i)) {
        inMainDeck = false;
        continue;
      }
      
      // Parse card lines
      const parsedCard = parseCardLine(line);
      if (parsedCard && (inMainDeck || !line.includes(':'))) {
        // Handle double-faced cards
        if (parsedCard.name.includes('//')) {
          parsedCard.name = parsedCard.name.split('//')[0].trim();
        }
        
        if (parsedCard.name && parsedCard.quantity > 0) {
          // If card has explicit commander marker, add to commander list
          if (parsedCard.isCommander) {
            commanderCards.push({
              name: parsedCard.name,
              quantity: parsedCard.quantity,
              isCommander: true
            });
          } else {
            cards.push({
              name: parsedCard.name,
              quantity: parsedCard.quantity
            });
          }
        }
      }
    }
    
    // Determine commander
    let commander = explicitCommander;
    if (!commander && commanderCards.length > 0) {
      commander = commanderCards[0].name;
    }
    
    return { 
      commander, 
      cards, 
      commanderCards,
      format: 'moxfield' 
    };
  },

  edhrec: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let commander = null;
    const cards = [];
    
    for (const line of lines) {
      if (line.includes('*CMDR*')) {
        const match = line.match(/^(\d+)x?\s+(.+?)\s+\*CMDR\*/);
        if (match) {
          commander = cleanCardName(match[2]);
        }
      } else {
        const match = line.match(/^(\d+)x?\s+(.+)$/);
        if (match) {
          const quantity = parseInt(match[1]);
          const name = cleanCardName(match[2]);
          if (name && quantity > 0) {
            cards.push({ name, quantity });
          }
        }
      }
    }
    
    return { commander, cards, format: 'edhrec' };
  },

  archidekt: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let commander = null;
    const cards = [];
    let currentSection = 'unknown';
    
    for (const line of lines) {
      // Section headers
      if (line.match(/^Commander\s*\(\d+\)$/i)) {
        currentSection = 'commander';
        continue;
      }
      if (line.match(/^(Main|Mainboard)\s*\(\d+\)$/i)) {
        currentSection = 'mainboard';
        continue;
      }
      if (line.match(/^(Sideboard|Maybeboard)\s*\(\d+\)$/i)) {
        currentSection = 'sideboard';
        continue;
      }
      
      // Parse card lines with enhanced Archidekt format handling
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        let cardName = match[2].trim();
        
        // Handle the full line to extract commander info before cleaning
        const isCommander = line.includes('[COMMANDER{top}]') || 
                          line.includes('[Commander{top}]') ||
                          line.includes('*CMDR*') ||
                          line.includes('[Commander]') ||
                          line.includes('(Commander)') ||
                          line.toLowerCase().includes('commander:');
        
        // Skip maybeboard cards first
        if (line.includes('[Maybeboard{noDeck}{noPrice}]')) {
          continue;
        }
        
        // Clean up the card name - handle multiple formats
        // First remove type tags like [LAND], [VEHICLES,Artifact], etc.
        cardName = cardName.replace(/\s*\[.*?\]/g, '');
        
        // Remove additional metadata like ^Have,#37d67a^, *F*
        cardName = cardName.replace(/\s*\^.*?\^/g, ''); // Remove ^metadata^
        cardName = cardName.replace(/\s*\*[^*]*\*/g, ''); // Remove *flags*
        
        // Remove set codes and collector numbers like (plst) 2XM-309, (nec) 4, (scd) 42
        cardName = cardName.replace(/\s*\([^)]+\)\s*[A-Z0-9\-]+[a-z]*/g, '');
        
        // Remove any remaining parentheses content
        cardName = cardName.replace(/\s*\([^)]+\)/g, '');
        
        // Remove any remaining collector numbers or set codes that might be at the end
        cardName = cardName.replace(/\s+[A-Z]{2,4}-?\d+[a-z]*$/g, ''); // Remove set codes like AER-49, DDN-64
        
        // Handle double-faced cards (containing '//')
        if (cardName.includes('//')) {
          cardName = cardName.split('//')[0].trim();
        }
        
        // Final cleanup
        cardName = cardName.replace(/\s+/g, ' ').trim();
        
        // If we find a commander, set it
        if (isCommander && !commander) {
          commander = cardName;
        }
        
        // Add all valid cards to the deck (but NOT the commander)
        if (cardName && quantity > 0 && !isCommander) {
          // Check if we already have this card (for basic lands with different collector numbers)
          const existingCard = cards.find(card => card.name === cardName);
          if (existingCard) {
            existingCard.quantity += quantity;
          } else {
            cards.push({ name: cardName, quantity });
          }
        }
      }
    }
    
    return { commander, cards, format: 'archidekt' };
  },

  tappedout: (content) => {
    // Similar to EDHREC format
    return PARSERS.edhrec(content);
  },

  mtggoldfish: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let commander = null;
    const cards = [];
    let currentSection = 'unknown';
    
    for (const line of lines) {
      // Section detection
      if (line.match(/^(Deck|Main)$/i)) {
        currentSection = 'main';
        continue;
      }
      if (line.match(/^Commander$/i)) {
        currentSection = 'commander';
        continue;
      }
      if (line.match(/^Sideboard$/i)) {
        currentSection = 'sideboard';
        continue;
      }
      
      // Parse card lines
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = cleanCardName(match[2]);
        
        if (currentSection === 'commander' && !commander) {
          commander = name;
        } else if (currentSection === 'main' && quantity > 0) {
          cards.push({ name, quantity });
        }
      }
    }
    
    return { commander, cards, format: 'mtggoldfish' };
  },

  generic: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let commander = null;
    const cards = [];
    let currentSection = 'mainboard';
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('//') || line.startsWith('#') || !line) {
        // Check for section indicators in comments
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('commander')) {
          currentSection = 'commander';
        } else if (lowerLine.includes('main') || lowerLine.includes('deck')) {
          currentSection = 'mainboard';
        }
        continue;
      }
      
      // Parse card lines
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        let cardName = cleanCardName(match[2]);
        
        if (currentSection === 'commander' || (quantity === 1 && !commander && cards.length === 0)) {
          commander = cardName;
          currentSection = 'mainboard';
        } else if (quantity > 0) {
          cards.push({ name: cardName, quantity });
        }
      }
    }
    
    return { commander, cards, format: 'generic' };
  }
};

// Parse deck content by detected format
export const parseByFormat = async (content, format) => {
  const parser = PARSERS[format] || PARSERS.generic;
  return parser(content);
};

// Batch process cards to respect API rate limits
const batchProcessCards = async (cardNames, batchSize = 3, onProgress = null) => {
  const results = [];
  const total = cardNames.length;
  let processed = 0;
  
  // Process cards in smaller batches with more delay between requests
  for (let i = 0; i < cardNames.length; i += batchSize) {
    const batch = cardNames.slice(i, i + batchSize);
    
    // Process each card in the batch sequentially to avoid rate limits
    for (const cardName of batch) {
      try {
        const result = await resolveCardName(cardName);
        results.push({ 
          name: cardName, 
          card: result.card, 
          error: result.error,
          suggestion: result.suggestion
        });
      } catch (error) {
        console.warn(`Failed to resolve card: ${cardName}`, error);
        results.push({ 
          name: cardName, 
          card: null, 
          error: error.message,
          suggestion: null
        });
      }
      
      processed++;
      
      // Progress callback
      if (onProgress) {
        onProgress({
          stage: 'resolving',
          current: processed,
          total,
          cardName
        });
      }
      
      // Add more delay between individual card requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Add additional delay between batches
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  return results;
};

// Main import function
export const importDeckFromText = async (content, options = {}) => {
  const { onProgress = null, validateDeck = false } = options;
  
  try {
    // Step 1: Detect format and parse
    if (onProgress) onProgress({ stage: 'parsing', current: 0, total: 100 });
    
    const format = detectDeckFormat(content);
    const parsed = await parseByFormat(content, format);
    
    // Step 2: Resolve commander
    let commander = null;
    if (parsed.commander) {
      if (onProgress) onProgress({ 
        stage: 'resolving', 
        current: 0, 
        total: parsed.cards.length + 1,
        cardName: parsed.commander 
      });
      
      const commanderResult = await resolveCardName(parsed.commander);
      commander = commanderResult.card;
      
      if (!commander && commanderResult.suggestion) {
        console.log(`Commander suggestion: ${commanderResult.suggestion}`);
      }
    }
    
    // Step 3: Batch resolve cards
    const cardNames = parsed.cards.map(c => c.name);
    const resolvedResults = await batchProcessCards(cardNames, 5, onProgress);
    
    // Process results
    const resolvedCards = [];
    const unresolvedCards = [];
    const suggestions = [];
    
    for (let i = 0; i < resolvedResults.length; i++) {
      const result = resolvedResults[i];
      const originalCard = parsed.cards[i];
      
      if (result.card) {
        resolvedCards.push({
          ...result.card,
          quantity: originalCard.quantity || 1
        });
      } else {
        unresolvedCards.push({
          name: result.name,
          error: result.error,
          suggestion: result.suggestion
        });
      }
      
      if (result.suggestion) {
        suggestions.push(result.suggestion);
      }
    }
    
    // Step 4: Auto-detect commander if not found
    if (!commander && resolvedCards.length > 0) {
      if (onProgress) onProgress({ stage: 'detecting_commander', current: 90, total: 100 });
      
      // CRITICAL: Preserve original order for first card heuristic
      // Build cards in the same order as the original parsed cards
      const cardsInOriginalOrder = [];
      
      for (const originalCard of parsed.cards) {
        const resolvedCard = resolvedCards.find(rc => rc.name === originalCard.name);
        if (resolvedCard) {
          cardsInOriginalOrder.push({
            ...resolvedCard,
            isCommander: originalCard?.isCommander || false
          });
        }
      }
      
      const commanderResult = detectCommanderFromCards(cardsInOriginalOrder);
      
      if (commanderResult) {
        commander = commanderResult.commander;
        
        // Remove commander from main deck cards to avoid double counting
        if (commander) {
          const commanderIndex = resolvedCards.findIndex(card => card.name === commander.name);
          if (commanderIndex !== -1) {
            resolvedCards.splice(commanderIndex, 1);
          }
        }
        
        // Handle partners if present
        if (commanderResult.partners && commanderResult.partners.length > 0) {
          commanderResult.partners.forEach(partner => {
            const partnerIndex = resolvedCards.findIndex(card => card.name === partner.name);
            if (partnerIndex !== -1) {
              resolvedCards.splice(partnerIndex, 1);
            }
          });
        }
      }
    }
    
    // Note: Keep commander in the main deck for accurate count
    // The deck builder will handle commander vs main deck separation
    
    // Skip validation during import - validation happens elsewhere in the app
    let validation = null;
    
    // Step 6: Complete
    if (onProgress) onProgress({ stage: 'complete', current: 100, total: 100 });
    
    const totalRequested = parsed.cards.length + (parsed.commander ? 1 : 0);
    const totalResolved = resolvedCards.length + (commander ? 1 : 0);
    
    return {
      commander,
      cards: resolvedCards,
      unresolvedCards,
      suggestions,
      validation,
      format,
      stats: {
        totalRequested,
        resolved: totalResolved,
        unresolved: unresolvedCards.length + (parsed.commander && !commander ? 1 : 0)
      },
      name: parsed.name || null,
      description: parsed.description || null
    };
    
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error(`Import failed: ${error.message}`);
  }
};

// Extract deck name from content if available
export const extractDeckName = (content) => {
  const lines = content.split('\n').map(l => l.trim());
  
  // Look for deck name in comments
  for (const line of lines) {
    if (line.startsWith('//') || line.startsWith('#')) {
      const nameMatch = line.match(/^[\/\#]+\s*(.+)$/);
      if (nameMatch && !nameMatch[1].toLowerCase().includes('commander')) {
        return nameMatch[1].trim();
      }
    }
  }
  
  return null;
};

// Validate import result before saving
export const validateImportResult = (importResult) => {
  const errors = [];
  const warnings = [];
  
  if (!importResult.commander) {
    errors.push('No commander found in import');
  }
  
  if (importResult.cards.length === 0) {
    errors.push('No cards found in import');
  }
  
  if (importResult.unresolvedCards.length > 0) {
    warnings.push(`${importResult.unresolvedCards.length} cards could not be resolved`);
  }
  
  if (importResult.suggestions.length > 0) {
    warnings.push(`${importResult.suggestions.length} suggestions available for better matches`);
  }
  
  if (importResult.cards.length < 50) {
    warnings.push('Deck has fewer than 50 cards (typical minimum for Commander)');
  }
  
  if (importResult.cards.length > 100) {
    warnings.push('Deck has more than 100 cards (typical maximum for Commander)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};