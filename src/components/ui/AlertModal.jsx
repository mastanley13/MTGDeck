import React from 'react';

const AlertModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancelButton = true // Default to true, can be overridden
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose(); // Usually, confirming also closes the modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-logoScheme-darkGray p-6 rounded-lg shadow-xl w-full max-w-md border border-logoScheme-brown">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-logoScheme-gold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-logoScheme-gold transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          {showCancelButton && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-600 hover:bg-gray-500 text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-logoScheme-darkGray"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium bg-logoScheme-gold hover:bg-yellow-400 text-logoScheme-darkGray transition-colors focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:ring-offset-2 focus:ring-offset-logoScheme-darkGray"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal; 