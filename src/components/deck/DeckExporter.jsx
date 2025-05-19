import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { saveDeckFile, exportToText, exportToMoxfield } from '../../utils/deckExporter';

const DeckExporter = ({ deck }) => {
  const [exportFormat, setExportFormat] = useState('text');
  const [copied, setCopied] = useState(false);

  if (!deck || !deck.commander || !deck.cards) {
    return (
      <div className="p-4 bg-logoScheme-darkGray rounded-lg shadow text-gray-300">
        <h2 className="text-xl font-bold mb-4 text-logoScheme-gold">Export Deck</h2>
        <p className="text-gray-400">You need to have a commander and at least one card to export a deck.</p>
      </div>
    );
  }

  const handleExport = () => {
    try {
      saveDeckFile(deck, exportFormat);
    } catch (error) {
      console.error('Error exporting deck:', error);
      alert('Failed to export deck. Please try again.');
    }
  };

  const handleCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportContent = exportFormat === 'moxfield' ? exportToMoxfield(deck) : exportToText(deck);

  return (
    <div className="p-4 bg-logoScheme-darkGray rounded-lg shadow text-gray-300">
      <h2 className="text-xl font-bold mb-4 text-logoScheme-gold">Export Deck</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Export Format</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center text-gray-200">
            <input
              type="radio"
              className="form-radio text-logoScheme-gold focus:ring-logoScheme-gold border-gray-600 bg-gray-700"
              name="exportFormat"
              value="text"
              checked={exportFormat === 'text'}
              onChange={() => setExportFormat('text')}
            />
            <span className="ml-2">Text Format</span>
          </label>
          <label className="inline-flex items-center text-gray-200">
            <input
              type="radio"
              className="form-radio text-logoScheme-gold focus:ring-logoScheme-gold border-gray-600 bg-gray-700"
              name="exportFormat"
              value="moxfield"
              checked={exportFormat === 'moxfield'}
              onChange={() => setExportFormat('moxfield')}
            />
            <span className="ml-2">Moxfield Format</span>
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Preview</label>
        <div className="border border-logoScheme-brown rounded-md p-3 bg-gray-800 h-64 overflow-auto whitespace-pre-wrap font-mono text-sm text-gray-300">
          {exportContent}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="btn-primary px-4 py-2"
        >
          Download as Text File
        </button>
        
        <CopyToClipboard text={exportContent} onCopy={handleCopied}>
          <button className="px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors">
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default DeckExporter; 