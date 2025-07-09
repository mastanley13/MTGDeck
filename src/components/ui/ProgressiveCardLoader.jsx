import React from 'react';

const CardLoadingPlaceholder = ({ card, className = '' }) => {
  if (card.isLoaded) return null;

  return (
    <div className={`absolute inset-0 bg-slate-800/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 ${className}`}>
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <div className="text-xs text-slate-300 font-medium">Loading...</div>
      </div>
    </div>
  );
};

export default CardLoadingPlaceholder; 