import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { saveDeckFile, exportToText, exportToMoxfield } from '../../utils/deckExporter';

const DeckExporter = ({ deck }) => {
  const [exportFormat, setExportFormat] = useState('text');
  const [copied, setCopied] = useState(false);

  if (!deck || !deck.commander || !deck.cards) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Export Deck</h2>
        <p className="text-gray-500">You need to have a commander and at least one card to export a deck.</p>
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
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Export Deck</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="exportFormat"
              value="text"
              checked={exportFormat === 'text'}
              onChange={() => setExportFormat('text')}
            />
            <span className="ml-2">Text Format</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
        <div className="border rounded-md p-3 bg-gray-50 h-64 overflow-auto whitespace-pre-wrap font-mono text-sm">
          {exportContent}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Download as Text File
        </button>
        
        <CopyToClipboard text={exportContent} onCopy={handleCopied}>
          <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default DeckExporter; 