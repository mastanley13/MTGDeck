import React, { useState, useEffect } from 'react';

/**
 * Interactive AI demonstration component for tutorial
 */
const AIDemo = ({ demoType, isVisible = true }) => {
  const [currentExample, setCurrentExample] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!isVisible) return null;

  // Demo configurations for different AI tools
  const demoConfigs = {
    deckBuilder: {
      title: 'AI Deck Building Process',
      examples: [
        {
          input: 'Commander: Atraxa, Praetors\' Voice',
          process: 'Analyzing 4-color identity (WUBG)...',
          output: 'Suggests: Doubling Season, Deepglow Skate, Tezzeret the Seeker',
          explanation: 'AI identifies +1/+1 counters and planeswalker synergies'
        },
        {
          input: 'Adding ramp package...',
          process: 'Calculating mana curve needs...',
          output: 'Suggests: Sol Ring, Arcane Signet, Cultivate, Kodama\'s Reach',
          explanation: 'Prioritizes artifact ramp for 4-color consistency'
        },
        {
          input: 'Win condition analysis...',
          process: 'Evaluating proliferate synergies...',
          output: 'Suggests: Viral Drake, Karn\'s Bastion, Evolution Sage',
          explanation: 'Builds around commander\'s proliferate ability'
        }
      ]
    },
    commanderAI: {
      title: 'Commander Matching Process',
      examples: [
        {
          input: 'Play Style: "I like drawing cards and controlling the game"',
          process: 'Analyzing control archetypes...',
          output: 'Top Match: Rashmi, Eternities Crafter (85% match)',
          explanation: 'Provides card advantage and instant-speed interaction'
        },
        {
          input: 'Budget Preference: Under $200',
          process: 'Filtering expensive commanders...',
          output: 'Alternative: Tatyova, Benthic Druid (Budget control)',
          explanation: 'Lands-matter strategy with built-in card draw'
        },
        {
          input: 'Meta Consideration: Aggressive local meta',
          process: 'Evaluating defensive capabilities...',
          output: 'Recommendation: Add more board wipes and removal',
          explanation: 'Adjusts strategy for faster game environment'
        }
      ]
    },
    tutorAI: {
      title: 'Game State Analysis',
      examples: [
        {
          input: 'Turn 4: 4 lands, Rhystic Study in hand, opponents have 2-3 creatures',
          process: 'Calculating threat assessment...',
          output: 'Play Rhystic Study now (Recommended)',
          explanation: 'Opponents likely to pay 1 early, but card advantage crucial'
        },
        {
          input: 'Opponent casting Craterhoof Behemoth with 8 creatures',
          process: 'Threat level: Critical. Checking responses...',
          output: 'Use Cyclonic Rift immediately!',
          explanation: 'Prevent lethal damage by bouncing board'
        },
        {
          input: 'Holding counterspell, combo player setting up',
          process: 'Evaluating combo pieces and timing...',
          output: 'Wait for the actual win condition, not setup',
          explanation: 'Counter the Thoracle, not the Demonic Consultation'
        }
      ]
    },
    aiOptimization: {
      title: 'AI Optimization Pipeline',
      examples: [
        {
          input: 'Analyzing 73-card Prossh deck performance data...',
          process: 'Running 10,000 game simulations...',
          output: 'Detected: Low win rate when missing sacrifice outlets',
          explanation: 'AI identifies critical deck dependencies through simulation'
        },
        {
          input: 'Evaluating mana base efficiency...',
          process: 'Calculating color requirements and curve...',
          output: 'Suggests: Replace 2 Mountains with Rootbound Crag, Dragonskull Summit',
          explanation: 'Improves color consistency while maintaining untapped land ratio'
        },
        {
          input: 'Meta-game analysis: 35% of opponents run board wipes',
          process: 'Adjusting threat density and protection ratios...',
          output: 'Add: Heroic Intervention, Wrap in Vigor for board protection',
          explanation: 'Adapts deck to counter prevalent meta strategies'
        }
      ]
    }
  };

  const config = demoConfigs[demoType];
  if (!config) return null;

  const currentDemo = config.examples[currentExample];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentExample((prev) => (prev + 1) % config.examples.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [config.examples.length]);

  return (
    <div className="mt-4 bg-gradient-to-br from-slate-800/80 to-slate-700/80 rounded-lg border border-slate-600/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600/20 to-blue-600/20 p-3 border-b border-slate-600/50">
        <h4 className="text-sm font-semibold text-primary-300 flex items-center">
          <div className="w-4 h-4 rounded-full bg-primary-500 mr-2 animate-pulse"></div>
          {config.title}
        </h4>
      </div>

      {/* Demo Content */}
      <div className={`p-4 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Input Phase */}
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">Input:</div>
          <div className="bg-slate-900/50 rounded p-2 border-l-2 border-blue-500">
            <code className="text-xs text-blue-300">{currentDemo.input}</code>
          </div>
        </div>

        {/* Processing Phase */}
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">AI Processing:</div>
          <div className="bg-slate-900/50 rounded p-2 border-l-2 border-yellow-500 flex items-center">
            <div className="animate-spin w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full mr-2"></div>
            <code className="text-xs text-yellow-300">{currentDemo.process}</code>
          </div>
        </div>

        {/* Output Phase */}
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">AI Recommendation:</div>
          <div className="bg-slate-900/50 rounded p-2 border-l-2 border-green-500">
            <code className="text-xs text-green-300">{currentDemo.output}</code>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-purple-900/20 rounded p-2 border border-purple-500/30">
          <div className="text-xs text-slate-400 mb-1">Why this recommendation:</div>
          <p className="text-xs text-purple-200">{currentDemo.explanation}</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="p-3 bg-slate-800/50 border-t border-slate-600/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Live Demo {currentExample + 1} of {config.examples.length}</span>
          <div className="flex space-x-1">
            {config.examples.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentExample ? 'bg-primary-400' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Prompt Engineering Guide Component
export const PromptGuide = ({ isVisible = true }) => {
  const [selectedExample, setSelectedExample] = useState(0);

  if (!isVisible) return null;

  const promptExamples = [
    {
      category: 'Deck Building',
      bad: 'Make me a good deck',
      good: 'Build a competitive Yuriko, the Tiger\'s Shadow deck focused on extra turn spells, budget under $300',
      why: 'Specific commander, strategy, and budget constraints help AI provide targeted recommendations'
    },
    {
      category: 'Card Suggestions',
      bad: 'What cards should I add?',
      good: 'I need more card draw for my Azami, Lady of Scrolls wizard tribal deck. Current curve peaks at 3CMC',
      why: 'Context about commander, strategy, and current deck state enables better suggestions'
    },
    {
      category: 'Gameplay Help',
      bad: 'How do I win?',
      good: 'Turn 6, I have Craterhoof Behemoth in hand, 4 creatures on board, facing 2 opponents with 20 life each. Best play?',
      why: 'Specific game state, board position, and win condition help AI calculate optimal plays'
    }
  ];

  return (
    <div className="mt-4 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg border border-emerald-500/30 p-4">
      <h4 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Prompt Engineering for Better AI Results
      </h4>

      <div className="space-y-3">
        {promptExamples.map((example, index) => (
          <button
            key={index}
            onClick={() => setSelectedExample(index)}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
              selectedExample === index
                ? 'border-emerald-400 bg-emerald-900/40'
                : 'border-slate-600 bg-slate-800/30 hover:bg-slate-700/30'
            }`}
          >
            <div className="text-xs font-medium text-emerald-300 mb-2">{example.category}</div>
            
            {/* Bad Example */}
            <div className="mb-2">
              <div className="text-xs text-red-400 mb-1">❌ Vague Prompt:</div>
              <code className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                "{example.bad}"
              </code>
            </div>

            {/* Good Example */}
            <div className="mb-2">
              <div className="text-xs text-green-400 mb-1">✅ Specific Prompt:</div>
              <code className="text-xs text-green-300 bg-green-900/20 px-2 py-1 rounded">
                "{example.good}"
              </code>
            </div>

            {/* Explanation (only show for selected) */}
            {selectedExample === index && (
              <div className="mt-3 pt-2 border-t border-emerald-600/30">
                <div className="text-xs text-emerald-200">
                  <strong>Why this works:</strong> {example.why}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIDemo;