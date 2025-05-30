import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDeck } from '../../context/DeckContext'; // Adjusted path
import ColorPie from './charts/ColorPie';
import ManaCurve from './charts/ManaCurve';
import TypeBar from './charts/TypeBar';
import { calculateManaSources, calculatePipRequirements } from './analyzers/manaSources';
import { getFunctionalBuckets } from './analyzers/bucketClassify';
import ManaSymbolSVG from '../ui/ManaSymbolSVG';
import * as Comlink from 'comlink';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend as RechartsLegend } from 'recharts';
// Tabler Icons
import { 
  IconChartPie, 
  IconChartBar, 
  IconCards, 
  IconBolt, 
  IconTarget,
  IconFlask,
  IconTrendingUp,
  IconAlertTriangle,
  IconInfoCircle,
  IconCheck,
  IconSearch,
  IconCurrencyDollar,
  IconSword,
  IconBulb,
  IconArrowsExchange,
  IconStar
} from '@tabler/icons-react';
import DeckComparison from './comparisons/DeckComparison';
import PriceHistory from './price/PriceHistory';
import { CARD_TYPE_COLORS, STAT_COLORS } from './comparisons/DeckComparison';
import { analyzeBracket } from './analyzers/bracketAnalyzer';

// Define a modern color palette for the charts
const MODERN_CHART_COLORS = [
  '#3b82f6', // blue-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1'  // indigo-500
];

const DeckStatsIndex = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, mana, curve, simulation, strategy, budget, power, recommendations, compare
  const { cards, commander } = useDeck();
  const [comparedDeck, setComparedDeck] = useState(null);

  const manaSources = useMemo(() => {
    if (!cards) return {};
    return calculateManaSources(cards, commander);
  }, [cards, commander]);

  const pipRequirements = useMemo(() => {
    if (!cards) return {};
    return calculatePipRequirements(cards, commander);
  }, [cards, commander]);

  const functionalBuckets = useMemo(() => {
    if (!cards) return {};
    return getFunctionalBuckets(cards, commander);
  }, [cards, commander]);

  // Mulligan Simulator State
  const [numSimulations, setNumSimulations] = useState(10000);
  const [targetLandCount, setTargetLandCount] = useState(3);
  const [simulationResults, setSimulationResults] = useState(null);
  const [simulationError, setSimulationError] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Use useRef for the worker and Comlink API proxy
  const workerRef = useRef(null);
  const comlinkApiRef = useRef(null);

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker(new URL('./analyzers/simulation.worker.js', import.meta.url), {
      type: 'module'
    });
    comlinkApiRef.current = Comlink.wrap(workerRef.current);

    return () => {
      if (comlinkApiRef.current && typeof comlinkApiRef.current[Comlink.releaseProxy] === 'function') {
        comlinkApiRef.current[Comlink.releaseProxy]();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      comlinkApiRef.current = null; // Clean up ref
      workerRef.current = null; // Clean up ref
    };
  }, []); // Empty dependency array, runs once on mount

  const handleRunSimulation = useCallback(async () => {
    if (!comlinkApiRef.current || typeof comlinkApiRef.current.runMulliganSimulation !== 'function') {
      setSimulationError('Simulation worker or method is not ready. Please try again shortly.');
      setIsSimulating(false); // Ensure isSimulating is reset
      return;
    }
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationError(null);
    setSimulationResults(null);

    try {
      const deckCardObjects = [...cards, ...(commander ? [commander] : [])];
      const results = await comlinkApiRef.current.runMulliganSimulation(deckCardObjects, numSimulations, targetLandCount);
      if (results.error) {
        setSimulationError(results.error);
        setSimulationResults(null);
      } else {
        setSimulationResults(results);
      }
    } catch (error) {
      console.error('Simulation Error in handleRunSimulation:', error);
      setSimulationError(`An error occurred during simulation: ${error.message}`);
    }
    setIsSimulating(false);
  }, [cards, commander, numSimulations, targetLandCount, isSimulating]); // comlinkApiRef is stable and not needed in deps

  const renderManaSourceItem = (label, value, manaColor = null) => (
    <li className="flex justify-between items-center py-2 px-3 hover:bg-slate-700/30 rounded-lg transition-colors duration-200">
      <span className="text-slate-300 flex items-center space-x-2">
        {manaColor && <ManaSymbolSVG symbol={`{${manaColor}}`} size="sm" />}
        <span>{label}:</span>
      </span>
      <span className="font-semibold text-primary-400">{value}</span>
    </li>
  );
  
  const landProbDataForChart = useMemo(() => {
    if (!simulationResults || !simulationResults.landProbabilities) return [];
    return Object.entries(simulationResults.landProbabilities)
                 .map(([lands, prob]) => ({ name: `${lands} Lands`, probability: parseFloat(prob) }))
                 .filter(item => item.probability > 0); // Optionally filter out 0% probabilities for cleaner chart
  }, [simulationResults]);

  const getTypeColor = (type) => {
    return CARD_TYPE_COLORS[type] || CARD_TYPE_COLORS.Artifact;
  };

  const getStatColor = (value, metric) => {
    if (metric === 'lands') {
      return value >= 36 ? STAT_COLORS.high :
             value >= 32 ? STAT_COLORS.medium :
             STAT_COLORS.low;
    }
    if (metric === 'interaction') {
      return value >= 10 ? STAT_COLORS.high :
             value >= 6 ? STAT_COLORS.medium :
             STAT_COLORS.low;
    }
    // Add more metric evaluations
    return STAT_COLORS.medium;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm shadow-xl p-6">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
      
      <div className="relative z-10">
        <div className="mb-6 border-b border-slate-700/50">
          <nav className="flex space-x-2 md:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
            {[
              { name: 'Overview', tabKey: 'overview', icon: <IconChartPie size={16} /> },
              { name: 'Mana', tabKey: 'mana', icon: <IconBolt size={16} /> },
              { name: 'Curve/Types', tabKey: 'curve', icon: <IconChartBar size={16} /> },
              { name: 'Simulation', tabKey: 'simulation', icon: <IconFlask size={16} /> },
              { name: 'Strategy', tabKey: 'strategy', icon: <IconSword size={16} /> },
              { name: 'Budget', tabKey: 'budget', icon: <IconCurrencyDollar size={16} /> },
              { name: 'Power Level', tabKey: 'power', icon: <IconTarget size={16} /> },
              { name: 'Recommendations', tabKey: 'recommendations', icon: <IconBulb size={16} /> },
              { name: 'Compare', tabKey: 'compare', icon: <IconArrowsExchange size={16} /> },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.tabKey)}
                className={`${ 
                  activeTab === tab.tabKey
                    ? 'border-primary-500 text-primary-400 bg-primary-500/10'
                    : 'border-transparent text-slate-400 hover:text-primary-400 hover:border-primary-500/50'
                } whitespace-nowrap py-3 px-4 text-xs sm:text-sm font-medium focus:outline-none transition-all rounded-t-xl border-b-2 flex items-center space-x-2`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconChartPie size={20} />
                    <span>Mana Color Pie</span>
                  </h3>
                  <ColorPie />
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconChartBar size={20} />
                    <span>Mana Curve</span>
                  </h3>
                  <ManaCurve />
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconCards size={20} />
                    <span>Card Type Distribution</span>
                  </h3>
                  <TypeBar />
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconTarget size={20} />
                    <span>Functional Roles</span>
                  </h3>
                  {Object.keys(functionalBuckets).length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {renderManaSourceItem('Ramp', functionalBuckets.Ramp || 0)}
                      {renderManaSourceItem('Draw', functionalBuckets.Draw || 0)}
                      {/* Add other buckets as they are implemented */}
                    </ul>
                  ) : (
                    <div className="text-center text-slate-400 py-4">
                      <IconSearch size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No functional roles calculated yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mana' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconBolt size={20} />
                    <span>Mana Sources</span>
                  </h3>
                  {Object.keys(manaSources).length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {renderManaSourceItem('White', manaSources.W || 0, 'W')}
                      {renderManaSourceItem('Blue', manaSources.U || 0, 'U')}
                      {renderManaSourceItem('Black', manaSources.B || 0, 'B')}
                      {renderManaSourceItem('Red', manaSources.R || 0, 'R')}
                      {renderManaSourceItem('Green', manaSources.G || 0, 'G')}
                      {renderManaSourceItem('Colorless', manaSources.C || 0, 'C')}
                      {renderManaSourceItem('Multi-color', manaSources.Multi || 0)}
                    </ul>
                  ) : (
                    <div className="text-center text-slate-400 py-4">
                      <IconSearch size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No mana sources calculated yet.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconTarget size={20} />
                    <span>Colored Pip Requirements</span>
                  </h3>
                  {Object.keys(pipRequirements).length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {renderManaSourceItem('White Pips', pipRequirements.W || 0, 'W')}
                      {renderManaSourceItem('Blue Pips', pipRequirements.U || 0, 'U')}
                      {renderManaSourceItem('Black Pips', pipRequirements.B || 0, 'B')}
                      {renderManaSourceItem('Red Pips', pipRequirements.R || 0, 'R')}
                      {renderManaSourceItem('Green Pips', pipRequirements.G || 0, 'G')}
                    </ul>
                  ) : (
                    <div className="text-center text-slate-400 py-4">
                      <IconSearch size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pip requirements calculated yet.</p>
                    </div>
                  )}
                  <p className='text-slate-500 text-xs mt-4 italic leading-relaxed'>Note: Hybrid/Phyrexian pips are counted towards each of their colored components.</p>
                  <p className='text-slate-400 text-sm mt-3 font-semibold'>Karsten-style land health check (coming soon).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curve' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconChartBar size={20} />
                    <span>Detailed Mana Curve</span>
                  </h3>
                  <ManaCurve />
                </div>
              </div>
               
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconCards size={20} />
                    <span>Detailed Card Types</span>
                  </h3>
                  <TypeBar />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg space-y-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                  <IconFlask size={24} />
                  <span>Mulligan Simulator (Opening Hand)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label htmlFor="numSimulations" className="block text-sm font-medium text-slate-300 mb-2">Number of Simulations:</label>
                    <input 
                      type="number" 
                      id="numSimulations" 
                      value={numSimulations}
                      onChange={(e) => setNumSimulations(Math.max(100, parseInt(e.target.value, 10) || 10000))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-200 focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-slate-400 transition-all duration-300"
                      min="100"
                      step="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="targetLandCount" className="block text-sm font-medium text-slate-300 mb-2">Target Minimum Lands in Hand (7 cards):</label>
                    <input 
                      type="number" 
                      id="targetLandCount" 
                      value={targetLandCount}
                      onChange={(e) => setTargetLandCount(Math.max(0, Math.min(7, parseInt(e.target.value, 10) || 3)))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-200 focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-slate-400 transition-all duration-300"
                      min="0"
                      max="7"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleRunSimulation}
                  disabled={isSimulating || !comlinkApiRef.current} // Check comlinkApiRef.current
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSimulating ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Simulating...</span>
                    </span>
                  ) : (
                    <>
                      <IconFlask size={20} className="mr-2" />
                      Run Simulation
                    </>
                  )}
                </button>

                {simulationError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 text-red-300 rounded-xl text-sm">
                    <p className="font-semibold flex items-center space-x-2">
                      <IconAlertTriangle size={16} />
                      <span>Error:</span>
                    </p>
                    <p className="mt-1">{simulationError}</p>
                  </div>
                )}

                {simulationResults && !simulationError && (
                  <div className="mt-4 space-y-6">
                    <h4 className="text-lg font-semibold text-primary-400 flex items-center space-x-2">
                      <IconTrendingUp size={20} />
                      <span>Simulation Results:</span>
                    </h4>
                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Probability of having at least <span className="font-bold text-primary-400">{simulationResults.targetLandCount}</span> lands 
                        in an opening hand of 7 cards (after {simulationResults.numSimulations} simulations): 
                        <span className="font-bold text-2xl text-green-400 ml-2">{simulationResults.successRate}%</span>
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-md font-semibold text-primary-400 mb-4">Probability Distribution of Land Counts (7 cards):</h5>
                       {landProbDataForChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={landProbDataForChart} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                                <YAxis unit="%" allowDecimals={false} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                                <Tooltip 
                                    formatter={(value) => `${parseFloat(value).toFixed(2)}%`}
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                                      border: '1px solid #475569', 
                                      borderRadius: '0.75rem',
                                      backdropFilter: 'blur(8px)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                />
                                <Bar dataKey="probability" name="Probability">
                                    {landProbDataForChart.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={MODERN_CHART_COLORS[index % MODERN_CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-slate-400 py-4">
                              <IconSearch size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No land probability data to display.</p>
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconSword size={20} />
                    <span>Deck Strategy Analysis</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                      <h4 className="text-sm font-semibold text-primary-300 mb-2">Strategy Distribution</h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex justify-between items-center">
                          <span>Card Draw/Advantage</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.cardDraw || 0} cards</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span>Removal</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.removal || 0} cards</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span>Ramp</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.ramp || 0} cards</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span>Protection</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.protection || 0} cards</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconTarget size={20} />
                    <span>Win Conditions</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                      <h4 className="text-sm font-semibold text-primary-300 mb-3">Primary Win Conditions</h4>
                      <ul className="space-y-2.5 text-sm">
                        <li className="flex justify-between items-center text-slate-300">
                          <span>Combat Damage</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.combatWin || 0} cards</span>
                        </li>
                        <li className="flex justify-between items-center text-slate-300">
                          <span>Combo Pieces</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.combo || 0} cards</span>
                        </li>
                        <li className="flex justify-between items-center text-slate-300">
                          <span>Alternative Win</span>
                          <span className="font-semibold text-slate-200">{functionalBuckets.alternativeWin || 0} cards</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                      <IconCurrencyDollar size={20} />
                      <span>Budget Analysis</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                        <h4 className="text-sm font-semibold text-primary-300 mb-2">Price Distribution</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between items-center text-slate-300">
                            <span>Budget ($0-$1)</span>
                            <span className="font-semibold text-slate-200">{functionalBuckets.budgetCards || 0} cards</span>
                          </li>
                          <li className="flex justify-between items-center text-slate-300">
                            <span>Mid ($1-$5)</span>
                            <span className="font-semibold text-slate-200">{functionalBuckets.midCards || 0} cards</span>
                          </li>
                          <li className="flex justify-between items-center text-slate-300">
                            <span>Premium ($5-$20)</span>
                            <span className="font-semibold text-slate-200">{functionalBuckets.premiumCards || 0} cards</span>
                          </li>
                          <li className="flex justify-between items-center text-slate-300">
                            <span>Expensive ($20+)</span>
                            <span className="font-semibold text-slate-200">{functionalBuckets.expensiveCards || 0} cards</span>
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                        <h4 className="text-sm font-semibold text-primary-300 mb-2">Total Cost</h4>
                        <div className="text-2xl font-bold text-primary-400 text-slate-200">${functionalBuckets.totalCost || '0.00'}</div>
                        <p className="text-xs text-slate-400 mt-1">Based on current market prices</p>
                      </div>
                    </div>
                  </div>
                </div>
                <PriceHistory deck={cards} />
              </div>
            </div>
          )}

          {activeTab === 'power' && (
            <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                  <IconTarget size={20} />
                  <span>Commander Bracket Assessment</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                      {(() => {
                        const bracketAnalysis = analyzeBracket(cards, commander);
                        return (
                          <div className="space-y-4">
                            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-primary-500/30">
                              <div className="text-2xl font-bold text-primary-400">Bracket {bracketAnalysis.bracket}</div>
                              <div className="text-lg font-semibold text-primary-300">{bracketAnalysis.bracketName}</div>
                              <p className="text-sm text-slate-400 mt-2">{bracketAnalysis.bracketDescription}</p>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-primary-300">Deck Restrictions Status:</h4>
                              <ul className="space-y-2">
                                <li className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">Mass Land Destruction</span>
                                  {bracketAnalysis.restrictions.noMLD ? (
                                    <span className="text-green-400 flex items-center"><IconCheck size={16} className="mr-1" /> None</span>
                                  ) : (
                                    <span className="text-red-400 flex items-center"><IconAlertTriangle size={16} className="mr-1" /> Present</span>
                                  )}
                                </li>
                                <li className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">Extra Turns</span>
                                  {bracketAnalysis.restrictions.noExtraTurns ? (
                                    <span className="text-green-400 flex items-center"><IconCheck size={16} className="mr-1" /> None</span>
                                  ) : (
                                    <span className="text-red-400 flex items-center"><IconAlertTriangle size={16} className="mr-1" /> Present</span>
                                  )}
                                </li>
                                <li className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">Infinite Combos</span>
                                  {bracketAnalysis.restrictions.noInfiniteCombo ? (
                                    <span className="text-green-400 flex items-center"><IconCheck size={16} className="mr-1" /> None</span>
                                  ) : (
                                    <span className="text-red-400 flex items-center"><IconAlertTriangle size={16} className="mr-1" /> {bracketAnalysis.potentialComboCount} Found</span>
                                  )}
                                </li>
                                <li className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">Game Changers</span>
                                  <span className={`${bracketAnalysis.gameChangerCount === 0 ? 'text-green-400' : 'text-yellow-400'} flex items-center`}>
                                    {bracketAnalysis.gameChangerCount} Cards
                                  </span>
                                </li>
                                <li className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">Tutors</span>
                                  <span className={`${bracketAnalysis.tutorCount <= 2 ? 'text-green-400' : 'text-yellow-400'} flex items-center`}>
                                    {bracketAnalysis.tutorCount} Cards
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                    <h4 className="text-sm font-semibold text-primary-300 mb-4">Bracket System Guide</h4>
                    <div className="space-y-4 text-sm">
                      <div className="p-3 bg-slate-800/50 rounded border border-slate-600/30">
                        <p className="font-semibold text-primary-300">Bracket 1: Exhibition</p>
                        <p className="text-slate-400 text-xs mt-1">Ultra-casual, no MLD, no infinite combos, no Game Changers</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded border border-slate-600/30">
                        <p className="font-semibold text-primary-300">Bracket 2: Core</p>
                        <p className="text-slate-400 text-xs mt-1">Precon level, no MLD, no infinite combos, no Game Changers</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded border border-slate-600/30">
                        <p className="font-semibold text-primary-300">Bracket 3: Upgraded</p>
                        <p className="text-slate-400 text-xs mt-1">Beyond precon, no MLD, allows late-game infinite combos, ≤3 Game Changers</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded border border-slate-600/30">
                        <p className="font-semibold text-primary-300">Bracket 4: Optimized</p>
                        <p className="text-slate-400 text-xs mt-1">High power, no restrictions other than banned list</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded border border-slate-600/30">
                        <p className="font-semibold text-primary-300">Bracket 5: CEDH</p>
                        <p className="text-slate-400 text-xs mt-1">Competitive EDH, fully optimized for winning</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                  <IconBulb size={20} />
                  <span>Deck Recommendations</span>
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                    <h4 className="text-sm font-semibold text-primary-300 mb-2">Suggested Improvements</h4>
                    <ul className="space-y-3 text-sm">
                      {functionalBuckets.recommendations?.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2 text-slate-300">
                          <IconInfoCircle size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      )) || (
                        <li className="text-slate-400">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/30 transition-colors">
                    <h4 className="text-sm font-semibold text-primary-300 mb-2">Balance Suggestions</h4>
                    <ul className="space-y-3 text-sm">
                      {functionalBuckets.balanceSuggestions?.map((sug, index) => (
                        <li key={index} className="flex items-start space-x-2 text-slate-300">
                          <IconBulb size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span>{sug}</span>
                        </li>
                      )) || (
                        <li className="text-slate-400">No balance suggestions available</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="space-y-6">
              <DeckComparison currentDeck={functionalBuckets} comparedDeck={comparedDeck} />
              
              {!comparedDeck && (
                <div className="flex items-center justify-center p-8 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <span className="text-slate-400">Select a deck to compare with</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* TODO: Add export buttons as per markdown */}
      {/* TODO: Add price and salt score once API/keys are sorted */}
    </div>
  );
};

export default DeckStatsIndex; 