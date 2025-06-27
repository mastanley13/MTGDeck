import React, { useState } from 'react';

const BulkCategoryModal = ({ isOpen, onClose, onBulkCategorize }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCardType, setSelectedCardType] = useState('');

  const predefinedCategories = [
    'Removal', 'Protection', 'Finisher', 'Ramp', 'Card Draw', 'Tokens', 
    'Combo', 'Stax', 'Utility', 'Maybeboard', 'Sideboard'
  ];

  const cardTypes = [
    'All Creatures', 'All Instants', 'All Sorceries', 'All Artifacts', 
    'All Enchantments', 'All Planeswalkers', 'All Lands'
  ];

  const handleSubmit = () => {
    if (selectedCategory && selectedCardType) {
      onBulkCategorize(selectedCardType, selectedCategory);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-600">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Bulk Categorize Cards</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Card Type
              </label>
              <select
                value={selectedCardType}
                onChange={(e) => setSelectedCardType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Choose card type...</option>
                {cardTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assign Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Choose category...</option>
                {predefinedCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3 mt-4">
              <p className="text-sm text-slate-300">
                <span className="font-medium">Example:</span> Select "All Instants" and "Removal" to categorize 
                all instant spells in your deck as removal cards.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedCategory || !selectedCardType}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Apply Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCategoryModal; 