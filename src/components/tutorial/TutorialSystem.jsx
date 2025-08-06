import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTutorial } from '../../context/TutorialContext';
import AIEducation from './AIEducation';
import AIDemo, { PromptGuide } from './AIDemo';
import AITransparency from './AITransparency';

const TutorialSystem = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const tutorialRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  const [currentSearchExample, setCurrentSearchExample] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  // Responsive breakpoints
  const isMobile = viewportSize.width < 768;
  const isTablet = viewportSize.width >= 768 && viewportSize.width < 1024;
  const isDesktop = viewportSize.width >= 1024;
  
  // Use TutorialContext for all state management
  const { 
    isActive, 
    showTutorial, 
    hasCompletedTutorial,
    currentStep,
    tutorialSteps,
    getCurrentStepData,
    startTutorial, 
    nextStep: contextNextStep, 
    previousStep: contextPreviousStep,
    skipTutorial: contextSkipTutorial,
    completeTutorial 
  } = useTutorial();

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!isActive) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        handleSkipTutorial();
        break;
      case 'ArrowRight':
      case 'Enter':
        event.preventDefault();
        handleNextStep();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentStep > 0) {
          handlePreviousStep();
        }
        break;
      case 'Tab':
        // Allow natural tab navigation within tutorial
        break;
      default:
        break;
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus management
      if (tutorialRef.current) {
        tutorialRef.current.focus();
      }
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);

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
    
    // Show celebration for special steps
    if (step.celebration) {
      setCelebrationMessage(step.celebration);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    
    // Handle navigation for specific steps
    if (step.id === 'deck-builder') {
      navigate('/builder');
    } else if (step.id === 'commander-ai') {
      navigate('/commander-ai');
    } else if (step.id === 'tutor-ai') {
      navigate('/tutor-ai');
    } else if (step.id === 'card-search' || step.id === 'search-syntax') {
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

  const cycleSearchExample = () => {
    const step = getCurrentStepData();
    if (step.searchExamples) {
      setCurrentSearchExample((prev) => (prev + 1) % step.searchExamples.length);
    }
  };

  const getTutorialLayout = () => {
    if (isMobile) return 'bottom-sheet';
    if (isTablet) return 'modal';
    return 'side-panel';
  };

  // Don't show the tutorial if not active
  if (!isActive) return null;

  const layout = getTutorialLayout();
  const currentStepData = getCurrentStepData();

  // Render celebration overlay
  const CelebrationOverlay = () => showCelebration && (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-2xl animate-pulse">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{celebrationMessage}</span>
        </div>
      </div>
    </div>
  );

  // Interactive Search Tutorial Component
  const InteractiveSearchTutorial = () => {
    if (currentStepData.id !== 'card-search' || !currentStepData.searchExamples) return null;
    
    const currentExample = currentStepData.searchExamples[currentSearchExample];
    
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600">
        <h4 className="text-primary-400 font-semibold mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Try This Search:
        </h4>
        
        <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm mb-3">
          <div className="text-green-400">{currentExample.query}</div>
        </div>
        
        <p className="text-slate-300 text-sm mb-3">{currentExample.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Example {currentSearchExample + 1} of {currentStepData.searchExamples.length}
          </span>
          <button
            onClick={cycleSearchExample}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            Next Example →
          </button>
        </div>
      </div>
    );
  };

  // MTG Example Component
  const MTGExample = () => {
    if (!currentStepData.mtgExample) return null;
    
    return (
      <div className="bg-gradient-to-r from-mtg-gold/20 to-yellow-600/20 rounded-lg p-4 border border-yellow-600/30">
        <h4 className="text-yellow-400 font-semibold mb-2">
          Strategy Tip
        </h4>
        <p className="text-slate-200 text-sm">{currentStepData.mtgExample}</p>
      </div>
    );
  };

  // Get AI demo type for current step
  const getAIDemoType = () => {
    if (currentStepData.id === 'deck-builder') return 'deckBuilder';
    if (currentStepData.id === 'commander-ai') return 'commanderAI';
    if (currentStepData.id === 'tutor-ai') return 'tutorAI';
    if (currentStepData.id === 'ai-optimization') return 'aiOptimization';
    return null;
  };

  // Check if current step is AI-related
  const isAIStep = () => {
    return ['deck-builder', 'commander-ai', 'tutor-ai', 'ai-optimization'].includes(currentStepData.id);
  };

  return (
    <>
      <CelebrationOverlay />
      
      {/* Responsive overlay */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 z-[9999] transition-all duration-300 ${
          layout === 'bottom-sheet' 
            ? 'bg-black/40 backdrop-blur-sm' 
            : 'bg-black/20 backdrop-blur-[1px] pointer-events-none'
        }`}
        onClick={layout === 'modal' ? handleSkipTutorial : undefined}
      />

      {/* Tutorial Container - Enhanced Mobile Responsive Layout */}
      <div 
        ref={tutorialRef}
        className={`fixed z-[10000] transition-all duration-300 focus:outline-none ${
          layout === 'bottom-sheet' 
            ? 'bottom-0 left-0 right-0 max-h-[80vh] min-h-[50vh]' 
            : layout === 'modal'
            ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg max-h-[85vh]'
            : 'top-0 right-0 h-full w-96 max-w-[90vw]'
        }`}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-description"
        aria-modal="true"
      >
        <div className={`bg-slate-800/96 backdrop-blur-xl shadow-2xl flex flex-col ${
          layout === 'bottom-sheet' 
            ? 'rounded-t-3xl border-t-2 border-slate-600/60 h-full' 
            : layout === 'modal'
            ? 'rounded-2xl border-2 border-slate-600/60 h-full'
            : 'h-full border-l border-slate-600/50'
        }`}>
          
          {/* Enhanced Mobile Header */}
          <div className={`flex justify-between items-center border-b border-slate-700/50 ${
            layout === 'bottom-sheet' ? 'p-4 pb-3' : layout === 'modal' ? 'p-4' : 'p-4'
          }`}>
            {/* Mobile drag handle for bottom sheet */}
            {layout === 'bottom-sheet' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-1.5 bg-slate-600 rounded-full"></div>
            )}
            <div className="flex items-center space-x-3">
              
              {/* Keyboard hint */}
              <div className="hidden sm:flex items-center text-xs text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Esc</kbd>
                <span className="mx-1">to close</span>
              </div>
            </div>
            
            <button
              onClick={handleSkipTutorial}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              aria-label="Close tutorial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Enhanced Mobile Content */}
          <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 ${
            layout === 'bottom-sheet' ? 'p-4 pt-3' : layout === 'modal' ? 'p-4' : 'p-6'
          }`}>
            <div className="space-y-4">

              
              <h3 id="tutorial-title" className={`font-bold text-white leading-tight ${
                layout === 'bottom-sheet' ? 'text-lg' : layout === 'modal' ? 'text-lg' : 'text-xl'
              }`}>
                {currentStepData.title}
              </h3>
              
              <p id="tutorial-description" className="text-slate-300 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* MTG Example */}
              <MTGExample />
              
              {/* AI Demo - for AI-related steps */}
              {isAIStep() && (
                <AIDemo demoType={getAIDemoType()} isVisible={true} />
              )}
              
              {/* AI Education Details */}
              {isAIStep() && currentStepData.aiDetails && (
                <AIEducation aiDetails={currentStepData.aiDetails} isVisible={true} />
              )}
              
              {/* Prompt Engineering Guide - show on tutor-ai step */}
              {currentStepData.id === 'tutor-ai' && (
                <PromptGuide isVisible={true} />
              )}
              
              {/* AI Transparency - show on completion step */}
              {currentStepData.id === 'completion' && (
                <AITransparency isVisible={true} />
              )}
              
              {/* Interactive Search Tutorial */}
              <InteractiveSearchTutorial />

              {/* Benefits list */}
              {currentStepData.benefits && (
                <div className="bg-slate-700/50 rounded-lg p-4" role="region" aria-label="Key benefits">
                  <h4 className="text-sm font-semibold text-primary-400 mb-2">
                    Key Benefits:
                  </h4>
                  <ul className="space-y-1" role="list">
                    {currentStepData.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start space-x-2" role="listitem">
                        <span className="text-primary-400 mt-1" aria-hidden="true">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}


            </div>
          </div>

          {/* Enhanced Mobile Actions */}
          <div className={`border-t border-slate-700/50 ${
            layout === 'bottom-sheet' ? 'p-4 pb-5' : layout === 'modal' ? 'p-4' : 'p-4'
          }`}>
            {/* Mobile-first layout */}
            {layout === 'bottom-sheet' ? (
              <div className="space-y-3">
                {/* Primary action button - full width on mobile */}
                <button
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-primary-500 to-blue-500 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-3 focus:ring-primary-300 shadow-lg hover:shadow-xl tutorial-touch-feedback"
                  aria-label={currentStep === tutorialSteps.length - 1 ? 'Finish tutorial' : 'Go to next step'}
                >
                  <span className="flex items-center justify-center space-x-3">
                    <span>{currentStep === tutorialSteps.length - 1 ? 'Complete Tutorial' : 'Continue'}</span>
                    <span className="text-xl" aria-hidden="true">→</span>
                  </span>
                </button>
                
                {/* Secondary actions row */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleSkipTutorial}
                    className="text-slate-400 hover:text-white transition-colors text-base py-2 px-4 rounded-lg hover:bg-slate-700/50 tutorial-touch-feedback"
                    aria-label="Skip tutorial"
                  >
                    Skip
                  </button>
                  
                  {currentStep > 0 && (
                    <button
                      onClick={handlePreviousStep}
                      className="text-slate-300 hover:text-white transition-colors text-base py-2 px-4 rounded-lg hover:bg-slate-700/50 flex items-center space-x-2 tutorial-touch-feedback"
                      aria-label="Go to previous step"
                    >
                      <span aria-hidden="true">←</span>
                      <span>Back</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Desktop/tablet layout */
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSkipTutorial}
                  className="text-slate-400 hover:text-white transition-colors text-sm hover:bg-slate-700/50 py-2 px-3 rounded-lg"
                  aria-label="Skip tutorial"
                >
                  Skip Tour
                </button>
                
                <div className="flex space-x-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePreviousStep}
                      className={`text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg hover:bg-slate-700/50 ${
                        layout === 'modal' ? 'px-4 py-2.5' : 'px-4 py-2'
                      }`}
                      aria-label="Go to previous step"
                    >
                      Previous
                    </button>
                  )}
                  
                  <button
                    onClick={handleNextStep}
                    className={`text-white rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-gradient-to-r from-primary-500 to-blue-500 hover:shadow-lg ${
                      layout === 'modal' ? 'px-6 py-2.5 text-base' : 'px-6 py-2'
                    }`}
                    aria-label={currentStep === tutorialSteps.length - 1 ? 'Finish tutorial' : 'Go to next step'}
                  >
                    {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                    <span className="ml-2" aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            )}
            
            
            {/* Touch hints for mobile */}
            {layout === 'bottom-sheet' && (
              <div className="flex justify-center mt-2 pt-2 border-t border-slate-700/30">
                <div className="flex items-center text-xs text-slate-500 space-x-6">
                  <span className="flex items-center">
                    <span className="text-slate-600 mr-1">💬</span>
                    <span>Swipe or tap to navigate</span>
                  </span>
                </div>
              </div>
            )}
            
            {/* Desktop keyboard hints */}
            {layout !== 'bottom-sheet' && (
              <div className="hidden sm:flex justify-center mt-2 pt-2 border-t border-slate-700/30">
                <div className="flex items-center text-xs text-slate-500 space-x-4">
                  <span className="flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 mr-1">←→</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 mr-1">Enter</kbd>
                    Next
                  </span>
                  <span className="flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 mr-1">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorialSystem;