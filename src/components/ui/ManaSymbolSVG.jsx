import React from 'react';

const ManaSymbolSVG = ({ symbol, size = 'md', className = '' }) => {
  if (!symbol) return null;

  // Normalize the symbol - remove braces and make lowercase
  let symbolKey = symbol.replace(/[{}]/g, '').toLowerCase();
  
  // Map symbol keys to SVG file names
  const symbolToFile = {
    'w': 'w.svg',
    'u': 'u.svg', 
    'b': 'b.svg',
    'r': 'r.svg',
    'g': 'g.svg',
    'c': 'c.svg',
    'colorless': 'c.svg',
    // Add number symbols
    '0': '0.svg',
    '1': '1.svg',
    '2': '2.svg',
    '3': '3.svg',
    '4': '4.svg',
    '5': '5.svg',
    '6': '6.svg',
    '7': '7.svg',
    '8': '8.svg',
    '9': '9.svg',
    '10': '10.svg',
    // Add special symbols
    'x': 'x.svg',
    'y': 'y.svg',
    'z': 'z.svg',
    'tap': 'tap.svg',
    't': 'tap.svg',
    'untap': 'untap.svg',
    'q': 'untap.svg',
  };

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  // Get the SVG filename
  const svgFile = symbolToFile[symbolKey];
  
  if (!svgFile) {
    // For unknown symbols, try to parse as number
    const num = parseInt(symbolKey, 10);
    if (!isNaN(num) && num >= 0 && num <= 20) {
      const numFile = `${num}.svg`;
      if (symbolToFile[num.toString()]) {
        return (
          <img 
            src={`/Icons/svg/${numFile}`}
            alt={symbol}
            className={`${sizeClasses[size] || 'w-5 h-5'} inline-block ${className}`}
            title={symbol}
          />
        );
      }
    }
    
    // Fallback for unknown symbols
    return (
      <span 
        className={`inline-flex items-center justify-center ${sizeClasses[size] || 'w-5 h-5'} bg-slate-600 text-white text-xs rounded-full ${className}`}
        title={symbol}
      >
        {symbolKey.toUpperCase()}
      </span>
    );
  }

  return (
    <img 
      src={`/Icons/svg/${svgFile}`}
      alt={symbol}
      className={`${sizeClasses[size] || 'w-5 h-5'} inline-block ${className}`}
      title={symbol}
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
      }}
    />
  );
};

export default ManaSymbolSVG; 