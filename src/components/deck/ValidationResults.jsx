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
    <div className="glassmorphism-card border-primary-500/20 shadow-modern-primary p-6 text-slate-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gradient-primary flex items-center space-x-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Deck Validation</span>
        </h2>
        <div className={`font-semibold px-4 py-2 rounded-xl text-white shadow-sm ${
          isValid 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'
        } transition-colors duration-200`}>
          {isValid ? (
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Valid</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Invalid</span>
            </span>
          )}
        </div>
      </div>
      
      {!commander && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300">
          <div className="flex items-center space-x-3 mb-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="font-medium">No Commander Selected</p>
          </div>
          <p className="text-sm text-yellow-200">You need to select a commander to validate your deck.</p>
        </div>
      )}
      
      <div className="space-y-4">
        {validations.map((validation, index) => (
          <div 
            key={validation.name}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${
              validation.valid 
                ? 'border-green-500/50 bg-green-500/5' 
                : 'border-red-500/50 bg-red-500/5'
            }`}
          >
            <div 
              className={`p-4 cursor-pointer flex justify-between items-center hover:bg-slate-800/30 transition-colors duration-200 ${
                validation.valid ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'
              }`}
              onClick={() => toggleSection(index)}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  validation.valid 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {validation.valid ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-white text-lg">{validation.name}</h3>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${
                  validation.valid 
                    ? 'text-green-400 bg-green-500/20' 
                    : 'text-red-400 bg-red-500/20'
                }`}>
                  {validation.valid ? 'Valid' : 'Invalid'}
                </span>
                <svg 
                  className={`w-5 h-5 transform transition-transform text-slate-400 ${
                    expandedSection === index ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            
            {expandedSection === index && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
                <p className="mb-4 text-slate-300 leading-relaxed">{validation.message}</p>
                
                {validation.violations && validation.violations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4 text-white flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Violations ({validation.violations.length}):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {validation.violations.map((violation, vIndex) => {
                        const imageUris = getCardImageUris(violation.card);
                        return (
                          <div 
                            key={`${violation.card.id}-${vIndex}`} 
                            className="border border-slate-600/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary-500/50 transition-all duration-200 bg-slate-800/30 p-3 group"
                            onClick={() => handleViolationClick(violation.card)}
                            title={`Go to ${violation.card.name} in deck view`}
                          >
                            <div className="flex items-center space-x-3">
                              {imageUris && (
                                <img 
                                  src={imageUris.small} 
                                  alt={violation.card.name}
                                  className="w-12 h-16 rounded border border-slate-500/50 group-hover:border-primary-500/50 transition-colors duration-200" 
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm text-white group-hover:text-primary-300 transition-colors duration-200 line-clamp-2 leading-tight">
                                  {violation.card.name}
                                </h5>
                                <p className="text-xs text-red-400 mt-1 leading-relaxed">{violation.reason}</p>
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
        <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center space-x-3 mb-2">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-400 font-semibold text-lg">Your deck is Commander legal! 🎉</p>
          </div>
          <p className="text-sm text-green-300 leading-relaxed">All validation checks passed successfully. Your deck is ready for battle!</p>
        </div>
      )}
    </div>
  );
};

export default ValidationResults; 