import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDeck } from '../../../context/DeckContext';
import { IconChartBar } from '@tabler/icons-react';

// Modern color for the bars
const MODERN_BAR_COLOR = '#3b82f6'; // Primary blue

const ManaCurve = () => {
  const { cards } = useDeck(); // Commander is not typically included in mana curve chart

  const manaCurveData = useMemo(() => {
    const curve = {
      0: { count: 0, name: '0' }, 
      1: { count: 0, name: '1' }, 
      2: { count: 0, name: '2' }, 
      3: { count: 0, name: '3' }, 
      4: { count: 0, name: '4' }, 
      5: { count: 0, name: '5' }, 
      6: { count: 0, name: '6' }, 
      '7+': { count: 0, name: '7+' }
    };
    
    cards.forEach(card => {
      // Ensure card.type_line is not undefined before calling .includes()
      if (card.type_line && card.type_line.toLowerCase().includes('land')) {
        return; // Lands are typically excluded from the mana curve
      }
      const cmc = Math.floor(card.cmc || 0);
      const quantity = card.quantity || 1;
      
      if (cmc >= 7) {
        curve['7+'].count += quantity;
      } else if (curve[cmc] !== undefined) { // Check if cmc key exists
        curve[cmc].count += quantity;
      } else {
        // This case should ideally not be hit if card.cmc is always a number
        // but as a fallback, or if new unexpected CMC values appear:
        console.warn(`Card with unexpected CMC found: ${card.name}, CMC: ${card.cmc}`);
      }
    });
    
    // Convert to array format suitable for Recharts, and filter out zero-count CMC values
    return Object.entries(curve)
      .map(([key, value]) => ({ name: value.name, count: value.count }))
      // .filter(data => data.count > 0); // Optionally, filter out CMCs with 0 cards
  }, [cards]);

  const totalNonLandCards = manaCurveData.reduce((sum, data) => sum + data.count, 0);

  if (!manaCurveData || manaCurveData.length === 0 || manaCurveData.every(d => d.count === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <IconChartBar size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No non-land cards to display mana curve</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={manaCurveData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#94a3b8' }}
          label={{ 
            value: 'Converted Mana Cost', 
            position: 'insideBottom', 
            offset: -10,
            style: { textAnchor: 'middle', fill: '#94a3b8' }
          }}
        />
        <YAxis 
          allowDecimals={false} 
          tick={{ fill: '#94a3b8' }}
          label={{ 
            value: 'Number of Cards', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#94a3b8' }
          }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
            border: '1px solid #3b82f6', 
            borderRadius: '0.75rem',
            backdropFilter: 'blur(8px)',
            color: '#e2e8f0'
          }}
          itemStyle={{ color: '#e2e8f0' }}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          formatter={(value, name) => {
            const percentage = totalNonLandCards > 0 ? ((value / totalNonLandCards) * 100).toFixed(1) : 0;
            return [`${value} cards (${percentage}% of non-lands)`, 'Cards'];
          }}
          labelFormatter={(label) => `CMC ${label}`}
        />
        <Bar dataKey="count" name="Cards" radius={[4, 4, 0, 0]}>
          {manaCurveData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={MODERN_BAR_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ManaCurve; 