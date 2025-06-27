import React from 'react';
import { useDeck } from '../../context/DeckContext';
import { IconCards, IconCrown } from '@tabler/icons-react';

/**
 * Consistent card count display component
 * Shows total cards and provides breakdown when needed
 */
const CardCountDisplay = ({ 
  variant = 'default', // 'default', 'detailed', 'compact'
  showBreakdown = false,
  className = '',
  ...props
}) => {
  const { totalCardCount, mainDeckCardCount, commander, deckCompletionInfo } = useDeck();

  if (variant === 'compact') {
    return (
      <span className={`text-sm font-medium ${className}`} {...props}>
        {totalCardCount} cards
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        <div className="flex items-center space-x-2">
          <IconCards size={20} className="text-primary-400" />
          <span className="text-lg font-bold">
            {totalCardCount} Cards Total
          </span>
        </div>
        
        <div className="text-sm text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Main Deck:</span>
            <span className="font-medium text-slate-300">{mainDeckCardCount} cards</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Commander:</span>
            <span className="font-medium text-slate-300">
              {commander ? (
                <span className="flex items-center space-x-1">
                  <IconCrown size={14} />
                  <span>1 card</span>
                </span>
              ) : (
                '0 cards'
              )}
            </span>
          </div>
        </div>

        {!deckCompletionInfo.isComplete && (
          <div className="text-xs text-yellow-400">
            {deckCompletionInfo.totalRemainingSlots} cards remaining for complete deck
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-2 ${className}`} {...props}>
      <IconCards size={18} className="text-primary-400" />
      <span className="font-semibold">
        {totalCardCount} cards
        {showBreakdown && commander && (
          <span className="text-sm text-slate-400 ml-1">
            ({mainDeckCardCount} + 1 commander)
          </span>
        )}
      </span>
    </div>
  );
};

export default CardCountDisplay; 