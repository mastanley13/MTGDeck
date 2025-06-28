import React from 'react';
import DeckStatsIndex from '../deckstats/DeckStatsIndex';
import { useDeck } from '../../context/DeckContext';
import { IconStar, IconInfoCircle } from '@tabler/icons-react';
import GameChangerTooltip from '../ui/GameChangerTooltip';
import { analyzeBracket } from '../deckstats/analyzers/bracketAnalyzer';

const DeckStats = () => {
  const { cards, commander } = useDeck();
  
  // Use the new bracket analyzer
  const bracketAnalysis = analyzeBracket(cards, commander);

  return (
    <div className="space-y-6">
      {/* Game Changers Info Section */}
      <div className="glassmorphism-card p-6 border-blue-500/30">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-primary-500 flex items-center justify-center">
            <IconInfoCircle size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-300">Commander Brackets & Game Changers</h3>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300">
            Game Changers are powerful cards that significantly impact your deck's performance and determine its bracket placement. 
            Your deck is currently in <span className="font-semibold text-primary-400">Bracket {bracketAnalysis.bracket} ({bracketAnalysis.bracketName})</span>.
          </p>
          <p className="text-gray-300 mt-2">
            {bracketAnalysis.bracketDescription}
          </p>
          <div className="text-gray-400 text-sm mt-3">
            Look for the <GameChangerTooltip iconOnly className="inline-block mx-1" /> icon to identify game-changing cards in your deck.
          </div>
        </div>
      </div>

      {/* Game Changers Stats Section */}
      <div className="glassmorphism-card p-6 border-yellow-500/30">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <IconStar size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-300">Game Changers Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Game Changers:</span>
              <span className="text-xl font-bold text-yellow-400">{bracketAnalysis.gameChangerCount}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-400">Current Bracket:</span>
              <span className="text-lg font-semibold text-yellow-400">Bracket {bracketAnalysis.bracket}</span>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p className="italic">{bracketAnalysis.bracketDescription}</p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Game Changing Cards:</h4>
            {bracketAnalysis.gameChangers.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {bracketAnalysis.gameChangers.map((cardName, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <IconStar size={14} className="text-yellow-500" />
                    <span className="text-gray-300">{cardName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No game changers in deck</p>
            )}
          </div>
        </div>
      </div>

      {/* Existing stats sections... */}
    </div>
  );
};

export default DeckStats; 