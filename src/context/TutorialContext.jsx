import React, { createContext, useContext, useState, useEffect } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [tutorialState, setTutorialState] = useState({
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    showTutorial: false,
    hasCompletedTutorial: false
  });

  const [featureHighlights, setFeatureHighlights] = useState({
    deckBuilder: false,
    commanderAI: false,
    tutorAI: false,
    cardSearch: false,
    deckAnalytics: false,
    importExport: false,
    blog: false
  });

  // Tutorial steps configuration
  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to AI Deck Tutor!',
      description: 'Let\'s take a quick tour of the main features that will help you build better Commander decks.',
      position: 'center',
      target: null
    },
    {
      id: 'deck-builder',
      title: 'AI Deck Builder',
      description: 'Our AI-powered deck builder helps you create optimized Commander decks. It analyzes your commander, suggests cards, and ensures your deck meets all requirements.',
      position: 'bottom',
      target: '.deck-builder-section',
      benefits: [
        'AI analyzes your commander and suggests synergistic cards',
        'Automatic deck validation and legality checking',
        'Real-time mana curve analysis',
        'Smart card recommendations based on your strategy'
      ]
    },
    {
      id: 'commander-ai',
      title: 'Commander AI Assistant',
      description: 'Get personalized recommendations for your commander choice and understand their strengths and weaknesses.',
      position: 'left',
      target: '.commander-ai-section',
      benefits: [
        'AI-powered commander analysis and recommendations',
        'Strategy insights and playstyle suggestions',
        'Synergy analysis with popular cards',
        'Budget-friendly alternative suggestions'
      ]
    },
    {
      id: 'tutor-ai',
      title: 'AI Gameplay Tutor',
      description: 'Learn advanced strategies and get real-time advice during your games with our AI tutor.',
      position: 'right',
      target: '.tutor-ai-section',
      benefits: [
        'Real-time gameplay advice and strategy tips',
        'Card interaction explanations',
        'Mulligan and opening hand analysis',
        'Advanced combo and synergy insights'
      ]
    },
    {
      id: 'card-search',
      title: 'Advanced Card Search',
      description: 'Find the perfect cards for your deck with our powerful search engine and filtering options.',
      position: 'top',
      target: '.card-search-section',
      benefits: [
        'Advanced filtering by mana cost, type, and abilities',
        'Price tracking and budget considerations',
        'Card legality checking for different formats',
        'Quick add to deck functionality'
      ]
    },
    {
      id: 'deck-analytics',
      title: 'Deck Analytics & Statistics',
      description: 'Analyze your deck\'s performance with detailed statistics, mana curve analysis, and optimization suggestions.',
      position: 'bottom',
      target: '.deck-analytics-section',
      benefits: [
        'Detailed mana curve analysis and visualization',
        'Color distribution and mana source tracking',
        'Deck power level assessment',
        'Optimization recommendations'
      ]
    },
    {
      id: 'import-export',
      title: 'Deck Import & Export',
      description: 'Import your existing decks from popular formats or export your creations to share with others.',
      position: 'left',
      target: '.import-export-section',
      benefits: [
        'Import decks from Arena, MTGO, and other formats',
        'Export to popular deck sharing platforms',
        'Bulk card addition and editing',
        'Deck validation and error checking'
      ]
    },
    {
      id: 'blog-resources',
      title: 'MTG Blog & Resources',
      description: 'Stay updated with the latest Commander strategies, card reviews, and meta analysis from our expert team.',
      position: 'right',
      target: '.blog-section',
      benefits: [
        'Latest Commander meta analysis and trends',
        'Card review and strategy guides',
        'Deck tech and combo explanations',
        'Community insights and discussions'
      ]
    },
    {
      id: 'completion',
      title: 'You\'re All Set!',
      description: 'You\'ve completed the tour! Start building your first deck or explore any of these features in detail.',
      position: 'center',
      target: null
    }
  ];

  // Load tutorial completion status from localStorage
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted) {
      setTutorialState(prev => ({
        ...prev,
        hasCompletedTutorial: true
      }));
    }
  }, []);

  const startTutorial = () => {
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      completedSteps: [],
      showTutorial: true
    }));
  };

  const nextStep = () => {
    setTutorialState(prev => {
      const nextStepIndex = prev.currentStep + 1;
      if (nextStepIndex >= tutorialSteps.length) {
        // Tutorial completed
        return {
          ...prev,
          isActive: false,
          showTutorial: false,
          hasCompletedTutorial: true
        };
      }
      return {
        ...prev,
        currentStep: nextStepIndex,
        completedSteps: [...prev.completedSteps, prev.currentStep]
      };
    });
  };

  const previousStep = () => {
    setTutorialState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  };

  const skipTutorial = () => {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      showTutorial: false
    }));
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const completeTutorial = () => {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      showTutorial: false,
      hasCompletedTutorial: true
    }));
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const resetTutorial = () => {
    localStorage.removeItem('tutorialCompleted');
    setTutorialState({
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      showTutorial: false,
      hasCompletedTutorial: false
    });
  };

  const highlightFeature = (feature) => {
    setFeatureHighlights(prev => ({
      ...prev,
      [feature]: true
    }));
  };

  const clearFeatureHighlight = (feature) => {
    setFeatureHighlights(prev => ({
      ...prev,
      [feature]: false
    }));
  };

  const getCurrentStepData = () => {
    return tutorialSteps[tutorialState.currentStep] || tutorialSteps[0];
  };

  const value = {
    ...tutorialState,
    featureHighlights,
    tutorialSteps,
    getCurrentStepData,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
    highlightFeature,
    clearFeatureHighlight
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}; 