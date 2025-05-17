import React from 'react';

const StickyCommanderHeader = ({ commander }) => {
  if (!commander) {
    return null;
  }

  // Assuming commander object has image_uris.art_crop and name
  const imageUrl = commander.image_uris?.art_crop || commander.image_uris?.normal || 'https://via.placeholder.com/223x310.png?text=No+Image';
  const commanderName = commander.name;

  return (
    <div className="sticky top-0 bg-gray-800 text-white p-2 shadow-md z-50 flex items-center">
      <img src={imageUrl} alt={commanderName} className="h-10 w-auto rounded-sm mr-3" />
      <h3 className="text-lg font-semibold">{commanderName}</h3>
    </div>
  );
};

export default StickyCommanderHeader; 