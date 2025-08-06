import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTutorial } from '../../context/TutorialContext';

const TutorialSystem = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const [isSidePanel, setIsSidePanel] = useState(true);
  
  // Use TutorialContext for all state management
  const { 
    isActive, 
    showTutorial, 
    hasCompletedTutorial,
    currentStep,
    completedSteps,
    tutorialSteps,
    getCurrentStepData,
    startTutorial, 
    nextStep: contextNextStep, 
    previousStep: contextPreviousStep,
    skipTutorial: contextSkipTutorial,
    completeTutorial 
  } = useTutorial();

  useEffect(() => {
    // Check if tutorial has been completed before
    if (!hasCompletedTutorial && location.pathname === '/') {
      // Don't auto-start tutorial, let user click the question mark
    }
  }, [location, hasCompletedTutorial]);

  useEffect(() => {
    if (isActive && tutorialSteps.length > 0) {
      const step = getCurrentStepData();
      if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect to target element
          targetElement.classList.add('tutorial-highlight');
          return () => {
            targetElement.classList.remove('tutorial-highlight');
          };
        }
      }
    }
  }, [isActive, currentStep, tutorialSteps, getCurrentStepData]);

  const handleNextStep = () => {
    const step = getCurrentStepData();
    
    // Handle navigation for specific steps
    if (step.id === 'deck-builder') {
      navigate('/builder');
    } else if (step.id === 'commander-ai') {
      navigate('/commander-ai');
    } else if (step.id === 'tutor-ai') {
      navigate('/tutor-ai');
    } else if (step.id === 'card-search') {
      navigate('/card-search');
    } else if (step.id === 'blog-resources') {
      navigate('/blog');
    }
    
    contextNextStep();
  };

  const handlePreviousStep = () => {
    contextPreviousStep();
  };

  const handleSkipTutorial = () => {
    contextSkipTutorial();
  };

  const togglePanelMode = () => {
    setIsSidePanel(!isSidePanel);
  };

  // Don't show the tutorial if not active
  if (!isActive) return null;

  const currentStepData = getCurrentStepData();

  return (
    <>
      {/* Subtle overlay that doesn't completely hide content */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9999] pointer-events-none"
      />

      {/* Tutorial Panel - positioned as a side panel */}
      <div className={`fixed top-0 right-0 h-full z-[10000] pointer-events-auto transition-all duration-300 ${
        isSidePanel ? 'w-96 max-w-[90vw]' : 'w-80 max-w-[80vw]'
      }`}>
        <div className="h-full bg-slate-800/95 backdrop-blur-xl border-l border-slate-600/50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'bg-primary-500' 
                        : completedSteps.includes(index) 
                          ? 'bg-green-500' 
                          : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={togglePanelMode}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
                title={isSidePanel ? "Compact Mode" : "Full Panel"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleSkipTutorial}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                {currentStepData.title}
              </h3>
              
              <p className="text-slate-300 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Benefits list */}
              {currentStepData.benefits && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-primary-400 mb-2">
                    Key Benefits:
                  </h4>
                  <ul className="space-y-1">
                    {currentStepData.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start space-x-2">
                        <span className="text-primary-400 mt-1">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Current step indicator */}
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center">
              <button
                onClick={handleSkipTutorial}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Skip Tour
              </button>
              
              <div className="flex space-x-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePreviousStep}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Previous
                  </button>
                )}
                
                <button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-primary-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay for small screens */}
      <div className="fixed inset-0 z-[9998] pointer-events-none md:hidden">
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
    </>
  );
};

export default TutorialSystem; 