import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDeck } from '../../../context/DeckContext';

// MTG Mana Symbol Component with white background for visibility
const ManaSymbol = ({ color, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorMap = {
    W: { name: 'White', path: '/Icons/svg/w.svg' },
    U: { name: 'Blue', path: '/Icons/svg/u.svg' },
    B: { name: 'Black', path: '/Icons/svg/b.svg' },
    R: { name: 'Red', path: '/Icons/svg/r.svg' },
    G: { name: 'Green', path: '/Icons/svg/g.svg' },
    C: { name: 'Colorless', path: '/Icons/svg/c.svg' }
  };

  const symbol = colorMap[color];
  if (!symbol) return <span className="text-slate-400">({color})</span>;

  return (
    <div className={`${sizeClasses[size]} inline-flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm`} title={symbol.name}>
      <img 
        src={symbol.path} 
        alt={symbol.name}
        className="w-full h-full"
      />
    </div>
  );
};

// Modern MTG color palette for pie chart
const MODERN_PIE_COLORS = {
  W: '#f8fafc', // slate-50 - Clean white
  U: '#3b82f6', // blue-500 - Modern blue
  B: '#1e293b', // slate-800 - Dark but visible
  R: '#ef4444', // red-500 - Modern red
  G: '#10b981', // emerald-500 - Modern green
  Colorless: '#94a3b8', // slate-400 - Modern gray
  Multi: '#8b5cf6', // violet-500 - Modern purple
};

// Custom Legend Component
const CustomLegend = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {data.map((entry, index) => (
        <div key={entry.name} className="flex items-center space-x-2 bg-slate-700/30 px-3 py-2 rounded-lg">
          <ManaSymbol color={entry.name} size="sm" />
          <span className="text-slate-300 text-sm font-medium">
            {entry.value} ({Math.round((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
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
      <div className="text-center text-slate-400 py-8">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19c-5 0-7-3-7-7s2-7 7-7 7 3 7 7-2 7-7 7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9l6 6m0 0l-6 6m6-6H3" />
        </svg>
        <p className="text-sm">No mana pips to display</p>
        <p className="text-xs text-slate-500 mt-1">Add cards to your deck to see color distribution</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={colorPipData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={1}
          >
            {colorPipData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={MODERN_PIE_COLORS[entry.name] || '#8b5cf6'} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [
              `${value} pips`, 
              <span key={name} className="flex items-center space-x-2">
                <ManaSymbol color={name} size="sm" />
                <span>{name === 'W' ? 'White' : name === 'U' ? 'Blue' : name === 'B' ? 'Black' : name === 'R' ? 'Red' : name === 'G' ? 'Green' : name}</span>
              </span>
            ]}
            contentStyle={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.95)', 
              border: '1px solid #475569', 
              borderRadius: '0.75rem',
              backdropFilter: 'blur(8px)',
              color: '#e2e8f0'
            }}
            itemStyle={{ color: '#e2e8f0' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <CustomLegend data={colorPipData} />
    </div>
  );
};

export default ColorPie; 