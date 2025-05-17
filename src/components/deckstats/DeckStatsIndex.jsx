import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDeck } from '../../context/DeckContext'; // Adjusted path
import ColorPie from './charts/ColorPie';
import ManaCurve from './charts/ManaCurve';
import TypeBar from './charts/TypeBar';
import { calculateManaSources, calculatePipRequirements } from './analyzers/manaSources';
import { getFunctionalBuckets } from './analyzers/bucketClassify';
import * as Comlink from 'comlink';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend as RechartsLegend } from 'recharts';

// Define a color palette for the land probability bars
const LAND_PROB_COLORS = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#d00000', '#8a0000', '#4d0000'];

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

  const renderManaSourceItem = (label, value) => (
    <li className="flex justify-between py-1 px-2 hover:bg-slate-600 rounded">
      <span className="text-slate-300">{label}:</span>
      <span className="font-semibold text-sky-300">{value}</span>
    </li>
  );
  
  const landProbDataForChart = useMemo(() => {
    if (!simulationResults || !simulationResults.landProbabilities) return [];
    return Object.entries(simulationResults.landProbabilities)
                 .map(([lands, prob]) => ({ name: `${lands} Lands`, probability: parseFloat(prob) }))
                 .filter(item => item.probability > 0); // Optionally filter out 0% probabilities for cleaner chart
  }, [simulationResults]);

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-xl">
      <div className="mb-4 border-b border-slate-700">
        <nav className="flex space-x-2 md:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
          {[
            { name: 'Overview', tabKey: 'overview' },
            { name: 'Mana', tabKey: 'mana' },
            { name: 'Curve/Types', tabKey: 'curve' },
            { name: 'Simulation', tabKey: 'simulation' },
          ].map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.tabKey)}
              className={`${ 
                activeTab === tab.tabKey
                  ? 'border-sky-500 text-sky-400 bg-slate-700'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              } whitespace-nowrap py-2 px-3 text-xs sm:text-sm font-medium focus:outline-none transition-all rounded-t-md border-b-2`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Mana Color Pie</h3>
              <ColorPie />
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Mana Curve</h3>
              <ManaCurve />
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Card Type Distribution</h3>
              <TypeBar />
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Functional Roles</h3>
              {Object.keys(functionalBuckets).length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {renderManaSourceItem('Ramp', functionalBuckets.Ramp || 0)}
                  {renderManaSourceItem('Draw', functionalBuckets.Draw || 0)}
                  {/* Add other buckets as they are implemented */}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">No functional roles calculated yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mana' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Mana Sources</h3>
              {Object.keys(manaSources).length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {renderManaSourceItem('White (W)', manaSources.W || 0)}
                  {renderManaSourceItem('Blue (U)', manaSources.U || 0)}
                  {renderManaSourceItem('Black (B)', manaSources.B || 0)}
                  {renderManaSourceItem('Red (R)', manaSources.R || 0)}
                  {renderManaSourceItem('Green (G)', manaSources.G || 0)}
                  {renderManaSourceItem('Colorless (C)', manaSources.C || 0)}
                  {renderManaSourceItem('Multi-color', manaSources.Multi || 0)}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">No mana sources calculated yet.</p>
              )}
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Colored Pip Requirements</h3>
              {Object.keys(pipRequirements).length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {renderManaSourceItem('White Pips', pipRequirements.W || 0)}
                  {renderManaSourceItem('Blue Pips', pipRequirements.U || 0)}
                  {renderManaSourceItem('Black Pips', pipRequirements.B || 0)}
                  {renderManaSourceItem('Red Pips', pipRequirements.R || 0)}
                  {renderManaSourceItem('Green Pips', pipRequirements.G || 0)}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">No pip requirements calculated yet.</p>
              )}
              <p className='text-slate-500 text-xs mt-3 italic'>Note: Hybrid/Phyrexian pips are counted towards each of their colored components.</p>
              <p className='text-slate-400 text-sm mt-4 font-semibold'>Karsten-style land health check (coming soon).</p>
            </div>
          </div>
        )}

        {activeTab === 'curve' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Detailed Mana Curve</h3>
              <ManaCurve />
            </div>
             <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Detailed Card Types</h3>
              <TypeBar />
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="bg-slate-700/50 p-4 rounded-lg shadow-md space-y-6">
            <h3 className="text-xl font-semibold text-sky-300 mb-2">Mulligan Simulator (Opening Hand)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="numSimulations" className="block text-sm font-medium text-slate-300 mb-1">Number of Simulations:</label>
                <input 
                  type="number" 
                  id="numSimulations" 
                  value={numSimulations}
                  onChange={(e) => setNumSimulations(Math.max(100, parseInt(e.target.value, 10) || 10000))}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label htmlFor="targetLandCount" className="block text-sm font-medium text-slate-300 mb-1">Target Minimum Lands in Hand (7 cards):</label>
                <input 
                  type="number" 
                  id="targetLandCount" 
                  value={targetLandCount}
                  onChange={(e) => setTargetLandCount(Math.max(0, Math.min(7, parseInt(e.target.value, 10) || 3)))}
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  min="0"
                  max="7"
                />
              </div>
            </div>

            <button 
              onClick={handleRunSimulation}
              disabled={isSimulating || !comlinkApiRef.current} // Check comlinkApiRef.current
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </button>

            {simulationError && (
              <div className="mt-4 p-3 bg-red-800/50 border border-red-700 text-red-200 rounded-md text-sm">
                <p className="font-semibold">Error:</p>
                <p>{simulationError}</p>
              </div>
            )}

            {simulationResults && !simulationError && (
              <div className="mt-4 space-y-4">
                <h4 className="text-lg font-semibold text-sky-400">Simulation Results:</h4>
                <p className="text-sm text-slate-300">
                  Probability of having at least <span className="font-bold text-sky-300">{simulationResults.targetLandCount}</span> lands 
                  in an opening hand of 7 cards (after {simulationResults.numSimulations} simulations): 
                  <span className="font-bold text-2xl text-green-400 ml-2">{simulationResults.successRate}%</span>
                </p>
                
                <div>
                  <h5 className="text-md font-semibold text-sky-400 mb-2">Probability Distribution of Land Counts (7 cards):</h5>
                   {landProbDataForChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={landProbDataForChart} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
                            <YAxis unit="%" allowDecimals={false} domain={[0, 100]} tick={{ fill: '#A0AEC0' }} />
                            <Tooltip 
                                formatter={(value) => `${parseFloat(value).toFixed(2)}%`}
                                contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '0.375rem' }}
                                itemStyle={{ color: '#cbd5e0' }}
                                cursor={{ fill: 'rgba(74, 85, 104, 0.5)' }}
                            />
                            <Bar dataKey="probability" name="Probability">
                                {landProbDataForChart.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={LAND_PROB_COLORS[index % LAND_PROB_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-400 text-sm">No land probability data to display.</p>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
        
      {/* TODO: Add export buttons as per markdown */}
      {/* TODO: Add price and salt score once API/keys are sorted */}
    </div>
  );
};

export default DeckStatsIndex; 