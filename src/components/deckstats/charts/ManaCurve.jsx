import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDeck } from '../../../context/DeckContext';

// Define a color palette for the bars, can be expanded or customized
const BAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  if (!manaCurveData || manaCurveData.length === 0 || manaCurveData.every(d => d.count === 0)) {
    return (
      <div className="text-center text-slate-400 py-4">
        No non-land cards to display mana curve.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={manaCurveData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
        <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
        <YAxis allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '0.375rem' }}
          itemStyle={{ color: '#cbd5e0' }}
          cursor={{ fill: 'rgba(74, 85, 104, 0.5)' }}
        />
        <Bar dataKey="count" name="Cards" unit="">
          {manaCurveData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ManaCurve; 