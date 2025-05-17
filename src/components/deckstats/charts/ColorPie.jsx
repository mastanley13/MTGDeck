import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDeck } from '../../../context/DeckContext';

// Standard Magic color mapping
const PIE_COLORS = {
  W: '#F8F6D8', // Plains - Light Yellow/White
  U: '#C1D7E9', // Island - Light Blue
  B: '#ABA2A2', // Swamp - Dark Gray/Black (adjusted for chart visibility)
  R: '#E8C4C0', // Mountain - Light Red
  G: '#C2D1C1', // Forest - Light Green
  Colorless: '#DCDCDC', // Light Gray for Colorless
  Multi: '#B0A0E0', // Lavender for Multicolored
};

const ColorPie = () => {
  const { cards, commander } = useDeck();

  const colorPipData = useMemo(() => {
    const pipCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    let multiColorPips = 0;
    let colorlessPips = 0; // For cards that produce colorless or have colorless pips

    // Include commander's pips
    const allCards = commander ? [commander, ...cards] : cards;

    allCards.forEach(card => {
      const quantity = card.quantity || 1; // Assume quantity 1 if not present (for commander)
      const manaCost = card.mana_cost;

      if (manaCost) {
        // Example: {1}{W}{U} -> ["1", "W", "U"]
        const symbols = manaCost.match(/\{(.*?)\}/g)?.map(s => s.substring(1, s.length - 1)) || [];
        
        symbols.forEach(symbol => {
          // Check for standard colors
          if (['W', 'U', 'B', 'R', 'G'].includes(symbol)) {
            pipCounts[symbol] = (pipCounts[symbol] || 0) + quantity;
          } 
          // Check for hybrid, Phyrexian, or other multi-implying symbols if needed (simplified for now)
          // For this basic version, we're just counting colored pips directly.
          // Colorless pips in cost (e.g., {C} or generic like {2})
          else if (symbol === 'C' || /\d+/.test(symbol)) { 
            // We are counting colored pips, so generic/colorless in cost doesn't add to WUBRG
          }
          // Other symbols like X, Y, Z, S (snow) are also not WUBRG pips
        });
      }
    });
    
    const chartData = Object.entries(pipCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(entry => entry.value > 0); // Only show colors with pips

    // if (multiColorPips > 0) chartData.push({ name: 'Multi', value: multiColorPips });
    // if (colorlessPips > 0) chartData.push({ name: 'Colorless', value: colorlessPips });


    return chartData;
  }, [cards, commander]);

  if (!colorPipData || colorPipData.length === 0) {
    return (
      <div className="text-center text-slate-400 py-4">
        No mana pips to display. Add cards to your deck.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={colorPipData}
          cx="50%"
          cy="50%"
          labelLine={false}
          // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {colorPipData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '0.375rem' }}
          itemStyle={{ color: '#cbd5e0' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ColorPie; 