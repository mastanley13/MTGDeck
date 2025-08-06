import React, { useState } from 'react';

/**
 * Component for educating users about AI capabilities, limitations, and best practices
 */
const AIEducation = ({ aiDetails, isVisible = true }) => {
  const [activeTab, setActiveTab] = useState('capabilities');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !aiDetails) return null;

  const tabs = [
    { id: 'capabilities', label: 'How It Works', icon: '🤖' },
    { id: 'limitations', label: 'Limitations', icon: '⚠️' },
    { id: 'tips', label: 'Best Practices', icon: '💡' }
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'capabilities':
        return (
          <div className="space-y-3">
            <div className="mb-3">
              <h5 className="text-sm font-semibold text-primary-300 mb-2">AI Technology:</h5>
              <p className="text-xs text-slate-300 leading-relaxed">{aiDetails.algorithms}</p>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-primary-300 mb-2">Capabilities:</h5>
              <ul className="space-y-1">
                {aiDetails.capabilities.map((capability, index) => (
                  <li key={index} className="text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'limitations':
        return (
          <div className="space-y-3">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-yellow-300 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                Important Limitations:
              </h5>
              <ul className="space-y-1">
                {aiDetails.limitations.map((limitation, index) => (
                  <li key={index} className="text-xs text-yellow-100 flex items-start space-x-2">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-xs text-slate-400 italic">
              Understanding these limitations helps you use AI more effectively and make better decisions.
            </div>
          </div>
        );
      case 'tips':
        return (
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Pro Tips for Better Results:
              </h5>
              <ul className="space-y-2">
                {aiDetails.userTips.map((tip, index) => (
                  <li key={index} className="text-xs text-blue-100 flex items-start space-x-2">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">{index + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4">
      {/* Expandable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-200">Understanding This AI Tool</span>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-3 bg-slate-800/50 border border-slate-600/30 rounded-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-600/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-primary-300 border-b-2 border-primary-400 bg-slate-700/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/20'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {getTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

// Progressive AI Learning Component
export const AILearningPath = ({ currentStep, totalSteps }) => {
  const learningStages = [
    { stage: 'Basic', range: [0, 2], description: 'Introduction to AI-assisted deck building' },
    { stage: 'Intermediate', range: [3, 5], description: 'Understanding AI recommendations and limitations' },
    { stage: 'Advanced', range: [6, totalSteps], description: 'Mastering AI tools for competitive play' }
  ];

  const getCurrentStage = () => {
    return learningStages.find(stage => 
      currentStep >= stage.range[0] && currentStep <= stage.range[1]
    ) || learningStages[0];
  };

  const currentStage = getCurrentStage();

  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-purple-300">AI Learning Progress</h4>
        <span className="text-xs text-purple-400">{currentStage.stage} Level</span>
      </div>
      <p className="text-xs text-slate-300 mb-2">{currentStage.description}</p>
      <div className="flex space-x-1">
        {learningStages.map((stage, index) => (
          <div
            key={stage.stage}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              stage.stage === currentStage.stage 
                ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                : index < learningStages.indexOf(currentStage)
                  ? 'bg-green-500'
                  : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AIEducation;