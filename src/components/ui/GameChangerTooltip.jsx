import React from 'react';

const GameChangerTooltip = ({ className = '', iconOnly = false }) => {
  return (
    <div className={`group relative inline-flex items-center ${className}`}>
      <div className="flex items-center space-x-1">
        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {!iconOnly && <span className="text-xs font-semibold">Game Changer</span>}
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700 w-max max-w-xs">
        <div className="text-center">
          <p className="font-semibold mb-1">Game Changer Card</p>
          <p className="text-gray-300">Based on EDHREC data, this card has a significant impact on deck performance and win rates.</p>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-700"></div>
      </div>
    </div>
  );
};

export default GameChangerTooltip; 