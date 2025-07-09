import React, { useState, useRef, useEffect } from 'react';
import { useDeck } from '../../context/DeckContext';

const CardCategorySelector = ({ card, onClose, position }) => {
  const { updateCardCategory, cardCategories, getCardType } = useDeck();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const dropdownRef = useRef(null);

  // Predefined categories inspired by Archidekt and common deck building
  const predefinedCategories = [
    // Default type-based categories
    { name: 'Creatures', color: 'text-green-300', description: 'Creature spells' },
    { name: 'Instants', color: 'text-blue-300', description: 'Instant spells' },
    { name: 'Sorceries', color: 'text-red-300', description: 'Sorcery spells' },
    { name: 'Artifacts', color: 'text-gray-300', description: 'Artifact spells' },
    { name: 'Enchantments', color: 'text-pink-300', description: 'Enchantment spells' },
    { name: 'Planeswalkers', color: 'text-purple-300', description: 'Planeswalker spells' },
    { name: 'Lands', color: 'text-amber-300', description: 'Land cards' },
    
    // Custom functional categories
    { name: 'Removal', color: 'text-red-400', description: 'Removal and destruction' },
    { name: 'Protection', color: 'text-blue-400', description: 'Protective spells' },
    { name: 'Finisher', color: 'text-yellow-400', description: 'Win conditions' },
    { name: 'Ramp', color: 'text-green-400', description: 'Mana acceleration' },
    { name: 'Card Draw', color: 'text-cyan-400', description: 'Card advantage' },
    { name: 'Tokens', color: 'text-orange-400', description: 'Token generators' },
    { name: 'Combo', color: 'text-purple-400', description: 'Combo pieces' },
    { name: 'Stax', color: 'text-gray-400', description: 'Resource denial' },
    { name: 'Utility', color: 'text-slate-400', description: 'Utility spells' },
    { name: 'Maybeboard', color: 'text-yellow-500', description: 'Considering for deck' },
    { name: 'Sideboard', color: 'text-indigo-400', description: 'Sideboard cards' },
  ];

  const currentCategory = cardCategories[card.id] || getCardType(card);
  const defaultCategory = getCardType(card);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCategorySelect = (categoryName) => {
    if (categoryName === defaultCategory) {
      // If selecting the default category, remove custom category
      updateCardCategory(card.id, null);
    } else {
      updateCardCategory(card.id, categoryName);
    }
    onClose();
  };

  const handleCustomCategorySubmit = () => {
    if (customCategoryName.trim()) {
      updateCardCategory(card.id, customCategoryName.trim());
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCustomCategorySubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl min-w-64 max-w-80"
      style={{
        top: position.y,
        left: position.x,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Change Category</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-xs text-slate-400 mb-3">
          <span className="font-medium">{card.name}</span>
          <div className="mt-1">Current: <span className="text-primary-400">{currentCategory}</span></div>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {predefinedCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategorySelect(category.name)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-slate-700 ${
                currentCategory === category.name ? 'bg-slate-700 border border-primary-500/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${category.color}`}>
                  {category.name}
                </span>
                {currentCategory === category.name && (
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {category.description}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-600">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Custom Category</span>
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter category name..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCustomCategorySubmit}
                  className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategoryName('');
                  }}
                  className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardCategorySelector; 