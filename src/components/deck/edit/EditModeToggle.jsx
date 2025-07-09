import React from 'react';
import { IconEdit, IconEye, IconDeviceFloppy, IconX } from '@tabler/icons-react';

const EditModeToggle = ({ 
  isEditMode, 
  hasUnsavedChanges, 
  onToggleEditMode, 
  onSave, 
  onDiscard,
  isSaving = false,
  disabled = false 
}) => {
  
  const handleToggleEdit = () => {
    if (isEditMode && hasUnsavedChanges) {
      // Show confirmation before losing changes
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to exit edit mode? Your changes will be lost.'
      );
      if (!confirmed) return;
    }
    onToggleEditMode();
  };

  if (!isEditMode) {
    // View Mode - Show Edit button
    return (
      <button
        onClick={handleToggleEdit}
        disabled={disabled}
        className="btn-modern btn-modern-primary btn-modern-lg group"
      >
        <span className="flex items-center space-x-2">
          <IconEdit size={16} />
          <span>Edit Deck</span>
        </span>
      </button>
    );
  }

  // Edit Mode - Show edit controls
  return (
    <div className="flex flex-wrap gap-3">
      {/* Edit Mode Indicator */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        <span className="text-orange-300 text-sm font-medium">
          EDITING {hasUnsavedChanges && '• Unsaved Changes'}
        </span>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={isSaving || !hasUnsavedChanges}
        className="btn-modern btn-modern-primary btn-modern-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center space-x-2">
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <IconDeviceFloppy size={16} />
              <span>Save Changes</span>
            </>
          )}
        </span>
      </button>

      {/* Discard Button */}
      {hasUnsavedChanges && (
        <button
          onClick={onDiscard}
          disabled={isSaving}
          className="btn-modern btn-modern-outline btn-modern-lg"
        >
          <span className="flex items-center space-x-2">
            <IconX size={16} />
            <span>Discard</span>
          </span>
        </button>
      )}

      {/* View Mode Button */}
      <button
        onClick={handleToggleEdit}
        disabled={isSaving}
        className="btn-modern btn-modern-secondary btn-modern-lg"
      >
        <span className="flex items-center space-x-2">
          <IconEye size={16} />
          <span>View Mode</span>
        </span>
      </button>
    </div>
  );
};

export default EditModeToggle; 