export const símboloManaMap: { [key: string]: string } = {
  W: 'w',
  U: 'u',
  B: 'b',
  R: 'r',
  G: 'g',
  T: 'tap',
  Q: 'untap', // Check if Q is the correct symbol for untap in your data
  X: 'x',
  Y: 'y',
  Z: 'z',
  S: 's', // Snow mana
  C: 'c',
  P: 'p', // Phyrexian mana, often followed by a color, e.g., {WP}
  E: 'e', // Energy
  // Add other specific symbols as needed, e.g., hybrid, Phyrexian colors
};

export const parseManaSymbols = (text: string | undefined): React.ReactNode => {
  if (!text) return '';

  const parts = text.split(/(\{[^}]+\})/g); // Split by {symbol}

  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const symbolKey = part.substring(1, part.length - 1);

      // Handle Phyrexian mana (e.g., {WP}, {UP}, etc.)
      if (symbolKey.endsWith('P') && symbolKey.length === 2) {
        const color = symbolKey.charAt(0).toLowerCase();
        if (['w', 'u', 'b', 'r', 'g'].includes(color)) {
          return <i key={index} className={`ms ms-${color}p ms-cost`} />;
        }
      }
      
      // Handle two-color hybrid mana e.g. {WU}, {UB}
      if (symbolKey.length === 2 && símboloManaMap[symbolKey.charAt(0)] && símboloManaMap[symbolKey.charAt(1)]) {
        const firstColor = symbolKey.charAt(0).toLowerCase();
        const secondColor = symbolKey.charAt(1).toLowerCase();
        // Ensure it's a valid color combination for ms-cost styling or specific hybrid classes if available
        return <i key={index} className={`ms ms-${firstColor}${secondColor} ms-cost`} />;
      }

      const mappedSymbol = símboloManaMap[symbolKey.toUpperCase()];
      if (mappedSymbol) {
        return <i key={index} className={`ms ms-${mappedSymbol} ms-cost`} />;
      }

      // Handle numeric mana costs
      const numericValue = parseInt(symbolKey, 10);
      if (!isNaN(numericValue)) {
        return <i key={index} className={`ms ms-${numericValue} ms-cost`} />;
      }
    }
    return part;
  });
}; 