import React, { useState, useEffect } from 'react';
import { useTutorial } from '../../context/TutorialContext';

const TutorialTrigger = ({ 
  variant = 'floating', 
  className = '',
  showIcon = true,
  showText = true,
  text = 'Take Tour',
  size = 'default',
  autoShow = false,
  pulseOnFirst = true
}) => {
  const { startTutorial, hasCompletedTutorial } = useTutorial();
  const [showPulse, setShowPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pulse animation for first-time users
  useEffect(() => {
    if (!hasCompletedTutorial && pulseOnFirst) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTutorial, pulseOnFirst]);

  const handleClick = () => {
    startTutorial();
  };

  const getSizeClasses = () => {
    const mobileAdjustment = isMobile ? 'touch-manipulation' : '';
    switch (size) {
      case 'small':
        return `px-3 py-2 text-sm ${mobileAdjustment}`;
      case 'large':
        return `px-8 py-4 text-lg ${mobileAdjustment}`;
      default:
        return `px-6 py-3 text-base ${mobileAdjustment}`;
    }
  };

  const getVariantClasses = () => {
    const pulseClass = showPulse ? 'animate-pulse-slow ring-4 ring-primary-400/50' : '';
    const baseTransition = 'transition-all duration-300';
    const focusRing = 'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-slate-800';
    
    switch (variant) {
      case 'navbar':
        return `text-slate-300 hover:text-white ${baseTransition} p-2 rounded-lg hover:bg-slate-700/50 ${focusRing} ${pulseClass}`;
      case 'button':
        return `bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-lg hover:shadow-lg ${baseTransition} transform hover:scale-105 ${focusRing} ${pulseClass}`;
      case 'outline':
        return `border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-lg ${baseTransition} ${focusRing} ${pulseClass}`;
      case 'hero':
        return `bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500 text-white rounded-xl shadow-xl hover:shadow-2xl ${baseTransition} transform hover:scale-105 ${focusRing} ${pulseClass}`;
      case 'floating':
      default:
        return `bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl ${baseTransition} transform hover:scale-105 ${focusRing} ${pulseClass}`;
    }
  };

  const getPositionClasses = () => {
    switch (variant) {
      case 'floating':
        return isMobile 
          ? 'fixed bottom-4 right-4 z-50' 
          : 'fixed bottom-6 right-6 z-50';
      case 'navbar':
        return '';
      default:
        return '';
    }
  };

  const getIconSize = () => {
    if (variant === 'hero') return 'w-6 h-6';
    if (isMobile && variant === 'floating') return 'w-6 h-6';
    return 'w-5 h-5';
  };

  const getTutorialIcon = () => {
    if (hasCompletedTutorial) {
      return (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    return (
      <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getDisplayText = () => {
    if (hasCompletedTutorial) {
      return isMobile ? 'Retake' : 'Retake Tour';
    }
    if (variant === 'hero') {
      return 'Start Your MTG Journey';
    }
    return text;
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setShowPulse(false)}
      className={`${getPositionClasses()} ${getVariantClasses()} ${getSizeClasses()} ${className} flex items-center justify-center group relative overflow-hidden`}
      title={hasCompletedTutorial ? 'Restart Tutorial - Learn the platform again' : 'Start Tutorial - Get familiar with AI Deck Tutor'}
      aria-label={hasCompletedTutorial ? 'Restart tutorial walkthrough' : 'Start tutorial walkthrough'}
    >
      {/* Animated background for hero variant */}
      {variant === 'hero' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      <div className={`flex items-center relative z-10 ${
        showText && showIcon ? 'space-x-2' : ''
      }`}>
        {showIcon && getTutorialIcon()}
        {showText && (
          <span className={`${
            variant === 'hero' ? 'font-semibold' : 'font-medium'
          }`}>
            {getDisplayText()}
          </span>
        )}
      </div>
      
      {/* First-time user indicator */}
      {!hasCompletedTutorial && variant === 'floating' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
      
      {/* Tooltip for mobile */}
      {isMobile && variant === 'floating' && (
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {hasCompletedTutorial ? 'Retake tour' : 'Learn the basics'}
          <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </button>
  );
};

export default TutorialTrigger;