import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDeck } from '../../../context/DeckContext';
import ManaSymbolSVG from '../../ui/ManaSymbolSVG';
import { IconChartPie } from '@tabler/icons-react';

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

// Custom Legend Component with Mana Symbols
const CustomLegend = ({ data }) => {
  if (!data || data.length === 0) return null;

  const totalPips = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {data.map((entry, index) => {
        const percentage = ((entry.value / totalPips) * 100).toFixed(0);
        return (
          <div key={entry.name} className="flex items-center space-x-1 bg-slate-700/50 rounded-lg px-2 py-1">
            <ManaSymbolSVG symbol={`{${entry.name}}`} size="xs" />
            <span className="text-xs font-medium text-slate-300">
              {entry.value} ({percentage}%)
            </span>
          </div>
        );
      })}
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
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <IconChartPie size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No mana pips to display</p>
          <p className="text-xs text-slate-500 mt-1">Add cards to your deck to see color distribution</p>
        </div>
      </div>
    );
  }

  const totalPips = colorPipData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-64 relative">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
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
              strokeWidth={2}
            >
              {colorPipData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={MODERN_PIE_COLORS[entry.name] || '#8b5cf6'} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => {
                const percentage = ((value / totalPips) * 100).toFixed(1);
                return [
                  `${value} pips (${percentage}%)`, 
                  <span key={name} className="flex items-center space-x-2">
                    <ManaSymbolSVG symbol={`{${name}}`} size="sm" />
                    <span>{name === 'W' ? 'White' : name === 'U' ? 'Blue' : name === 'B' ? 'Black' : name === 'R' ? 'Red' : name === 'G' ? 'Green' : name}</span>
                  </span>
                ];
              }}
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid #3b82f6', 
                borderRadius: '0.75rem',
                backdropFilter: 'blur(8px)',
                color: '#e2e8f0'
              }}
              itemStyle={{ color: '#e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend with Mana Symbols */}
      <div className="absolute bottom-0 left-0 right-0">
        <CustomLegend data={colorPipData} />
      </div>
    </div>
  );
};

export default ColorPie; 