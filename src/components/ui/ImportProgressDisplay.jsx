import React from 'react';

const ImportProgressDisplay = ({ progress }) => {
  const getStageLabel = (stage) => {
    const labels = {
      parsing: 'Analyzing deck format',
      resolving: 'Resolving cards from database',
      detecting_commander: 'Detecting commander',
      validating: 'Validating deck',
      complete: 'Import complete'
    };
    return labels[stage] || 'Processing';
  };
  
  const getStageIcon = (stage) => {
    const icons = {
      parsing: '🔍',
      resolving: '🃏',
      detecting_commander: '👑',
      validating: '✅',
      complete: '🎉'
    };
    return icons[stage] || '⚙️';
  };
  
  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4 border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStageIcon(progress.stage)}</span>
          <span className="text-white font-medium">
            {getStageLabel(progress.stage)}
          </span>
        </div>
        <span className="text-gray-400 text-sm font-mono">
          {progress.current}/{progress.total} ({progressPercent}%)
        </span>
      </div>
      
      {progress.cardName && (
        <p className="text-gray-400 text-sm mb-3 truncate">
          <span className="text-primary-400">Current:</span> {progress.cardName}
        </p>
      )}
      
      <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {progress.stage === 'resolving' && (
        <div className="mt-2 text-xs text-gray-500">
          Resolving card names from Scryfall database...
        </div>
      )}
      
      {progress.stage === 'complete' && (
        <div className="mt-2 text-xs text-green-400">
          ✨ Import completed successfully!
        </div>
      )}
    </div>
  );
};

export default ImportProgressDisplay; 