import React, { useState, useEffect } from 'react';

const CardSearchTutorial = ({ onClose, className = '' }) => {
  const [currentExample, setCurrentExample] = useState(0);
  const [showLiveDemo, setShowLiveDemo] = useState(false);

  const searchExamples = [
    {
      query: 'type:creature color:red cmc<=3',
      description: 'Find low-cost red creatures perfect for aggressive strategies',
      explanation: 'Searches for creature cards that are red and cost 3 mana or less',
      tags: ['Aggro', 'Budget', 'Early Game']
    },
    {
      query: 'type:instant o:"destroy target" cmc<=2',
      description: 'Cheap instant-speed removal spells for interaction',
      explanation: 'Finds instant spells containing "destroy target" costing 2 or less',
      tags: ['Removal', 'Instant Speed', 'Control']
    },
    {
      query: 'type:artifact o:"add" o:"mana" cmc<=3',
      description: 'Mana rocks and ramp artifacts for deck acceleration',
      explanation: 'Locates artifacts that add mana and cost 3 or less',
      tags: ['Ramp', 'Artifacts', 'Fixing']
    },
    {
      query: 'commander:Golgari o:"graveyard" type:creature',
      description: 'Graveyard-synergy creatures for Golgari commanders',
      explanation: 'Finds creatures with graveyard interactions in Golgari colors',
      tags: ['Commander', 'Graveyard', 'Synergy']
    },
    {
      query: 'type:enchantment o:"enters the battlefield" cmc>=4',
      description: 'High-impact enchantments with ETB effects',
      explanation: 'Searches for enchantments with enter-the-battlefield abilities',
      tags: ['Value', 'Enchantments', 'ETB']
    },
    {
      query: 'pow>=4 tou>=4 cmc<=4 type:creature',
      description: 'Efficient big creatures with good stats for mana cost',
      explanation: 'Finds 4+ power and toughness creatures costing 4 or less',
      tags: ['Stats', 'Efficient', 'Threats']
    }
  ];

  const syntaxGuide = [
    { operator: 'type:', example: 'type:creature', description: 'Card type (creature, instant, sorcery, etc.)' },
    { operator: 'color:', example: 'color:red', description: 'Card color (white, blue, black, red, green)' },
    { operator: 'cmc:', example: 'cmc<=3', description: 'Converted mana cost (=, <=, >=, <, >)' },
    { operator: 'pow:', example: 'pow>=4', description: 'Creature power (=, <=, >=, <, >)' },
    { operator: 'tou:', example: 'tou<=2', description: 'Creature toughness (=, <=, >=, <, >)' },
    { operator: 'o:', example: 'o:"draw a card"', description: 'Oracle text search (use quotes for phrases)' },
    { operator: 'commander:', example: 'commander:Azorius', description: 'Legal in commander colors/identity' },
    { operator: 'rarity:', example: 'rarity:rare', description: 'Card rarity (common, uncommon, rare, mythic)' }
  ];

  const nextExample = () => {
    setCurrentExample((prev) => (prev + 1) % searchExamples.length);
  };

  const previousExample = () => {
    setCurrentExample((prev) => (prev - 1 + searchExamples.length) % searchExamples.length);
  };

  const currentSearch = searchExamples[currentExample];

  return (
    <div className={`bg-slate-900/95 backdrop-blur-xl border border-slate-600 rounded-2xl p-6 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Master Card Search</h3>
          <p className="text-slate-300">Learn powerful search syntax to find exactly what you need</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50"
          aria-label="Close search tutorial"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Example */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary-500/20 to-blue-600/20 rounded-xl p-5 border border-primary-500/30">
            <h4 className="text-primary-400 font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Try This Search:
            </h4>
            
            {/* Search Query Display */}
            <div className="bg-slate-800 rounded-lg p-4 mb-4 font-mono">
              <div className="text-green-400 text-lg">{currentSearch.query}</div>
            </div>
            
            {/* Description */}
            <p className="text-slate-200 mb-3">{currentSearch.description}</p>
            <p className="text-slate-400 text-sm mb-4">{currentSearch.explanation}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {currentSearch.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Example {currentExample + 1} of {searchExamples.length}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={previousExample}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                  aria-label="Previous example"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextExample}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                  aria-label="Next example"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* MTG Pro Tip */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-xl p-4 border border-yellow-600/30">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 text-xl">💡</span>
              <div>
                <h5 className="text-yellow-400 font-semibold mb-1">Pro Tip</h5>
                <p className="text-slate-200 text-sm">
                  Combine multiple operators for precise searches. Use quotes around exact phrases and remember that color identity includes multicolored cards!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Syntax Reference */}
        <div className="space-y-4">
          <h4 className="text-white font-semibold mb-3">Search Operators Reference</h4>
          
          <div className="bg-slate-800/50 rounded-xl p-4 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {syntaxGuide.map((item, index) => (
                <div key={index} className="border-b border-slate-700 last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-primary-400 font-mono font-semibold">{item.operator}</code>
                  </div>
                  <div className="mb-2">
                    <code className="text-green-400 text-sm bg-slate-900 px-2 py-1 rounded">{item.example}</code>
                  </div>
                  <p className="text-slate-300 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-4">
            <h5 className="text-white font-semibold mb-3">Common Commander Searches</h5>
            <div className="space-y-2 text-sm">
              <button 
                className="w-full text-left p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                onClick={() => {/* Copy to search */}}
              >
                <code className="text-green-400">type:creature cmc<=2</code> - Early game creatures
              </button>
              <button 
                className="w-full text-left p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                onClick={() => {/* Copy to search */}}
              >
                <code className="text-green-400">o:"draw a card"</code> - Card draw effects
              </button>
              <button 
                className="w-full text-left p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                onClick={() => {/* Copy to search */}}
              >
                <code className="text-green-400">type:land o:"enters" o:"tapped"</code> - Utility lands
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          Master these operators to find the perfect cards for any deck
        </div>
        <button
          onClick={onClose}
          className="bg-gradient-to-r from-primary-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          Start Searching
        </button>
      </div>
    </div>
  );
};

export default CardSearchTutorial;