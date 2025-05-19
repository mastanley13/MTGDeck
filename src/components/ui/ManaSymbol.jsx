import React from 'react';

const ManaSymbol = ({ symbol, size = 'md' }) => {
  if (!symbol) return null;

  const getSymbolDetails = (s) => {
    s = s.toUpperCase();
    let text = s;
    let bgColor = 'bg-gray-400';
    let textColor = 'text-black';
    let isPhyrexian = false;
    let isHybrid = false;
    let parts = [];

    if (s.includes('/P')) {
      isPhyrexian = true;
      s = s.replace('/P', '');
      text = s; // Display the color, Phyrexian aspect handled by icon/style
    }

    if (s.includes('/')) { // Hybrid mana like {W/U} or {2/B}
      isHybrid = true;
      parts = s.split('/').map(p => getSymbolDetails(p)); // Recursive call for each part
      // For hybrid, we might not set a single bgColor/textColor at this level
    } else {
      switch (s) {
        case 'W': bgColor = 'bg-mtg-white'; text = 'W'; textColor = 'text-black'; break;
        case 'U': bgColor = 'bg-mtg-blue'; text = 'U'; textColor = 'text-white'; break;
        case 'B': bgColor = 'bg-mtg-black'; text = 'B'; textColor = 'text-white'; break;
        case 'R': bgColor = 'bg-mtg-red'; text = 'R'; textColor = 'text-white'; break;
        case 'G': bgColor = 'bg-mtg-green'; text = 'G'; textColor = 'text-white'; break;
        case 'C': bgColor = 'bg-mtg-colorless'; text = 'C'; textColor = 'text-black'; break;
        case 'X': bgColor = 'bg-purple-500'; text = 'X'; textColor = 'text-white'; break;
        case 'Y': bgColor = 'bg-purple-500'; text = 'Y'; textColor = 'text-white'; break;
        case 'Z': bgColor = 'bg-purple-500'; text = 'Z'; textColor = 'text-white'; break;
        case 'T': bgColor = 'bg-orange-400'; text = 'Tap'; textColor = 'text-white'; break; // Represent Tap symbol
        case 'Q': bgColor = 'bg-blue-300'; text = 'Untap'; textColor = 'text-black'; break; // Represent Untap symbol
        case 'S': bgColor = 'bg-yellow-300'; text = 'Snow'; textColor = 'text-black'; break; // Snow mana
        default:
          if (!isNaN(parseInt(s))) { // Numeric mana
            bgColor = 'bg-gray-400';
            text = s;
            textColor = 'text-black';
          } else {
            // Fallback for unknown symbols, maybe an error or specific style
            bgColor = 'bg-pink-500'; text = '?'; textColor = 'text-white';
          }
          break;
      }
    }
    return { text, bgColor, textColor, isPhyrexian, isHybrid, parts, originalSymbol: s };
  };

  const details = getSymbolDetails(symbol.replace(/[{}]/g, '')); // Remove curly braces

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  if (details.isHybrid) {
    // Render hybrid symbols side-by-side with a slash or specific styling
    // This is a simplified representation; true hybrid symbols have diagonal splits
    return (
      <span className={`inline-flex items-center justify-center rounded-full shadow-sm border border-gray-500/70 overflow-hidden ${sizeClasses[size]} align-middle mx-0.5`}>
        {details.parts.map((part, index) => (
          <span 
            key={index} 
            className={`flex-1 h-full flex items-center justify-center ${part.bgColor} ${part.textColor} ${index > 0 ? 'border-l border-gray-500/50' : ''}`}
            title={part.originalSymbol}
          >
            {part.text}
            {part.isPhyrexian && <span className="ml-0.5 text-xs">φ</span>} {/* Simple Phyrexian indicator */}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full shadow-sm border border-gray-500/70 ${details.bgColor} ${details.textColor} ${sizeClasses[size]} align-middle mx-0.5`}
      title={symbol}
    >
      {details.text}
      {details.isPhyrexian && <span className="ml-0.5 text-xs">φ</span>} {/* Simple Phyrexian indicator */}
    </span>
  );
};

export default ManaSymbol; 