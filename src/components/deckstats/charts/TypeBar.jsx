import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useDeck } from '../../../context/DeckContext';
import { IconCards } from '@tabler/icons-react';

// Modern color palette for card types matching DeckAnalytics
const MODERN_TYPE_COLORS = {
  Creature: '#3b82f6',     // Primary blue
  Instant: '#06b6d4',      // Cyan
  Sorcery: '#8b5cf6',      // Purple
  Artifact: '#94a3b8',     // Slate
  Enchantment: '#10b981',  // Emerald
  Planeswalker: '#f59e0b', // Amber
  Land: '#6b7280',         // Gray
  Other: '#64748b',        // Slate gray
};

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

  const totalCards = typeDistributionData.reduce((sum, data) => sum + data.count, 0);

  if (!typeDistributionData || typeDistributionData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <IconCards size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No cards to display type distribution</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={typeDistributionData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis 
          type="number" 
          allowDecimals={false} 
          tick={{ fill: '#94a3b8' }}
          label={{ 
            value: 'Number of Cards', 
            position: 'insideBottom', 
            offset: -5,
            style: { textAnchor: 'middle', fill: '#94a3b8' }
          }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fill: '#94a3b8' }} 
          width={80}
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
            const percentage = totalCards > 0 ? ((value / totalCards) * 100).toFixed(1) : 0;
            return [`${value} cards (${percentage}%)`, 'Card Count'];
          }}
        />
        {/* <Legend /> */}
        <Bar dataKey="count" name="Card Count" radius={[0, 4, 4, 0]}>
          {typeDistributionData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={MODERN_TYPE_COLORS[entry.name] || '#64748b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TypeBar; 