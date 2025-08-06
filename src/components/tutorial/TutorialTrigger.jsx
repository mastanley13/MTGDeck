import React from 'react';
import { useTutorial } from '../../context/TutorialContext';

const TutorialTrigger = ({ 
  variant = 'floating', 
  className = '',
  showIcon = true,
  showText = true,
  text = 'Take Tour',
  size = 'default'
}) => {
  const { startTutorial, hasCompletedTutorial } = useTutorial();

  const handleClick = () => {
    startTutorial();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 text-sm';
      case 'large':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'navbar':
        return 'text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50';
      case 'button':
        return 'bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105';
      case 'outline':
        return 'border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-lg transition-all duration-300';
      case 'floating':
      default:
        return 'bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105';
    }
  };

  const getPositionClasses = () => {
    switch (variant) {
      case 'floating':
        return 'fixed bottom-6 right-6 z-50';
      case 'navbar':
        return '';
      default:
        return '';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${getPositionClasses()} ${getVariantClasses()} ${getSizeClasses()} ${className} flex items-center space-x-2`}
      title={hasCompletedTutorial ? 'Restart Tutorial' : 'Start Tutorial'}
    >
      {showIcon && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {showText && <span>{text}</span>}
    </button>
  );
};

export default TutorialTrigger; 