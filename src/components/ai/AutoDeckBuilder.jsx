import React, { useState, useEffect } from 'react';
import { useAutoDeckBuilder } from '../../hooks/useAutoDeckBuilder';
import { useDeck } from '../../context/DeckContext';
import { IconCrown, IconRobot } from '@tabler/icons-react';

/**
 * Component for automatically building complete decks with AI
 */
const AutoDeckBuilder = () => {
  const { commander, totalCardCount } = useDeck();
  const [deckStyle, setDeckStyle] = useState('competitive');
  const { buildCompleteDeck, isLoading, error, progress } = useAutoDeckBuilder();
  
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const styleOptions = [
    { id: 'competitive', label: 'Competitive' },
    { id: 'casual', label: 'Casual' },
    { id: 'budget', label: 'Budget Friendly' },
    { id: 'combo', label: 'Combo Focused' },
    { id: 'aggro', label: 'Aggressive' },
    { id: 'control', label: 'Control' },
    { id: 'tribal', label: 'Tribal' }
  ];

  const handleStyleChange = (e) => {
    setDeckStyle(e.target.value);
  };

  const handleBuildDeck = () => {
    buildCompleteDeck(deckStyle);
  };

  const nonCommanderCardCount = commander ? totalCardCount - 1 : 0;

  return (
    <div className="glassmorphism-card overflow-hidden border-primary-500/20 shadow-modern-primary">
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
          <div className="px-3 py-1 bg-primary-500/20 rounded-full border border-primary-500/30">
            <span className="text-primary-300 text-sm font-semibold">✨ AI Powered</span>
          </div>
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
          
          {isLoading && progress > 0 && (
            <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <div className="flex justify-between text-sm text-white mb-2">
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>AI Weaving Your Legend...</span>
                </span>
                <span className="text-primary-400 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 shadow-inner overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-3 text-xs text-slate-300 text-center font-medium">
                {progress < 20 && "🔮 Consulting the Rifts..."}
                {progress >= 20 && progress < 40 && "✨ Gathering Mana Signatures..."}
                {progress >= 40 && progress < 60 && "⚔️ Summoning Strategic Allies..."}
                {progress >= 60 && progress < 80 && "🛡️ Forging Artifacts & Spells..."}
                {progress >= 80 && "🌟 Binding the Deck's Essence..."}
              </div>
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
                <span>AI Weaving Your Legend...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Forge My Deck</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
          
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
              <span>✨ AI Capabilities</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDeckBuilder; 