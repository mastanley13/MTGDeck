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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-logoScheme-darkGray p-6 rounded-lg shadow-xl w-full max-w-md border border-logoScheme-brown">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-logoScheme-gold">{title}</h2>
          <button
            onClick={handleCancel} // Use handleCancel for the X button
            className="text-gray-400 hover:text-logoScheme-gold transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {message && <p className="text-gray-300 mb-4">{message}</p>}
        <div className="mb-5">
          {inputLabel && <label htmlFor="input-modal-field" className="block text-sm font-medium text-gray-200 mb-1">{inputLabel}</label>}
          <input
            type="text"
            id="input-modal-field"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-gray-700 border border-gray-500 text-gray-100 focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:border-logoScheme-gold placeholder-gray-400 shadow-sm"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-md text-sm font-medium border border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-logoScheme-darkGray"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium bg-logoScheme-gold hover:bg-sky-600 text-logoScheme-darkGray transition-colors focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:ring-offset-2 focus:ring-offset-logoScheme-darkGray"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal; 