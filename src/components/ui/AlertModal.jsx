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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
        <div className="relative glassmorphism-card border-primary-500/30 shadow-modern-primary p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gradient-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors duration-200 hover:bg-slate-800/50 rounded-lg p-2"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>
          <div className="flex justify-end space-x-3">
            {showCancelButton && (
              <button
                onClick={onClose}
                className="btn-modern btn-modern-secondary btn-modern-sm"
              >
                {cancelText}
              </button>
            )}
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

export default AlertModal; 