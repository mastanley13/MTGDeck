import React, { useMemo } from 'react';
import { useDeck } from '../../context/DeckContext';
import { getFunctionalBuckets } from '../deckstats/analyzers/bucketClassify';
import { IconBook2, IconTarget, IconBulb, IconSword, IconShieldHalf, IconCards, IconArrowsShuffle, IconBolt } from '@tabler/icons-react';

const DeckPlaybook = () => {
  const { cards, commander } = useDeck();
  
  // Get functional analysis of the deck
  const functionalBuckets = getFunctionalBuckets(cards, commander);

  // Helper function to calculate deck speed
  const calculateDeckSpeed = (manaValues, buckets) => {
    const fastManaCount = buckets.fastMana || 0;
    const lowCmcCount = Object.entries(manaValues)
      .filter(([cmc]) => Number(cmc) <= 2)
      .reduce((sum, [, count]) => sum + count, 0);
    
    if (fastManaCount >= 5 && lowCmcCount >= 20) return 'Very Fast';
    if (fastManaCount >= 3 && lowCmcCount >= 15) return 'Fast';
    if (fastManaCount >= 1 && lowCmcCount >= 10) return 'Medium';
    return 'Slower';
  };

  // Helper function to calculate deck consistency
  const calculateConsistency = (buckets) => {
    const tutorCount = buckets.tutors || 0;
    const cardDrawCount = buckets.cardDraw || 0;
    const total = tutorCount + cardDrawCount;

    if (total >= 15) return 'Very High';
    if (total >= 12) return 'High';
    if (total >= 8) return 'Medium';
    return 'Lower';
  };

  // Theme descriptions for commander analysis
  const themeDescriptions = {
    tribal: "focuses on tribal synergies and creature type matters",
    spellslinger: "leverages instant and sorcery synergies",
    tokens: "generates and utilizes token creatures",
    graveyard: "interacts with the graveyard for value",
    counters: "utilizes +1/+1 counters for growth",
    lifegain: "gains and utilizes life total",
    sacrifice: "sacrifices permanents for value",
    artifacts: "focuses on artifact synergies",
    landfall: "triggers abilities when lands enter",
  };
  
  // Enhanced analysis using useMemo to cache complex calculations
  const analysis = useMemo(() => {
    if (!commander || !cards.length) return null;

    // Analyze commander's abilities and themes
    const commanderText = commander.oracle_text || '';
    const commanderThemes = {
      tribal: /creature type|creatures you control|creature cards/.test(commanderText.toLowerCase()),
      spellslinger: /instant|sorcery|cast/.test(commanderText.toLowerCase()),
      tokens: /create|token/.test(commanderText.toLowerCase()),
      graveyard: /graveyard|dies|died|destroy/.test(commanderText.toLowerCase()),
      counters: /counter|\+1\/\+1/.test(commanderText.toLowerCase()),
      lifegain: /life|gain life/.test(commanderText.toLowerCase()),
      sacrifice: /sacrifice|sacrificed/.test(commanderText.toLowerCase()),
      artifacts: /artifact|artifacts/.test(commanderText.toLowerCase()),
      landfall: /land|lands/.test(commanderText.toLowerCase()),
    };

    // Analyze mana value distribution
    const manaValueDistribution = cards.reduce((acc, card) => {
      const cmc = card.cmc || 0;
      acc[cmc] = (acc[cmc] || 0) + 1;
      return acc;
    }, {});

    // Calculate average mana value
    const totalManaValue = cards.reduce((sum, card) => sum + (card.cmc || 0), 0);
    const averageManaValue = totalManaValue / cards.length;

    // Analyze card synergies
    const synergies = cards.reduce((acc, card) => {
      const cardText = card.oracle_text?.toLowerCase() || '';
      
      // Check for tribal synergies
      if (commanderThemes.tribal) {
        const tribalMatches = cardText.match(/creature type|creatures you control|creature cards/g);
        if (tribalMatches) acc.tribal = (acc.tribal || 0) + 1;
      }
      
      // Check for spellslinger synergies
      if (commanderThemes.spellslinger) {
        const spellMatches = cardText.match(/instant|sorcery|cast/g);
        if (spellMatches) acc.spellslinger = (acc.spellslinger || 0) + 1;
      }
      
      // Add more synergy checks based on commander themes
      Object.entries(commanderThemes).forEach(([theme, isPresent]) => {
        if (isPresent && cardText.includes(theme)) {
          acc[theme] = (acc[theme] || 0) + 1;
        }
      });
      
      return acc;
    }, {});

    // Analyze interaction patterns
    const interactionPatterns = {
      proactive: functionalBuckets.ramp + (functionalBuckets.cardDraw || 0),
      reactive: (functionalBuckets.removal || 0) + (functionalBuckets.interaction || 0),
      protective: functionalBuckets.protection || 0,
    };

    // Calculate deck speed and consistency
    const deckSpeed = calculateDeckSpeed(manaValueDistribution, functionalBuckets);
    const consistency = calculateConsistency(functionalBuckets);

    return {
      commanderThemes,
      manaValueDistribution,
      averageManaValue,
      synergies,
      interactionPatterns,
      deckSpeed,
      consistency,
    };
  }, [commander, cards, functionalBuckets]);

  // Generate detailed strategy description
  const generateDetailedStrategy = () => {
    if (!commander || !analysis) return "No commander selected";
    
    const activeThemes = Object.entries(analysis.commanderThemes)
      .filter(([, isPresent]) => isPresent)
      .map(([theme]) => theme);
    
    const primaryTheme = activeThemes[0];

    return `This ${analysis.deckSpeed} deck ${themeDescriptions[primaryTheme] || "uses various strategies"} with ${analysis.consistency} consistency. ${
      analysis.interactionPatterns.reactive > 8 
        ? "It maintains strong interaction with opponents' strategies" 
        : "It focuses more on executing its own gameplan"
    }.`;
  };

  if (!commander || !cards.length) {
    return (
      <div className="text-center text-slate-400 p-8">
        <IconBook2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Add cards to your deck to generate a playbook</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Strategy Overview */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
            <IconTarget size={20} />
            <span>Strategy Overview</span>
          </h3>
          <p className="text-slate-300 leading-relaxed mb-4">
            {generateDetailedStrategy()}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2 flex items-center space-x-2">
                <IconBulb size={16} />
                <span>Deck Characteristics</span>
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Speed: {analysis?.deckSpeed}</li>
                <li>Consistency: {analysis?.consistency}</li>
                <li>Average Mana Value: {analysis?.averageManaValue.toFixed(2)}</li>
                <li>Interaction Level: {
                  analysis?.interactionPatterns.reactive > 12 ? 'High' :
                  analysis?.interactionPatterns.reactive > 8 ? 'Medium' : 'Low'
                }</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2 flex items-center space-x-2">
                <IconArrowsShuffle size={16} />
                <span>Key Synergies</span>
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {Object.entries(analysis?.synergies || {})
                  .filter(([, count]) => count > 2)
                  .map(([theme, count]) => (
                    <li key={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}: {count} cards
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Gameplay Patterns */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
            <IconBolt size={20} />
            <span>Gameplay Patterns</span>
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2">Early Game (Turns 1-3)</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {analysis?.deckSpeed === 'Very Fast' || analysis?.deckSpeed === 'Fast' ? (
                  <>
                    <li>• Aggressively mulligan for fast mana</li>
                    <li>• Deploy early threats and enablers</li>
                    <li>• Establish your mana advantage</li>
                  </>
                ) : (
                  <>
                    <li>• Focus on land drops and mana rocks</li>
                    <li>• Set up card advantage engines</li>
                    <li>• Hold interaction for critical threats</li>
                  </>
                )}
              </ul>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2">Mid Game (Turns 4-6)</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• {analysis?.interactionPatterns.protective > 3 
                  ? "Cast commander with protection backup" 
                  : "Look for windows to deploy commander"}</li>
                <li>• {analysis?.interactionPatterns.proactive > analysis?.interactionPatterns.reactive 
                  ? "Focus on developing your board" 
                  : "Control the game pace"}</li>
                <li>• {analysis?.consistency === 'Very High' || analysis?.consistency === 'High'
                  ? "Use tutors to find key pieces"
                  : "Build card advantage when possible"}</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2">Late Game (Turn 7+)</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {functionalBuckets.combo > 2 ? (
                  <>
                    <li>• Assemble your combo pieces</li>
                    <li>• Protect your win condition</li>
                    <li>• Counter opponent's interaction</li>
                  </>
                ) : (
                  <>
                    <li>• Execute your primary strategy</li>
                    <li>• Maintain board control</li>
                    <li>• Look for winning opportunities</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Key Cards & Synergies */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
            <IconCards size={20} />
            <span>Key Cards & Synergies</span>
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2">Commander Strategy</h4>
              <p className="text-sm text-slate-300">
                {commander.name} {
                  Object.entries(analysis?.commanderThemes || {})
                    .filter(([, isPresent]) => isPresent)
                    .map(([theme]) => themeDescriptions[theme])
                    .join(' and ')
                }. Build around these themes with supporting cards and protect your key pieces.
              </p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2">Core Engines</h4>
              <div className="text-sm text-slate-300">
                <p className="mb-2">Your deck's core engines include:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {functionalBuckets.cardDraw > 0 && (
                    <li>Card Advantage ({functionalBuckets.cardDraw} sources)</li>
                  )}
                  {functionalBuckets.ramp > 0 && (
                    <li>Mana Development ({functionalBuckets.ramp} sources)</li>
                  )}
                  {functionalBuckets.tutors > 0 && (
                    <li>Tutors for Consistency ({functionalBuckets.tutors} sources)</li>
                  )}
                  {Object.entries(analysis?.synergies || {})
                    .filter(([, count]) => count > 3)
                    .map(([theme, count]) => (
                      <li key={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)} Package ({count} cards)</li>
                    ))
                  }
                </ul>
              </div>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="text-sm font-semibold text-primary-300 mb-2">Win Conditions</h4>
              <p className="text-sm text-slate-300">
                {functionalBuckets.combo > 2 
                  ? `Your deck features ${functionalBuckets.combo} combo pieces that can create powerful interactions. Look to assemble these while protecting them with your ${functionalBuckets.protection || 0} protection pieces.`
                  : `Your deck wins through ${analysis?.commanderThemes.tribal ? 'tribal synergies' : 'value accumulation'} and ${functionalBuckets.removal > 8 ? 'controlling the board' : 'executing your strategy'}. Use your ${functionalBuckets.cardDraw || 0} card draw effects to find key pieces.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckPlaybook; 