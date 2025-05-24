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
  IconSearch
} from '@tabler/icons-react';

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
  const [activeTab, setActiveTab] = useState('overview'); // overview, mana, curve, simulation
  const { cards, commander } = useDeck();

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
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconChartPie size={20} />
                    <span>Mana Color Pie</span>
                  </h3>
                  <ColorPie />
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconChartBar size={20} />
                    <span>Mana Curve</span>
                  </h3>
                  <ManaCurve />
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconCards size={20} />
                    <span>Card Type Distribution</span>
                  </h3>
                  <TypeBar />
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
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
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
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
              
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
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
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
                    <IconChartBar size={20} />
                    <span>Detailed Mana Curve</span>
                  </h3>
                  <ManaCurve />
                </div>
              </div>
               
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
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
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg space-y-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-slate-400 transition-all duration-300"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-slate-400 transition-all duration-300"
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
        </div>
      </div>
      
      {/* TODO: Add export buttons as per markdown */}
      {/* TODO: Add price and salt score once API/keys are sorted */}
    </div>
  );
};

export default DeckStatsIndex; 