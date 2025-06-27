import React, { useState } from 'react';
import { IconX, IconTrash, IconEdit, IconCheck } from '@tabler/icons-react';

const BulkEditModal = ({ 
  isOpen, 
  onClose, 
  selectedCards = [], 
  onBulkQuantityUpdate, 
  onBulkRemove,
  onBulkCategoryChange 
}) => {
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  if (!isOpen) return null;

  const handleBulkQuantityUpdate = () => {
    if (selectedCards.length > 0 && bulkQuantity > 0) {
      onBulkQuantityUpdate(selectedCards, bulkQuantity);
      onClose();
    }
  };

  const handleBulkRemove = () => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedCards.length} card(s) from your deck?`
    );
    if (confirmed && selectedCards.length > 0) {
      onBulkRemove(selectedCards);
      onClose();
    }
  };

  const handleBulkCategoryChange = () => {
    if (selectedCards.length > 0 && selectedCategory) {
      onBulkCategoryChange(selectedCards, selectedCategory);
      onClose();
    }
  };

  const categories = [
    'Creatures', 'Planeswalkers', 'Instants', 'Sorceries', 
    'Artifacts', 'Enchantments', 'Lands', 'Other',
    'Removal', 'Protection', 'Finisher', 'Ramp', 
    'Card Draw', 'Tokens', 'Combo', 'Stax', 'Utility'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glassmorphism-card border-slate-700/50 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-semibold text-white">
            Bulk Edit ({selectedCards.length} cards)
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <IconX size={16} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bulk Quantity Update */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-slate-300">Update Quantity</h4>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="99"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              />
              <button
                onClick={handleBulkQuantityUpdate}
                className="btn-modern btn-modern-primary btn-modern-sm flex items-center space-x-2"
              >
                <IconEdit size={14} />
                <span>Set Quantity</span>
              </button>
            </div>
          </div>

          {/* Bulk Category Change */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-slate-300">Change Category</h4>
            <div className="flex items-center space-x-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={handleBulkCategoryChange}
                disabled={!selectedCategory}
                className="btn-modern btn-modern-primary btn-modern-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconCheck size={14} />
                <span>Apply</span>
              </button>
            </div>
          </div>

          {/* Bulk Remove */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-slate-300">Remove Cards</h4>
            <button
              onClick={handleBulkRemove}
              className="btn-modern btn-modern-lg group bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg rounded-xl px-6 py-3 font-bold transition-all hover:scale-105 w-full flex items-center justify-center space-x-2"
            >
              <IconTrash size={16} />
              <span>Remove Selected Cards</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="btn-modern btn-modern-secondary btn-modern-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal; 