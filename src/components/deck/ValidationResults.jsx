import React, { useState } from 'react';
import { useDeck } from '../../context/DeckContext';
import { validateDeck, isDeckValid } from '../../utils/deckValidator';
import { getCardImageUris } from '../../utils/scryfallAPI';

const ValidationResults = ({ setActiveTab }) => {
  const { commander, cards } = useDeck();
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Run all validations
  const validations = validateDeck(commander, cards);
  const isValid = isDeckValid(commander, cards);
  
  // Toggle section expansion
  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const handleViolationClick = (card) => {
    // Future: Could also pass card.id to context to highlight/scroll in DeckBuilder
    if (setActiveTab) {
      setActiveTab('deck');
    }
    console.log('Navigate to card:', card.name);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Deck Validation</h2>
        <div className={`font-semibold px-3 py-1 rounded-full text-white ${isValid ? 'bg-green-500' : 'bg-red-500'}`}>
          {isValid ? 'Valid' : 'Invalid'}
        </div>
      </div>
      
      {!commander && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-medium">No Commander Selected</p>
          <p className="text-sm">You need to select a commander to validate your deck.</p>
        </div>
      )}
      
      <div className="space-y-3">
        {validations.map((validation, index) => (
          <div 
            key={validation.name}
            className={`border rounded-lg overflow-hidden ${validation.valid ? 'border-green-200' : 'border-red-200'}`}
          >
            <div 
              className={`p-3 cursor-pointer flex justify-between items-center ${
                validation.valid ? 'bg-green-50' : 'bg-red-50'
              }`}
              onClick={() => toggleSection(index)}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  validation.valid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {validation.valid ? '✓' : '✗'}
                </div>
                <h3 className="font-semibold">{validation.name}</h3>
              </div>
              <div className="flex items-center">
                <span className="text-sm mr-2">
                  {validation.valid ? 'Valid' : 'Invalid'}
                </span>
                <svg 
                  className={`w-5 h-5 transform transition-transform ${expandedSection === index ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            
            {expandedSection === index && (
              <div className="p-4 border-t border-gray-200">
                <p className="mb-3">{validation.message}</p>
                
                {validation.violations && validation.violations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Violations:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {validation.violations.map((violation, vIndex) => {
                        const imageUris = getCardImageUris(violation.card);
                        return (
                          <div 
                            key={`${violation.card.id}-${vIndex}`} 
                            className="border border-gray-200 rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleViolationClick(violation.card)}
                            title={`Go to ${violation.card.name} in deck view`}
                          >
                            <div className="flex items-center p-2">
                              {imageUris && (
                                <img 
                                  src={imageUris.small} 
                                  alt={violation.card.name}
                                  className="w-12 h-16 mr-2 rounded" 
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm truncate">{violation.card.name}</h5>
                                <p className="text-xs text-red-600">{violation.reason}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {isValid && cards.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Your deck is Commander legal! 🎉</p>
          <p className="text-sm text-green-700">All validation checks passed successfully.</p>
        </div>
      )}
    </div>
  );
};

export default ValidationResults; 