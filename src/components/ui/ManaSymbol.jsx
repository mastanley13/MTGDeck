import React from 'react';

const ManaSymbol = ({ symbol, size = 'md' }) => {
  if (!symbol) return null;

  let symbolKey = symbol.replace(/[{}]/g, '').toLowerCase(); // Normalize: remove braces, lowercase
  let iconClass = '';

  // Determine the correct ms- class
  // This mapping should align with your manaSymbols.tsx or be expanded here
  switch (symbolKey) {
    case 'w': iconClass = 'ms-w'; break;
    case 'u': iconClass = 'ms-u'; break;
    case 'b': iconClass = 'ms-b'; break;
    case 'r': iconClass = 'ms-r'; break;
    case 'g': iconClass = 'ms-g'; break;
    case 'c': iconClass = 'ms-c'; break;
    case 'x': iconClass = 'ms-x'; break;
    case 'y': iconClass = 'ms-y'; break;
    case 'z': iconClass = 'ms-z'; break;
    case 't': iconClass = 'ms-tap'; break;
    case 'q': iconClass = 'ms-untap'; break; // Assuming Q is untap
    case 's': iconClass = 'ms-s'; break; // Snow
    case 'e': iconClass = 'ms-e'; break; // Energy
    // Phyrexian Mana (e.g., {wp}, {up})
    case 'wp': iconClass = 'ms-wp'; break;
    case 'up': iconClass = 'ms-up'; break;
    case 'bp': iconClass = 'ms-bp'; break;
    case 'rp': iconClass = 'ms-rp'; break;
    case 'gp': iconClass = 'ms-gp'; break;
    // Hybrid Mana (e.g., {wu}, {ub})
    // Add all 10 two-color pairs
    case 'wu': case 'uw': iconClass = 'ms-wu'; break;
    case 'wb': case 'bw': iconClass = 'ms-wb'; break;
    case 'ub': case 'bu': iconClass = 'ms-ub'; break;
    case 'ur': case 'ru': iconClass = 'ms-ur'; break;
    case 'br': case 'rb': iconClass = 'ms-br'; break;
    case 'bg': case 'gb': iconClass = 'ms-bg'; break;
    case 'rg': case 'gr': iconClass = 'ms-rg'; break;
    case 'rw': case 'wr': iconClass = 'ms-rw'; break;
    case 'gw': case 'wg': iconClass = 'ms-gw'; break;
    case 'gu': case 'ug': iconClass = 'ms-gu'; break;
    // Hybrid Colorless/Color (e.g., {2w}, {2u})
    case '2w': iconClass = 'ms-2w'; break;
    case '2u': iconClass = 'ms-2u'; break;
    case '2b': iconClass = 'ms-2b'; break;
    case '2r': iconClass = 'ms-2r'; break;
    case '2g': iconClass = 'ms-2g'; break;
    default:
      // Numeric mana
      const num = parseInt(symbolKey, 10);
      if (!isNaN(num) && num >= 0 && num <= 20) { // mana-font supports 0-20, X, Y, Z
        iconClass = `ms-${num}`;
      } else {
        // Fallback for unknown symbols or unhandled hybrid (e.g. tri-color)
        // Render the text directly or a placeholder
        return <span className="mx-0.5" title={symbol}>{symbolKey}</span>;
      }
      break;
  }

  const sizeClasses = {
    sm: 'text-sm', // approx 1em
    md: 'text-base', // approx 1.15em
    lg: 'text-lg', // approx 1.3em
    xl: 'text-xl', // approx 1.5em
  };

  return (
    <i 
      className={`ms ${iconClass} ms-cost ${sizeClasses[size] || 'text-base'} align-middle mx-px`}
      title={symbol}
    />
  );
};

export default ManaSymbol; 