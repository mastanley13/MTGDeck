import React, { useState } from 'react';

/**
 * Quick reference guide for AI features - accessible after tutorial completion
 */
const AIQuickReference = ({ isVisible = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  const quickTips = [
    {
      tool: 'Deck Builder AI',
      icon: '🤖',
      tips: [
        'Specify budget constraints for better suggestions',
        'Use "Explain Choice" to understand AI reasoning',
        'Try different archetypes (Aggro, Control, Combo)',
        'Review mana curve after each build session'
      ],
      keyFeature: 'Best for: Complete 99-card deck generation'
    },
    {
      tool: 'Commander AI',
      icon: '👑',
      tips: [
        'Answer style questions honestly for better matches',
        'Explore "Why this commander?" explanations',
        'Consider suggested build paths and key cards',
        'Check EDHREC integration for meta insights'
      ],
      keyFeature: 'Best for: Finding your perfect commander match'
    },
    {
      tool: 'Gameplay Tutor',
      icon: '🎯',
      tips: [
        'Input complete game state for accurate advice',
        'Use during actual games for real-time help',
        'Practice with suggestions in low-stakes games',
        'Learn from "Explain reasoning" feature'
      ],
      keyFeature: 'Best for: Improving decision-making in games'
    }
  ];

  const commonPrompts = [
    {
      category: 'Deck Building',
      examples: [
        'Build a competitive Yuriko deck under $400',
        'Create a casual lifegain deck with Oloro',
        'Make a budget tribal deck for Goblins under $100'
      ]
    },
    {
      category: 'Optimization',
      examples: [
        'My deck feels slow, need more early game',
        'Add more removal to handle artifacts/enchantments',
        'Improve mana base for 3-color commander'
      ]
    },
    {
      category: 'Meta Adaptation',
      examples: [
        'My meta has lots of combo, need more interaction',
        'Facing aggressive decks, need board wipes',
        'Add graveyard hate for reanimator strategies'
      ]
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
          isExpanded ? 'rotate-45' : 'hover:scale-110'
        }`}
        title="AI Quick Reference"
      >
        {isExpanded ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-96 max-w-[calc(100vw-2rem)] bg-slate-800 rounded-lg shadow-2xl border border-slate-600 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600/20 to-blue-600/20 p-4 border-b border-slate-600">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <span className="mr-2">🤖</span>
              AI Quick Reference
            </h3>
            <p className="text-sm text-slate-300 mt-1">Tips for getting the best AI results</p>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* AI Tools Tips */}
            <div className="p-4 border-b border-slate-700">
              <h4 className="text-sm font-semibold text-primary-300 mb-3">AI Tool Best Practices</h4>
              <div className="space-y-3">
                {quickTips.map((tool, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{tool.icon}</span>
                      <h5 className="text-sm font-medium text-slate-200">{tool.tool}</h5>
                    </div>
                    <div className="text-xs text-green-400 mb-2 italic">{tool.keyFeature}</div>
                    <ul className="space-y-1">
                      {tool.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-primary-400 mt-0.5 flex-shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Prompts */}
            <div className="p-4">
              <h4 className="text-sm font-semibold text-primary-300 mb-3">Effective Prompt Examples</h4>
              <div className="space-y-3">
                {commonPrompts.map((category, index) => (
                  <div key={index}>
                    <h5 className="text-xs font-medium text-yellow-400 mb-2">{category.category}</h5>
                    <ul className="space-y-1">
                      {category.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="text-xs text-slate-300 bg-slate-900/30 rounded px-2 py-1">
                          "{example}"
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-700/30 border-t border-slate-600">
            <div className="text-xs text-slate-400 text-center">
              💡 Pro tip: The more specific your request, the better the AI recommendations!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuickReference;