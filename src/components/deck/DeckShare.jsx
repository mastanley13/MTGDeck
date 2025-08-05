import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { generateShareableUrl } from '../../utils/deckExporter';
import { getTCGPlayerMassEntryLink } from '../../utils/tcgPlayerUtils';

const DeckShare = ({ deck }) => {
  const [copied, setCopied] = useState(false);

  if (!deck || !deck.id) {
    return (
      <div className="p-4 bg-logoScheme-darkGray rounded-lg shadow text-gray-300">
        <h2 className="text-xl font-bold mb-4 text-logoScheme-gold">Share Deck</h2>
        <p className="text-gray-400">You need to save your deck before you can share it.</p>
      </div>
    );
  }

  const shareableUrl = generateShareableUrl(deck);
  const tcgPlayerMassEntryLink = getTCGPlayerMassEntryLink(deck);

  const handleCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-logoScheme-darkGray rounded-lg shadow text-gray-300">
      <h2 className="text-xl font-bold mb-4 text-logoScheme-gold">Share Deck</h2>
      
      <div className="mb-6 flex flex-col items-center">
        <div className="p-4 bg-gray-100 border border-logoScheme-brown rounded-lg mb-3">
          <QRCodeSVG value={shareableUrl} size={180} fgColor="#150B00" bgColor="#F8E7B9" />
        </div>
        <p className="text-sm text-gray-400">Scan this QR code to view the deck</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Shareable Link</label>
        <div className="flex">
          <input
            type="text"
            value={shareableUrl}
            readOnly
            className="flex-grow p-2 border border-gray-600 rounded-l-md bg-gray-700 text-sm text-gray-200 focus:ring-logoScheme-gold focus:border-logoScheme-gold"
          />
          <CopyToClipboard text={shareableUrl} onCopy={handleCopied}>
            <button 
              className="px-4 py-2 bg-logoScheme-gold text-logoScheme-darkGray rounded-r-md hover:bg-yellow-400 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </CopyToClipboard>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2 text-logoScheme-gold">Share on Social Media</h3>
        <div className="flex space-x-3">
          <a 
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableUrl)}&text=${encodeURIComponent(`Check out my MTG Commander deck: ${deck.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors text-sm"
          >
            Twitter
          </a>
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors text-sm"
          >
            Facebook
          </a>
          <a 
            href={`mailto:?subject=${encodeURIComponent(`MTG Commander Deck: ${deck.name}`)}&body=${encodeURIComponent(`Check out my MTG Commander deck: ${deck.name}\n\n${shareableUrl}`)}`}
            className="px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Email
          </a>
        </div>
      </div>
      
             {tcgPlayerMassEntryLink && (
         <div className="mt-4">
           <h3 className="text-md font-semibold mb-2 text-logoScheme-gold">Purchase Deck</h3>
           <a
             href={tcgPlayerMassEntryLink}
             target="_blank"
             rel="sponsored noopener noreferrer"
             className="inline-flex items-center px-4 py-2 bg-white text-gray-800 rounded-lg hover:shadow-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
           >
             <img 
               src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/68927a7a7b1adb516a0fdffc.png" 
               alt="TCGPlayer" 
               className="w-5 h-5 mr-2"
             />
             <span className="text-gray-700 font-semibold">Buy Deck on TCGPlayer</span>
           </a>
         </div>
       )}
    </div>
  );
};

export default DeckShare; 