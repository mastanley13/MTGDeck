import React from 'react';

const StickyCommanderHeader = ({ commander }) => {
  if (!commander) {
    return null;
  }

  // Use art crop for beautiful header display like it was working before
  const imageUrl = commander.image_uris?.art_crop || 
                   commander.image_uris?.normal || 
                   commander.card_faces?.[0]?.image_uris?.art_crop ||
                   commander.card_faces?.[0]?.image_uris?.normal;
  const commanderName = commander.name;

  const scrollToCommander = () => {
    const commanderSection = document.querySelector('[data-commander-section]');
    if (commanderSection) {
      commanderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div 
      onClick={scrollToCommander}
      className="sticky top-0 glassmorphism-card border-primary-500/30 shadow-modern-primary z-50 flex items-center border-b border-slate-700/50 backdrop-blur-lg p-4 cursor-pointer hover:bg-slate-800/20 transition-all duration-300 group"
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={commanderName} 
          className="h-12 w-auto rounded-lg mr-4 border border-primary-500/30 shadow-sm group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            console.error('Sticky header image failed to load:', imageUrl);
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Fallback for missing image */}
      <div 
        className="h-12 w-12 rounded-lg mr-4 border border-primary-500/30 shadow-sm bg-slate-700 flex items-center justify-center text-xs text-slate-400"
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        <span className="text-xs font-bold">IMG</span>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-primary-400 group-hover:text-primary-300 transition-colors duration-300">{commanderName}</h3>
        <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors duration-300">Click to view commander details</p>
      </div>
      <svg className="w-5 h-5 text-slate-400 group-hover:text-primary-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7-7 7" />
      </svg>
    </div>
  );
};

export default StickyCommanderHeader; 