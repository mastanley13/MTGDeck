// Tutorial System Components
export { default as TutorialSystem } from './TutorialSystem.jsx';
export { default as TutorialTrigger } from './TutorialTrigger.jsx';
export { default as TutorialProgress } from './TutorialProgress.jsx';
export { default as CardSearchTutorial } from './CardSearchTutorial.jsx';

// AI Education Components
export { default as AIEducation, AILearningPath } from './AIEducation.jsx';
export { default as AIDemo, PromptGuide } from './AIDemo.jsx';
export { default as AITransparency } from './AITransparency.jsx';
export { default as AIQuickReference } from './AIQuickReference.jsx';

// Tutorial Context
export { useTutorial, TutorialProvider } from '../../context/TutorialContext.jsx';

// Tutorial utilities and hooks
export const tutorialBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1024
};

export const getTutorialLayout = (width) => {
  if (width < tutorialBreakpoints.mobile) return 'bottom-sheet';
  if (width < tutorialBreakpoints.desktop) return 'modal';
  return 'side-panel';
};

// Common tutorial step templates for reuse
export const tutorialStepTemplates = {
  welcome: (title, description) => ({
    id: 'welcome',
    title,
    description,
    position: 'center',
    target: null,
    celebration: `Welcome to ${title}!`
  }),
  
  feature: (id, title, description, target, benefits, mtgExample) => ({
    id,
    title,
    description,
    position: 'right',
    target,
    benefits,
    mtgExample,
    celebration: `${title} mastered!`
  }),
  
  completion: (title, message) => ({
    id: 'completion',
    title,
    description: message,
    position: 'center',
    target: null,
    celebration: 'Tutorial completed!',
    finalMessage: 'You\\'re ready to dominate!'
  })
};

// Accessibility helpers
export const tutorialA11yProps = {
  dialog: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'tutorial-title',
    'aria-describedby': 'tutorial-description'
  },
  
  progress: (current, total, stepName) => ({
    role: 'progressbar',
    'aria-valuenow': current,
    'aria-valuemin': 0,
    'aria-valuemax': total,
    'aria-label': `Tutorial step ${current} of ${total}: ${stepName}`
  }),
  
  button: (action) => ({
    'aria-label': action,
    role: 'button'
  })
};

// Tutorial event constants
export const TUTORIAL_EVENTS = {
  START: 'tutorial:start',
  COMPLETE: 'tutorial:complete',
  SKIP: 'tutorial:skip',
  STEP_CHANGE: 'tutorial:step_change',
  CELEBRATION: 'tutorial:celebration'
};

// Tutorial storage keys
export const TUTORIAL_STORAGE_KEYS = {
  COMPLETED: 'tutorialCompleted',
  PROGRESS: 'tutorialProgress',
  LAST_STEP: 'tutorialLastStep',
  PREFERENCES: 'tutorialPreferences'
};