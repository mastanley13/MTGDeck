import React, { useState } from 'react';

/**
 * Component for explaining AI transparency, data sources, and decision-making process
 */
const AITransparency = ({ isVisible = true, hideSections = [] }) => {
  const [activeSection, setActiveSection] = useState('data');

  if (!isVisible) return null;

  const sections = {
    data: {
      title: 'Data Sources',
      icon: '📊',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h5 className="text-blue-300 font-semibold mb-2">What Data We Use:</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span><strong>EDHREC Database:</strong> Millions of Commander decks and card statistics</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span><strong>Tournament Results:</strong> Competitive Commander and cEDH match data</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span><strong>Card Interactions:</strong> Rules engine and combo databases</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span><strong>Meta Analysis:</strong> Current format trends and popular strategies</span>
              </li>
            </ul>
          </div>
          <div className="text-xs text-slate-400 italic">
            All data is publicly available and no personal information is stored or used.
          </div>
        </div>
      )
    },
    process: {
      title: 'Decision Making',
      icon: '🧠',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <h5 className="text-purple-300 font-semibold mb-2">How AI Makes Recommendations:</h5>
            <div className="space-y-3">
              <div className="border-l-2 border-purple-400 pl-3">
                <div className="text-sm font-medium text-purple-200">Step 1: Context Analysis</div>
                <div className="text-xs text-slate-300">Analyzes your commander, existing cards, and stated preferences</div>
              </div>
              <div className="border-l-2 border-purple-400 pl-3">
                <div className="text-sm font-medium text-purple-200">Step 2: Synergy Scoring</div>
                <div className="text-xs text-slate-300">Calculates compatibility scores based on card interactions</div>
              </div>
              <div className="border-l-2 border-purple-400 pl-3">
                <div className="text-sm font-medium text-purple-200">Step 3: Meta Weighting</div>
                <div className="text-xs text-slate-300">Adjusts suggestions based on current format meta-game</div>
              </div>
              <div className="border-l-2 border-purple-400 pl-3">
                <div className="text-sm font-medium text-purple-200">Step 4: Constraint Filtering</div>
                <div className="text-xs text-slate-300">Applies budget, power level, and format restrictions</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    accuracy: {
      title: 'AI Performance',
      icon: '📈',
      content: (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h5 className="text-green-300 font-semibold mb-2">Accuracy Metrics:</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">87%</div>
                <div className="text-xs text-slate-300">Card Synergy Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">92%</div>
                <div className="text-xs text-slate-300">Format Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">78%</div>
                <div className="text-xs text-slate-300">Meta Prediction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">83%</div>
                <div className="text-xs text-slate-300">User Satisfaction</div>
              </div>
            </div>
          </div>
          {/* Metrics explanatory text removed per requirements */}
        </div>
      )
    },
    improvement: {
      title: 'Continuous Learning',
      icon: '🔄',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <h5 className="text-orange-300 font-semibold mb-2">How AI Improves Over Time:</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span><strong>Feedback Integration:</strong> User ratings improve future recommendations</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span><strong>Meta Updates:</strong> Regular updates to reflect format changes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span><strong>Performance Tracking:</strong> Deck success rates refine algorithms</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span><strong>New Card Integration:</strong> Automatic analysis of new MTG releases</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-800/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Your Role in AI Improvement:</div>
            <div className="text-sm text-slate-300">
              Rate suggestions, report issues, and share deck performance to help train better models.
            </div>
          </div>
        </div>
      )
    }
  };

  // Filter out hidden sections
  const visibleEntries = Object.entries(sections).filter(([key]) => !hideSections.includes(key));

  return (
    <div className="mt-4 bg-gradient-to-br from-slate-800/80 to-slate-700/80 rounded-lg border border-slate-600/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-3 border-b border-slate-600/50">
        <h4 className="text-sm font-semibold text-indigo-300 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.586-3.414A2 2 0 0019 8.172V6.828a2 2 0 00-.586-1.414l-2.828-2.828A2 2 0 0014.172 2H6.828a2 2 0 00-1.414.586L2.586 5.414A2 2 0 002 6.828v7.344a2 2 0 00.586 1.414l2.828 2.828A2 2 0 006.828 19h7.344a2 2 0 001.414-.586l2.828-2.828A2 2 0 0019 14.172V6.828z" />
          </svg>
          AI Transparency & Trust
        </h4>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-600/30 bg-slate-800/30">
        {visibleEntries.map(([key, section]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-all duration-200 ${
              activeSection === key
                ? 'text-primary-300 border-b-2 border-primary-400 bg-slate-700/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'
            }`}
          >
            <span className="mr-1">{section.icon}</span>
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto md:max-h-none">
        {sections[activeSection]?.content}
      </div>

      {/* Footer */}
      {/* Footer CTA removed per requirements */}
    </div>
  );
};

export default AITransparency;