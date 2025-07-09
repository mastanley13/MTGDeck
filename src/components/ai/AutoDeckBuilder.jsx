import React, { useState, useEffect } from 'react';
import { useAutoDeckBuilder } from '../../hooks/useAutoDeckBuilder';
import { useDeck } from '../../context/DeckContext';
import { IconCrown, IconRobot, IconCurrencyDollar } from '@tabler/icons-react';
import ValidationSummary from '../deck/ValidationSummary';

/**
 * Component for automatically building complete decks with AI
 */
const AutoDeckBuilder = () => {
  const { commander, cards, totalCardCount } = useDeck();
  const [deckStyle, setDeckStyle] = useState('competitive');
  const [customBudget, setCustomBudget] = useState(100); // Default budget for Budget Friendly
  const { 
    buildCompleteDeck, 
    isLoading, 
    error, 
    progress, 
    paywallBlocked, 
    clearPaywallBlocked,
    // Progressive UI state - keeping for potential future use but not displaying popup
    buildingStage,
    currentCards,
    currentViolations,
    appliedFixes
  } = useAutoDeckBuilder();
  
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const styleOptions = [
    { id: 'competitive', label: 'Competitive' },
    { id: 'casual', label: 'Casual' },
    { id: 'budget', label: 'Budget Friendly' }
  ];

  // Budget preset options
  const budgetPresets = [
    { value: 25, label: 'Ultra Budget ($25)' },
    { value: 50, label: 'Budget ($50)' },
    { value: 100, label: 'Casual Budget ($100)' },
    { value: 200, label: 'Optimized Budget ($200)' },
    { value: 500, label: 'High Budget ($500)' }
  ];

  const handleStyleChange = (e) => {
    setDeckStyle(e.target.value);
  };

  const handleBudgetChange = (e) => {
    setCustomBudget(Number(e.target.value));
  };

  const handleBudgetPreset = (budget) => {
    setCustomBudget(budget);
  };

  const handleBuildDeck = () => {
    // Pass custom budget if using budget archetype
    const buildOptions = deckStyle === 'budget' ? { customBudget } : {};
    buildCompleteDeck(deckStyle, buildOptions);
  };

  const nonCommanderCardCount = commander ? totalCardCount - 1 : 0;

  // Get current stage description for the three-stage pipeline
  const getStageDescription = () => {
    if (buildingStage.includes('Generating initial deck structure')) {
      return 'Stage 1: High-quality generation for optimal synergy';
    }
    if (buildingStage.includes('Scanning for validation issues')) {
      return 'Stage 2: AI validation scan for rule compliance';
    }
    if (buildingStage.includes('Fixing') && buildingStage.includes('validation issues')) {
      return 'Stage 3: Smart replacement of invalid cards';
    }
    if (buildingStage.includes('Final validation check')) {
      return 'Stage 3b: Final validation pass for critical violations';
    }
    if (buildingStage.includes('Fetching card data')) {
      return 'Stage 4: Building final deck with complete card data';
    }
    if (buildingStage.includes('Deck complete')) {
      return 'Three-stage pipeline completed successfully!';
    }
    return buildingStage || 'Initializing AI deck builder';
  };

  return (
    <div className="relative">
      <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                <IconRobot size={16} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Deck Builder AI</h3>
            </div>
            <div className="text-sm text-slate-400">
              {totalCardCount} / 100 cards
            </div>
          </div>
          {/* Header - Clickable to toggle */}
          <div 
            className="p-6 text-white cursor-pointer flex justify-between items-center group hover:bg-slate-800/30 transition-all duration-300"
            onClick={toggleExpand}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
                <IconRobot size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>A.I. Deck Generator</h2>
                <p className="text-slate-400 mt-1">Intelligent deck building powered by AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-6 w-6 transition-transform duration-300 text-slate-400 group-hover:text-primary-400 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Collapsible Content */}
          {isExpanded && (
            <div className="p-6 pt-0 text-white border-t border-slate-700/50">
              {commander && (
                <div className="mb-6 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                    <IconCrown size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Selected Commander:</p>
                    <p className="text-primary-400 font-semibold text-lg">{commander.name}</p>
                  </div>
                </div>
              )}
              
              <p className="text-base mb-8 text-slate-300 leading-relaxed">
                Unleash the power of AI to craft a unique 99-card Commander deck, perfectly tuned to your chosen leader and desired play style.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-white flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
                  </svg>
                  <span>Deck Archetype</span>
                </label>
                <div className="relative">
                  <select
                    value={deckStyle}
                    onChange={handleStyleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-slate-400 transition-all duration-300 hover:border-slate-500/50 appearance-none"
                    disabled={isLoading}
                  >
                    {styleOptions.map(option => (
                      <option 
                        key={option.id} 
                        value={option.id}
                        className="bg-slate-800 text-white"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
                    </svg>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Budget Controls - Only show when Budget Friendly is selected */}
              {deckStyle === 'budget' && (
                <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <label className="block text-sm font-semibold mb-3 text-white flex items-center space-x-2">
                    <IconCurrencyDollar size={16} className="text-primary-400" />
                    <span>Deck Budget: ${customBudget}</span>
                  </label>
                  
                  {/* Budget Slider */}
                  <div className="mb-4">
                    <input
                      type="range"
                      min="25"
                      max="500"
                      step="25"
                      value={customBudget}
                      onChange={handleBudgetChange}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                      disabled={isLoading}
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>$25</span>
                      <span>$500</span>
                    </div>
                  </div>

                  {/* Budget Presets */}
                  <div className="flex flex-wrap gap-2">
                    {budgetPresets.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => handleBudgetPreset(preset.value)}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                          customBudget === preset.value
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Budget Description */}
                  <div className="mt-3 text-xs text-slate-400">
                    <p>
                      {customBudget <= 50 && "Ultra-budget build focusing on commons and uncommons with maximum value."}
                      {customBudget > 50 && customBudget <= 100 && "Budget-friendly deck with some powerful budget staples and efficient cards."}
                      {customBudget > 100 && customBudget <= 200 && "Optimized budget build including mid-range staples and solid manabase."}
                      {customBudget > 200 && "High-budget build with premium cards while maintaining cost consciousness."}
                    </p>
                  </div>
                </div>
              )}
              
              {isLoading && progress > 0 && (
                <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between text-sm text-white mb-2">
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-primary-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{getStageDescription()}</span>
                    </span>
                    <span className="text-primary-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 shadow-inner overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {buildingStage && (
                    <div className="mt-3 text-xs text-slate-300 text-center font-medium">
                      {buildingStage.includes('Generating initial deck structure') && (
                        deckStyle === 'budget' 
                          ? `Advanced AI analyzing your commander and generating budget-conscious deck under $${customBudget}`
                          : 'Advanced AI analyzing your commander and generating synergistic deck structure'
                      )}
                      {buildingStage.includes('Scanning for validation issues') && 'Expert AI validation ensuring format compliance and rule adherence'}
                      {buildingStage.includes('Fixing') && buildingStage.includes('validation issues') && 'Intelligent card replacements that maintain deck synergy and strategy'}
                      {buildingStage.includes('Final validation check') && 'Ensuring all critical violations are resolved'}
                      {buildingStage.includes('Fetching card data') && 'Gathering complete card information and building final deck'}
                      {buildingStage.includes('Deck complete') && 'Three-stage AI pipeline completed successfully!'}
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleBuildDeck}
                disabled={!commander || isLoading}
                className="w-full btn-modern btn-modern-primary btn-modern-xl premium-glow disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-3">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Crafting Your Deck</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-3">
                    <span>
                      {deckStyle === 'budget' ? `Forge My $${customBudget} Deck` : 'Forge My Deck'}
                    </span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
              
              {/* Validation Summary */}
              <ValidationSummary 
                violations={currentViolations}
                appliedFixes={appliedFixes}
                isVisible={!isLoading && (currentViolations.length > 0 || appliedFixes.length > 0)}
              />

              {error && (
                <div className="mt-6 relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-sm"></div>
                  <div className="relative bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-red-300">AI Generation Failed</h4>
                        <p className="text-sm text-red-200 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!commander && !isLoading && (
                <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
                  <div className="flex items-center justify-center space-x-2 text-slate-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="text-sm font-medium">Commander Required</span>
                  </div>
                  <p className="text-xs text-slate-500">Please select your Commander to begin the forging process.</p>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>AI Capabilities</span>
                </h4>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-primary-400">Optimized Deck Size:</span>
                      <span className="ml-1">Crafted for exactly 99 cards, plus your mighty Commander.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-primary-400">Strategic Balance:</span>
                      <span className="ml-1">Ensures a potent mix of lands, ramp, card draw, removal, and core strategy cards.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-primary-400">Format Compliant:</span>
                      <span className="ml-1">All cards adhere to Commander format rules and your leader's color identity.</span>
                    </div>
                  </div>
                  {deckStyle === 'budget' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-primary-400">Budget Conscious:</span>
                        <span className="ml-1">Optimized for maximum value within your ${customBudget} budget constraint.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoDeckBuilder; 