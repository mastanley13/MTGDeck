import React from 'react';
import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react';

const CardQuantityControls = ({ 
  card, 
  onUpdateQuantity, 
  onRemoveCard,
  isEditMode = false,
  maxQuantity = 4 // Most formats allow max 4 copies
}) => {
  
  if (!isEditMode) return null;

  const currentQuantity = card.quantity || 1;
  const canIncrease = currentQuantity < maxQuantity;
  const canDecrease = currentQuantity > 1;

  const handleIncrease = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (canIncrease) {
      console.log('Increasing quantity for:', card.name, 'from', currentQuantity, 'to', currentQuantity + 1);
      onUpdateQuantity(card.id, currentQuantity + 1);
    }
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (canDecrease) {
      console.log('Decreasing quantity for:', card.name, 'from', currentQuantity, 'to', currentQuantity - 1);
      onUpdateQuantity(card.id, currentQuantity - 1);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const confirmed = window.confirm(`Remove ${card.name} from deck?`);
    if (confirmed) {
      console.log('Removing card:', card.name);
      onRemoveCard(card.id);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
      <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600/50">
        
        {/* Decrease Quantity */}
        <button
          onClick={handleDecrease}
          disabled={!canDecrease}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          title="Decrease quantity"
        >
          <IconMinus size={14} className="text-white" />
        </button>

        {/* Current Quantity */}
        <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/50 flex items-center justify-center">
          <span className="text-primary-300 text-sm font-bold">{currentQuantity}</span>
        </div>

        {/* Increase Quantity */}
        <button
          onClick={handleIncrease}
          disabled={!canIncrease}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          title="Increase quantity"
        >
          <IconPlus size={14} className="text-white" />
        </button>

        {/* Remove Card */}
        <div className="w-px h-6 bg-slate-600"></div>
        <button
          onClick={handleRemove}
          className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center transition-colors"
          title="Remove card"
        >
          <IconTrash size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
};

export default CardQuantityControls; 