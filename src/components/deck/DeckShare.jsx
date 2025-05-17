import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { generateShareableUrl } from '../../utils/deckExporter';

const DeckShare = ({ deck }) => {
  const [copied, setCopied] = useState(false);

  if (!deck || !deck.id) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Share Deck</h2>
        <p className="text-gray-500">You need to save your deck before you can share it.</p>
      </div>
    );
  }

  const shareableUrl = generateShareableUrl(deck);

  const handleCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Share Deck</h2>
      
      <div className="mb-6 flex flex-col items-center">
        <div className="p-4 bg-white border rounded-lg mb-3">
          <QRCodeSVG value={shareableUrl} size={180} />
        </div>
        <p className="text-sm text-gray-500">Scan this QR code to view the deck</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Shareable Link</label>
        <div className="flex">
          <input
            type="text"
            value={shareableUrl}
            readOnly
            className="flex-grow p-2 border rounded-l-md bg-gray-50 text-sm"
          />
          <CopyToClipboard text={shareableUrl} onCopy={handleCopied}>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </CopyToClipboard>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2">Share on Social Media</h3>
        <div className="flex space-x-3">
          <a 
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableUrl)}&text=${encodeURIComponent(`Check out my MTG Commander deck: ${deck.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Twitter
          </a>
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Facebook
          </a>
          <a 
            href={`mailto:?subject=${encodeURIComponent(`MTG Commander Deck: ${deck.name}`)}&body=${encodeURIComponent(`Check out my MTG Commander deck: ${deck.name}\n\n${shareableUrl}`)}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeckShare; 