import React from 'react';
import { useTutorial } from '../../context/TutorialContext';

const TutorialProgress = ({ 
  variant = 'compact', 
  showLabels = false,
  className = ''
}) => {
  const { 
    tutorialSteps, 
    currentStep, 
    completedSteps, 
    isActive, 
    hasCompletedTutorial 
  } = useTutorial();

  if (!isActive && !hasCompletedTutorial) return null;

  const totalSteps = tutorialSteps.length;
  const completedCount = completedSteps.length;
  const progressPercentage = hasCompletedTutorial ? 100 : (completedCount / totalSteps) * 100;

  const getStepStatus = (index) => {
    if (hasCompletedTutorial) return 'completed';
    if (index === currentStep && isActive) return 'current';
    if (completedSteps.includes(index)) return 'completed';
    return 'pending';
  };

  const getStepIcon = (step, status) => {
    if (status === 'completed') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === 'current') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    return (
      <div className="w-2 h-2 rounded-full bg-current" />
    );
  };

  if (variant === 'detailed') {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-600/50 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Tutorial Progress</h3>
          <span className="text-sm text-slate-400">
            {hasCompletedTutorial ? 'Completed!' : `${completedCount}/${totalSteps}`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-600 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tutorialSteps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                  status === 'current' 
                    ? 'bg-primary-500/20 border border-primary-500/30' 
                    : status === 'completed'
                    ? 'bg-green-500/10'
                    : 'bg-slate-700/30'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  status === 'current' 
                    ? 'bg-primary-500 text-white' 
                    : status === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-600 text-slate-400'
                }`}>
                  {getStepIcon(step, status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    status === 'current' ? 'text-white' : 'text-slate-300'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {status === 'current' && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasCompletedTutorial && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 font-medium">Tutorial Completed!</span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              You've mastered AI Deck Tutor. Ready to build amazing decks!
            </p>
          </div>
        )}
      </div>
    );
  }

  // Compact variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex space-x-1">
        {tutorialSteps.map((_, index) => {
          const status = getStepStatus(index);
          return (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                status === 'current' 
                  ? 'bg-primary-500 scale-125' 
                  : status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-slate-600'
              }`}
              role="progressbar"
              aria-valuenow={status === 'completed' ? 100 : status === 'current' ? 50 : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Step ${index + 1}: ${tutorialSteps[index]?.title || 'Unknown'} - ${status}`}
            />
          );
        })}
      </div>
      
      {showLabels && (
        <span className="text-xs text-slate-400">
          {hasCompletedTutorial 
            ? 'Tutorial Complete' 
            : `${completedCount}/${totalSteps} steps`
          }
        </span>
      )}
    </div>
  );
};

export default TutorialProgress;