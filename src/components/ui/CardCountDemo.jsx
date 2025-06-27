import React from 'react';
import { useDeck } from '../../context/DeckContext';
import { getTotalCardCount, getMainDeckCardCount, getDeckCompletionInfo } from '../../utils/deckHelpers';
import { analyzeDeck } from '../../utils/deckAnalytics';
import { IconCards, IconCheck, IconAlertTriangle } from '@tabler/icons-react';

/**
 * Demo component to show consistent card counting across the application
 */
const CardCountDemo = () => {
  const { commander, cards, totalCardCount, mainDeckCardCount, deckCompletionInfo } = useDeck();
  
  // Test the utility functions directly
  const utilityTotalCount = getTotalCardCount(cards, commander);
  const utilityMainCount = getMainDeckCardCount(cards);
  const utilityCompletionInfo = getDeckCompletionInfo(cards, commander);
  
  // Test the analytics function
  const analysis = analyzeDeck({ commander, cards });
  
  return (
    <div className="space-y-6 p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <h3 className="text-lg font-semibold text-primary-400 flex items-center space-x-2">
        <IconCards size={20} />
        <span>Card Count Verification</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-white">Context Values:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total (including commander):</span>
              <span className="font-medium text-white">{totalCardCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Main deck only:</span>
              <span className="font-medium text-white">{mainDeckCardCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Has commander:</span>
              <span className="font-medium text-white">{commander ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-white">Utility Functions:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">getTotalCardCount():</span>
              <span className="font-medium text-white">{utilityTotalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">getMainDeckCardCount():</span>
              <span className="font-medium text-white">{utilityMainCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deck complete:</span>
              <span className="font-medium text-white">{utilityCompletionInfo.isComplete ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {analysis && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">Analytics Function:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">analysis.totalCards:</span>
              <span className="font-medium text-white">{analysis.totalCards}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">analysis.mainDeckCards:</span>
              <span className="font-medium text-white">{analysis.mainDeckCards}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">analysis.hasCommander:</span>
              <span className="font-medium text-white">{analysis.hasCommander ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t border-slate-700/50">
        <h4 className="font-medium text-white mb-3">Consistency Check:</h4>
        <div className="space-y-2">
          {totalCardCount === utilityTotalCount && totalCardCount === (analysis?.totalCards || 0) ? (
            <div className="flex items-center space-x-2 text-green-400">
              <IconCheck size={16} />
              <span className="text-sm">Total card counts are consistent</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-400">
              <IconAlertTriangle size={16} />
              <span className="text-sm">Total card counts are inconsistent</span>
            </div>
          )}
          
          {mainDeckCardCount === utilityMainCount && mainDeckCardCount === (analysis?.mainDeckCards || 0) ? (
            <div className="flex items-center space-x-2 text-green-400">
              <IconCheck size={16} />
              <span className="text-sm">Main deck counts are consistent</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-400">
              <IconAlertTriangle size={16} />
              <span className="text-sm">Main deck counts are inconsistent</span>
            </div>
          )}
          
          {totalCardCount === mainDeckCardCount + (commander ? 1 : 0) ? (
            <div className="flex items-center space-x-2 text-green-400">
              <IconCheck size={16} />
              <span className="text-sm">Total = Main deck + Commander calculation is correct</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-400">
              <IconAlertTriangle size={16} />
              <span className="text-sm">Total ≠ Main deck + Commander calculation is incorrect</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-500 mt-4">
        This component verifies that all card counting functions return consistent values across the application.
      </div>
    </div>
  );
};

export default CardCountDemo; 