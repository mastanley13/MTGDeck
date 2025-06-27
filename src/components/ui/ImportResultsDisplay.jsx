import React, { useState } from 'react';

const ImportResultsDisplay = ({ result, onConfirm, onCancel }) => {
  const [showUnresolvedCards, setShowUnresolvedCards] = useState(false);
  const { commander, cards, unresolvedCards, validation, stats, format } = result;
  
  const getFormatLabel = (format) => {
    const labels = {
      moxfield: 'Moxfield',
      edhrec: 'EDHREC',
      archidekt: 'Archidekt',
      tappedout: 'TappedOut',
      mtggoldfish: 'MTGGoldfish',
      generic: 'Generic Text'
    };
    return labels[format] || 'Unknown';
  };
  
  const hasWarnings = unresolvedCards.length > 0;
  const canImport = commander && cards.length > 0;
  
  return (
    <div className="bg-gray-700 rounded-lg p-6 mb-4 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <span>📊</span>
          <span>Import Results</span>
        </h3>
        <div className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded">
          {getFormatLabel(format)} Format
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{cards.length + (commander ? 1 : 0)}</div>
          <div className="text-sm text-gray-400">Unique Cards</div>
        </div>
        <div className="text-center bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{cards.reduce((total, card) => total + (card.quantity || 1), 0) + (commander ? 1 : 0)}</div>
          <div className="text-sm text-gray-400">Total Cards</div>
        </div>
        <div className="text-center bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{stats.unresolved}</div>
          <div className="text-sm text-gray-400">Unresolved</div>
        </div>
      </div>
      
      {/* Commander */}
      {commander && (
        <div className="mb-4 bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-primary-400 mb-2 flex items-center space-x-2">
            <span>👑</span>
            <span>Commander</span>
          </h4>
          <div className="flex items-center space-x-3">
            {commander.image_uris?.small && (
              <img 
                src={commander.image_uris.small} 
                alt={commander.name}
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div>
              <div className="text-white font-medium">{commander.name}</div>
              <div className="text-gray-400 text-sm">{commander.type_line}</div>
              {commander.mana_cost && (
                <div className="text-gray-400 text-sm">
                  Mana Cost: {commander.mana_cost}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Warnings Section */}
      {hasWarnings && (
        <div className="mb-4">
          {/* Unresolved Cards */}
          {unresolvedCards.length > 0 && (
            <div className="mb-3 bg-red-900/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-red-400 flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Unresolved Cards ({unresolvedCards.length})</span>
                </h4>
                <button
                  onClick={() => setShowUnresolvedCards(!showUnresolvedCards)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  {showUnresolvedCards ? 'Hide' : 'Show'}
                </button>
              </div>
              {showUnresolvedCards && (
                <div className="max-h-32 overflow-y-auto">
                  {unresolvedCards.map((cardName, index) => (
                    <div key={index} className="text-gray-300 text-sm py-1">
                      • {cardName}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-400 mt-2">
                These cards will not be included in the imported deck. Check spelling or try different card names.
              </div>
            </div>
          )}
          

        </div>
      )}
      
      {/* Success Message */}
      {!hasWarnings && canImport && (
        <div className="mb-4 bg-green-900/20 border border-green-500 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-400">
            <span>✅</span>
            <span className="font-semibold">Import Ready</span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            All {cards.length + (commander ? 1 : 0)} unique cards resolved successfully! 
            Total of {cards.reduce((total, card) => total + (card.quantity || 1), 0) + (commander ? 1 : 0)} cards ready to import.
          </div>
        </div>
      )}
      
      {/* Partial Success Message */}
      {hasWarnings && canImport && (
        <div className="mb-4 bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-400">
            <span>ℹ️</span>
            <span className="font-semibold">Partial Import Ready</span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {cards.length + (commander ? 1 : 0)} unique cards resolved successfully ({cards.reduce((total, card) => total + (card.quantity || 1), 0) + (commander ? 1 : 0)} total cards). 
            {stats.unresolved} cards could not be found and will be skipped.
          </div>
        </div>
      )}
      
      {/* Error State */}
      {!canImport && (
        <div className="mb-4 bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-400">
            <span>❌</span>
            <span className="font-semibold">Cannot Import</span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {!commander && 'No commander found. '}
            {cards.length === 0 && 'No cards resolved. '}
            Please check your deck list format and try again.
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={!canImport}
          className={`px-6 py-2 rounded-lg transition-colors ${
            canImport
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
        >
          {canImport ? 'Import Deck' : 'Cannot Import'}
        </button>
      </div>
    </div>
  );
};

export default ImportResultsDisplay; 