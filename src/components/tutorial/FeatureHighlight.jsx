import React from 'react';
import { useTutorial } from '../../context/TutorialContext';

const FeatureHighlight = ({ 
  children, 
  feature, 
  className = '', 
  highlightClass = 'ring-2 ring-primary-500 ring-opacity-75 shadow-lg',
  showTooltip = false,
  tooltipText = '',
  tooltipPosition = 'top'
}) => {
  const { featureHighlights, highlightFeature, clearFeatureHighlight } = useTutorial();
  const isHighlighted = featureHighlights[feature];

  const getTooltipPosition = () => {
    switch (tooltipPosition) {
      case 'top': return 'bottom-full mb-2';
      case 'bottom': return 'top-full mt-2';
      case 'left': return 'right-full mr-2';
      case 'right': return 'left-full ml-2';
      default: return 'bottom-full mb-2';
    }
  };

  return (
    <div 
      className={`relative ${className} ${isHighlighted ? highlightClass : ''} transition-all duration-300`}
      onMouseEnter={() => highlightFeature(feature)}
      onMouseLeave={() => clearFeatureHighlight(feature)}
    >
      {children}
      
      {isHighlighted && showTooltip && tooltipText && (
        <div className={`absolute z-50 ${getTooltipPosition()} left-1/2 transform -translate-x-1/2`}>
          <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg border border-slate-600 whitespace-nowrap">
            {tooltipText}
            <div className={`absolute w-2 h-2 bg-slate-800 transform rotate-45 ${
              tooltipPosition === 'top' ? 'top-full -mt-1' :
              tooltipPosition === 'bottom' ? 'bottom-full -mb-1' :
              tooltipPosition === 'left' ? 'left-full -ml-1' :
              'right-full -mr-1'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureHighlight; 