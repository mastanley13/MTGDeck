import React, { useState, useRef } from 'react';

const FileUploadZone = ({ onFileUpload, disabled = false, acceptedTypes = ['.txt', '.dec'] }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => 
      file.type === 'text/plain' || 
      acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.toLowerCase()))
    );
    
    if (textFile) {
      onFileUpload(textFile);
    } else {
      alert('Please upload a text file (.txt or .dec)');
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        disabled 
          ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
          : isDragOver
          ? 'border-primary-400 bg-primary-400/10'
          : 'border-gray-600 hover:border-gray-500 cursor-pointer'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <div className="text-4xl mb-4">
        {disabled ? '⏳' : '📁'}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {disabled ? 'Processing...' : 'Drop your deck file here'}
      </h3>
      <p className="text-gray-400 mb-4">
        {disabled 
          ? 'Please wait while we process your deck'
          : 'Supports .txt, .dec files from popular deck builders'
        }
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) fileInputRef.current?.click();
        }}
        disabled={disabled}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {disabled ? 'Processing...' : 'Choose File'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="mt-4 text-sm text-gray-500">
        Supported formats: Moxfield, EDHREC, Archidekt, TappedOut, MTGGoldfish, Generic
      </div>
    </div>
  );
};

export default FileUploadZone; 