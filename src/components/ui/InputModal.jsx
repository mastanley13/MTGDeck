import React, { useState, useEffect } from 'react';

const InputModal = ({
  isOpen,
  title,
  message,
  inputLabel,
  initialValue = '',
  placeholder,
  onConfirm,
  onClose,
  confirmText = 'Submit',
  cancelText = 'Cancel',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue); // Reset input value when modal opens
    }
  }, [isOpen, initialValue]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(inputValue);
    }
    // onClose(); // Let the calling component decide if confirm closes, usually does via onConfirm logic
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
        <div className="relative glassmorphism-card border-primary-500/30 shadow-modern-primary p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gradient-primary">{title}</h2>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-white transition-colors duration-200 hover:bg-slate-800/50 rounded-lg p-2"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {message && <p className="text-slate-300 mb-6">{message}</p>}
          <div className="mb-6">
            {inputLabel && <label htmlFor="input-modal-field" className="block text-sm font-medium text-slate-200 mb-2">{inputLabel}</label>}
            <input
              type="text"
              id="input-modal-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-400 shadow-sm transition-all duration-300"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="btn-modern btn-modern-secondary btn-modern-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="btn-modern btn-modern-primary btn-modern-sm"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputModal; 