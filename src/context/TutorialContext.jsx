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
    showTutorial: false,
    hasCompletedTutorial: false,
    startPath: '/'
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

  // Tutorial steps configuration - Accurate to actual website features
  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to AI Deck Tutor!',
      description: 'Ready to build better Commander decks? Let\'s explore the AI-powered tools that will help you create optimized 100-card decks.',
      position: 'center',
      target: null,
      celebration: 'Welcome to smarter deck building!',
      mtgExample: 'From mana curve optimization to synergy analysis, our AI tools ensure your deck performs at its best in any playgroup.'
    },
    {
      id: 'deck-builder',
      title: 'AI Deck Builder',
      description: 'Build Commander decks with AI assistance using our comprehensive Scryfall database integration and intelligent recommendations.',
      position: 'bottom',
      target: '.deck-builder-section',
      benefits: [
        'Access the complete Magic card database through Scryfall integration',
        'AI-powered card suggestions based on your commander',
        'Real-time deck validation and format legality checking',
        'Smart mana curve analysis and optimization'
      ],
      mtgExample: 'Looking to maximize your commander\'s potential? Our AI analyzes thousands of successful decks to find hidden synergies and powerful combinations you might have missed.',
      celebration: 'Your deck building toolkit is ready!'
    },
    {
      id: 'commander-ai',
      title: 'Commander AI Assistant',
      description: 'Get personalized commander suggestions and deck recommendations based on your playstyle preferences.',
      position: 'left',
      target: '.commander-ai-section',
      benefits: [
        'AI-powered commander recommendations based on your preferences',
        'Detailed analysis of commander abilities and strategies',
        'Suggestions for deck archetypes and play styles',
        'Strategic insights for different commanders'
      ],
      mtgExample: 'Want to build around lifegain but not sure which commander to choose? Our AI can suggest perfect commanders like Karlov or Oloro, along with proven strategies for each.',
      celebration: 'Find your perfect commander!'
    },
    {
      id: 'card-search',
      title: 'Advanced Card Search',
      description: 'Master powerful search techniques to find exactly the cards you need using Scryfall\'s comprehensive database.',
      position: 'right',
      target: '.card-search-section',
      benefits: [
        'Search thousands of cards with advanced filters',
        'Use powerful search syntax for precise results',
        'Filter by mana cost, card type, abilities, and more',
        'Access detailed card information and pricing'
      ],
      searchExamples: [
        { query: 'type:creature color:red cmc<=3', description: 'Low-cost red creatures' },
        { query: 'type:instant o:"destroy target"', description: 'Instant-speed removal spells' },
        { query: 'type:artifact o:"add mana"', description: 'Mana-producing artifacts' },
        { query: 'is:commander color:green', description: 'Green commanders' }
      ],
      interactive: true,
      celebration: 'Master the art of card search!'
    },
    {
      id: 'tutor-ai',
      title: 'AI Gameplay Tutor',
      description: 'Improve your gameplay with AI-powered strategic advice and gameplay tips for Commander format.',
      position: 'right',
      target: '.tutor-ai-section',
      benefits: [
        'Get AI-powered gameplay advice and strategy tips',
        'Learn optimal play sequences and timing',
        'Understand card interactions and synergies',
        'Improve your multiplayer Commander politics'
      ],
      mtgExample: 'Should you cast your board wipe now or wait? Our AI considers factors like opponent\'s open mana, known cards in hand, and likely responses to help you make the optimal play.',
      celebration: 'Level up your gameplay skills!'
    },
    {
      id: 'deck-analytics',
      title: 'Deck Analytics & Statistics',
      description: 'Analyze your deck performance with detailed statistics, mana curve analysis, and card type distribution.',
      position: 'bottom',
      target: '.deck-analytics-section',
      benefits: [
        'Detailed mana curve visualization and analysis',
        'Card type distribution breakdown',
        'Color identity and mana base analysis', 
        'Deck composition statistics and insights'
      ],
      mtgExample: 'Is your deck running enough ramp? Our analytics can show if your 3-color deck needs more mana rocks or land-based ramp to consistently cast your commander by turn 4.',
      celebration: 'Master deck analysis like a pro!'
    },
    {
      id: 'deck-management',
      title: 'Deck Management & Sharing',
      description: 'Save, organize, import, and export your decks with easy-to-use management tools.',
      position: 'left',
      target: '.import-export-section',
      benefits: [
        'Save and organize your deck collections',
        'Import decks from text lists and other formats',
        'Export your decks to share with others',
        'Easy deck editing and modification tools'
      ],
      mtgExample: 'Found an interesting decklist on MTGGoldfish? Import it directly, customize it with our AI suggestions, then export it to your favorite deck building site.',
      celebration: 'Your deck collection is organized!'
    },
    {
      id: 'blog-resources',
      title: 'Strategy Blog & Resources',
      description: 'Learn and improve your game with expert Magic: The Gathering content, strategy guides, and Commander insights.',
      position: 'right',
      target: '.blog-section',
      benefits: [
        'Expert strategy articles and deck building tips',
        'Commander format guides and insights',
        'Card reviews and meta analysis',
        'Community content and discussions'
      ],
      mtgExample: 'Discover in-depth articles on topics like "Politics in Commander: When to Make Deals" or "Building a Budget Mana Base for 3-Color Decks" written by experienced players.',
      celebration: 'Expand your Magic knowledge!'
    },
    {
      id: 'completion',
      title: 'You\'re Ready to Build Amazing Decks!',
      description: 'Congratulations! You now know how to use all of AI Deck Tutor\'s features to build, optimize, and manage your Commander decks.',
      position: 'center',
      target: null,
      benefits: [
        'Learned to use the AI-powered deck builder effectively',
        'Mastered advanced card search techniques',
        'Understand deck analytics and optimization',
        'Ready to build and share amazing Commander decks'
      ],
      celebration: 'Welcome to smarter deck building!',
      finalMessage: 'You\'re now equipped with powerful tools to build better Commander decks. Start creating!',
      mtgExample: 'Time to put it all together! Use AI suggestions to find the perfect commander, optimize your mana base with analytics, and share your masterpiece with detailed strategy guides.'
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
    const currentPath = window.location.pathname;
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      showTutorial: true,
      startPath: currentPath
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
        currentStep: nextStepIndex
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