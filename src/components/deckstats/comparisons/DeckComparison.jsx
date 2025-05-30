import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IconArrowsExchange, IconChartBar } from '@tabler/icons-react';

// Color coding for different card types
export const CARD_TYPE_COLORS = {
  Creature: '#22c55e',     // green-500
  Instant: '#3b82f6',      // blue-500
  Sorcery: '#8b5cf6',      // violet-500
  Artifact: '#94a3b8',     // slate-400
  Enchantment: '#f59e0b',  // amber-500
  Planeswalker: '#ec4899', // pink-500
  Land: '#84cc16',         // lime-500
  Commander: '#f43f5e'     // rose-500
};

// Color coding for statistics
export const STAT_COLORS = {
  high: '#22c55e',    // green-500
  medium: '#f59e0b',  // amber-500
  low: '#ef4444',     // red-500
};

const DeckComparison = ({ currentDeck, comparedDeck }) => {
  const [comparisonMetric, setComparisonMetric] = useState('manaValue'); // manaValue, cardTypes, strategy

  const getComparisonData = () => {
    if (!currentDeck || !comparedDeck) {
      return [];
    }

    switch (comparisonMetric) {
      case 'manaValue':
        return [
          {
            name: 'Average CMC',
            current: currentDeck.averageCMC || 0,
            compared: comparedDeck.averageCMC || 0,
          },
          {
            name: 'Ramp Count',
            current: currentDeck.ramp || 0,
            compared: comparedDeck.ramp || 0,
          },
          {
            name: 'Card Draw',
            current: currentDeck.cardDraw || 0,
            compared: comparedDeck.cardDraw || 0,
          },
        ];
      case 'cardTypes':
        return [
          {
            name: 'Creatures',
            current: currentDeck.creatures || 0,
            compared: comparedDeck.creatures || 0,
            color: CARD_TYPE_COLORS.Creature
          },
        ];
      case 'strategy':
        return [
          {
            name: 'Interaction',
            current: currentDeck.interaction || 0,
            compared: comparedDeck.interaction || 0,
          },
        ];
      default:
        return [];
    }
  };

  const getMetricColor = (value, metric) => {
    if (metric === 'averageCMC') {
      return value <= 2.5 ? STAT_COLORS.high : 
             value <= 3.5 ? STAT_COLORS.medium : 
             STAT_COLORS.low;
    }
    return STAT_COLORS.medium;
  };

  // If no decks to compare, show placeholder
  if (!currentDeck || !comparedDeck) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary-400 flex items-center space-x-2">
              <IconArrowsExchange size={20} />
              <span>Deck Comparison</span>
            </h3>
          </div>
          <div className="text-center py-8">
            <span className="text-slate-400">Select a deck to compare with your current deck</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary-400 flex items-center space-x-2">
            <IconArrowsExchange size={20} />
            <span>Deck Comparison</span>
          </h3>
          <div className="flex space-x-2">
            <select
              value={comparisonMetric}
              onChange={(e) => setComparisonMetric(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="manaValue">Mana Value</option>
              <option value="cardTypes">Card Types</option>
              <option value="strategy">Strategy</option>
            </select>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getComparisonData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid #475569',
                  borderRadius: '0.75rem',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="current" name="Current Deck" fill="#3b82f6" />
              <Bar dataKey="compared" name="Compared Deck" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
            <h4 className="text-sm font-semibold text-primary-300 mb-3">Key Differences</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Higher interaction count (+3)</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
            <h4 className="text-sm font-semibold text-primary-300 mb-3">Recommendations</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Consider adding more card draw</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckComparison; 