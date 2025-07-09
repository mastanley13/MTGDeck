import React, { useEffect } from 'react';
import { IconAlertTriangle, IconDeviceFloppy, IconX } from '@tabler/icons-react';

const UnsavedChangesWarning = ({ 
  hasUnsavedChanges, 
  onSave, 
  onDiscard,
  isSaving = false,
  className = ""
}) => {
  
  // Prevent page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (!hasUnsavedChanges) return null;

  return (
    <div className={`glassmorphism-card border-orange-500/50 bg-orange-500/10 p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
            <IconAlertTriangle size={20} className="text-orange-400" />
          </div>
        </div>

        {/* Warning Content */}
        <div className="flex-1">
          <h4 className="text-orange-300 font-semibold mb-1">Unsaved Changes</h4>
          <p className="text-orange-200/80 text-sm">
            You have unsaved changes to your deck. Save your changes or they will be lost.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-modern btn-modern-primary btn-modern-sm flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <IconDeviceFloppy size={14} />
                <span>Save</span>
              </>
            )}
          </button>
          
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="btn-modern btn-modern-outline btn-modern-sm flex items-center space-x-2"
          >
            <IconX size={14} />
            <span>Discard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesWarning; 