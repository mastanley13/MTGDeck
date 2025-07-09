import React, { useState } from 'react';
import { importDeckFromText, extractDeckName, validateImportResult } from '../../services/deckImportService';
import FileUploadZone from '../ui/FileUploadZone';
import ImportProgressDisplay from '../ui/ImportProgressDisplay';
import ImportResultsDisplay from '../ui/ImportResultsDisplay';
import { useDeck } from '../../context/DeckContext';
import { useAuth } from '../../context/AuthContext';


const DeckImporter = ({ onImportComplete, onClose }) => {
  const [importMethod, setImportMethod] = useState('file');
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [pasteContent, setPasteContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  
  // Context hooks
  const { importDeck, saveCurrentDeckToGHL } = useDeck();
  const { currentUser, isAuthenticated } = useAuth();

  
  const processImport = async (content, fileName = 'Imported Deck') => {
    setIsProcessing(true);
    setErrors([]);
    setImportProgress(null);
    setImportResult(null);
    
    try {
      // Extract deck name from content if available
      const extractedName = extractDeckName(content) || fileName.replace(/\.[^/.]+$/, '');
      
      const result = await importDeckFromText(content, {
        onProgress: setImportProgress,
        validateDeck: true
      });
      
      // Add extracted name to result
      result.name = extractedName;
      result.description = `Imported from ${result.format} format`;
      
      // Validate the import result
      const validation = validateImportResult(result);
      result.importValidation = validation;
      
      setImportResult(result);
      
    } catch (error) {
      console.error('Import failed:', error);
      setErrors([`Import failed: ${error.message}`]);
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };
  
  const handleFileUpload = async (file) => {
    try {
      const content = await file.text();
      await processImport(content, file.name);
    } catch (error) {
      setErrors([`Failed to read file: ${error.message}`]);
      setIsProcessing(false);
    }
  };
  
  const handlePasteImport = async () => {
    if (!pasteContent.trim()) {
      setErrors(['Please paste your deck list first']);
      return;
    }
    await processImport(pasteContent, 'Pasted Deck');
  };
  
  const handleUrlImport = async () => {
    if (!urlContent.trim()) {
      setErrors(['Please enter a deck URL first']);
      return;
    }
    
    // For now, we'll treat URL content as a placeholder
    // In a full implementation, you'd fetch the deck from the URL
    setErrors(['URL import is not yet implemented. Please copy and paste the deck list instead.']);
  };
  
  const handleConfirmImport = async () => {
    if (!importResult) return;
    

    
    // Determine final deck name
    let finalDeckName = importResult.name || 'Imported Deck';
    
    // If deck name is generic or missing, show name input
    if (!deckName && (finalDeckName === 'Imported Deck' || finalDeckName === 'Pasted Deck')) {
      setShowNameInput(true);
      return;
    }
    
    if (deckName) {
      finalDeckName = deckName;
    }
    
    try {
      setIsProcessing(true);
      
      // Import the deck into context
      importDeck({
        commander: importResult.commander,
        cards: importResult.cards,
        name: finalDeckName,
        description: importResult.description || '',
        cardCategories: {} // Will be auto-assigned based on card types
      });
      
      // Save to GoHighLevel if user is authenticated
      if (isAuthenticated && currentUser) {
        const success = await saveCurrentDeckToGHL(
          currentUser.id,
          importResult.commander.name, // GHL deck name field (required)
          finalDeckName, // Local deck name
          {
            commander: importResult.commander,
            cards: importResult.cards,
            description: importResult.description || '',
            cardCategories: {}
          }
        );
        
        if (!success) {
          // Still proceed with local import even if GHL save fails
          console.warn('Failed to save to GoHighLevel, but deck imported locally');
        }
      }
      
      // Call completion callback
      onImportComplete({
        ...importResult,
        name: finalDeckName,
        savedToCloud: isAuthenticated && currentUser
      });
      
      onClose();
      
    } catch (error) {
      console.error('Failed to complete import:', error);
      setErrors([`Failed to save imported deck: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancelImport = () => {
    setImportResult(null);
    setErrors([]);
    setShowNameInput(false);
    setDeckName('');
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-400 flex items-center space-x-2">
            <span>📥</span>
            <span>Import Deck</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Method Selection */}
        {!importResult && !isProcessing && (
          <div className="mb-6">
            <div className="flex space-x-2 mb-4">
              {[
                { id: 'file', label: 'Upload File', icon: '📁' },
                { id: 'paste', label: 'Paste Text', icon: '📋' },
                { id: 'url', label: 'From URL', icon: '🔗' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setImportMethod(method.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    importMethod === method.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{method.icon}</span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Import Interface */}
        {!importResult && !isProcessing && (
          <>
            {importMethod === 'file' && (
              <FileUploadZone 
                onFileUpload={handleFileUpload}
                disabled={isProcessing}
              />
            )}
            
            {importMethod === 'paste' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Paste Deck List
                </label>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste your deck list here...

Example formats supported:
• Commander: Alesha, Who Smiles at Death
• 1 Sol Ring
• 1 Command Tower
• ...

Or:
• 1x Alesha, Who Smiles at Death *CMDR*
• 1x Sol Ring
• 1x Command Tower"
                  className="w-full h-48 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:border-primary-500 focus:outline-none"
                  disabled={isProcessing}
                />
                <button
                  onClick={handlePasteImport}
                  disabled={!pasteContent.trim() || isProcessing}
                  className="mt-3 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Import from Clipboard
                </button>
              </div>
            )}
            
            {importMethod === 'url' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deck URL
                </label>
                <input
                  type="url"
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                  placeholder="https://moxfield.com/decks/..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleUrlImport}
                  disabled={!urlContent.trim() || isProcessing}
                  className="mt-3 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Import from URL
                </button>
                <div className="mt-2 text-sm text-yellow-400">
                  🚧 URL import is coming soon. For now, copy and paste the deck list using the "Paste Text" option.
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Progress Display */}
        {importProgress && (
          <ImportProgressDisplay progress={importProgress} />
        )}
        
        {/* Name Input Modal */}
        {showNameInput && (
          <div className="mb-6 bg-gray-700 rounded-lg p-4 border border-primary-500">
            <h3 className="text-lg font-semibold text-white mb-3">Name Your Deck</h3>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter deck name..."
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-3">
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setDeckName('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!deckName.trim()}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Deck
              </button>
            </div>
          </div>
        )}
        
        {/* Results Display */}
        {importResult && !showNameInput && (
          <ImportResultsDisplay 
            result={importResult}
            onConfirm={handleConfirmImport}
            onCancel={handleCancelImport}
          />
        )}
        
        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <h3 className="text-red-400 font-semibold mb-2 flex items-center space-x-2">
              <span>❌</span>
              <span>Import Errors</span>
            </h3>
            {errors.map((error, index) => (
              <p key={index} className="text-gray-300 text-sm">{error}</p>
            ))}
          </div>
        )}
        
        {/* Loading State */}
        {isProcessing && !importProgress && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-300">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckImporter; 