import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useDeck } from '../../../context/DeckContext';

// Define a color palette for the bars, can be expanded or customized
// Using a more diverse set of colors for type distribution
const TYPE_COLORS = [
  '#8884d8', // Creature - Purple
  '#82ca9d', // Instant - Green
  '#ffc658', // Sorcery - Yellow
  '#ff8042', // Artifact - Orange
  '#00C49F', // Enchantment - Teal
  '#0088FE', // Planeswalker - Blue
  '#A9A9A9', // Land - Dark Gray
  '#FFBB28', // Other - Gold
];

// Helper function to simplify card type line (e.g., "Legendary Creature — Phyrexian Horror" -> "Creature")
function getPrimaryCardType(type_line) {
  if (!type_line) return 'Other';
  if (type_line.includes('Creature')) return 'Creature';
  if (type_line.includes('Instant')) return 'Instant';
  if (type_line.includes('Sorcery')) return 'Sorcery';
  if (type_line.includes('Artifact')) return 'Artifact';
  if (type_line.includes('Enchantment')) return 'Enchantment';
  if (type_line.includes('Planeswalker')) return 'Planeswalker';
  if (type_line.includes('Land')) return 'Land';
  return 'Other';
}

const TypeBar = () => {
  const { cards } = useDeck(); // Commander can also be included if desired, for now just deck cards

  const typeDistributionData = useMemo(() => {
    const types = {
      Creature: 0,
      Instant: 0,
      Sorcery: 0,
      Artifact: 0,
      Enchantment: 0,
      Planeswalker: 0,
      Land: 0,
      Other: 0
    };
    
    cards.forEach(card => {
      const primaryType = getPrimaryCardType(card.type_line);
      const quantity = card.quantity || 1;
      types[primaryType] = (types[primaryType] || 0) + quantity;
    });
    
    // Convert to array format suitable for Recharts
    return Object.entries(types)
      .map(([name, count]) => ({ name, count }))
      .filter(data => data.count > 0); // Only show types present in the deck
  }, [cards]);

  if (!typeDistributionData || typeDistributionData.length === 0) {
    return (
      <div className="text-center text-slate-400 py-4">
        No cards to display type distribution.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={typeDistributionData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
        <XAxis type="number" allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#A0AEC0' }} width={80} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '0.375rem' }}
          itemStyle={{ color: '#cbd5e0' }}
          cursor={{ fill: 'rgba(74, 85, 104, 0.5)' }}
        />
        {/* <Legend /> */}
        <Bar dataKey="count" name="Card Count">
          {typeDistributionData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TypeBar; 