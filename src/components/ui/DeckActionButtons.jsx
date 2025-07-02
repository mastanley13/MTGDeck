import React from 'react';
import { Link } from 'react-router-dom';

const DeckActionButtons = ({ 
  deck,
  isEditMode = false,
  hasUnsavedChanges = false,
  onToggleEditMode,
  onSave,
  onDiscard,
  onDelete,
  isSaving = false,
  showEditControls = true,
  showAITutor = true,
  showDelete = true,
  className = ""
}) => {
  if (!deck) {
    console.warn('DeckActionButtons: No deck provided');
    return null;
  }

  const handleEditToggle = () => {
    console.log('DeckActionButtons: Edit toggle clicked, isEditMode:', isEditMode);
    if (onToggleEditMode) {
      onToggleEditMode();
    } else {
      console.warn('DeckActionButtons: onToggleEditMode handler not provided');
    }
  };

  const handleSave = () => {
    console.log('DeckActionButtons: Save clicked, hasUnsavedChanges:', hasUnsavedChanges, 'isSaving:', isSaving);
    if (onSave) {
      onSave();
    } else {
      console.warn('DeckActionButtons: onSave handler not provided');
    }
  };

  const handleDiscard = () => {
    console.log('DeckActionButtons: Discard clicked');
    if (onDiscard) {
      onDiscard();
    } else {
      console.warn('DeckActionButtons: onDiscard handler not provided');
    }
  };

  const handleDelete = () => {
    console.log('DeckActionButtons: Delete clicked');
    if (onDelete) {
      onDelete();
    } else {
      console.warn('DeckActionButtons: onDelete handler not provided');
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* Edit Mode Toggle (when showing edit controls) */}
      {showEditControls && (
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              {/* Save Changes Button - only show if there are unsaved changes */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-modern btn-modern-primary btn-modern-md disabled:opacity-50 disabled:cursor-not-allowed premium-glow"
                  type="button"
                >
                  {isSaving ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </span>
                  )}
                </button>
              )}
              
              {/* Discard Changes Button - only show if there are unsaved changes */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="btn-modern btn-modern-secondary btn-modern-md disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Discard</span>
                  </span>
                </button>
              )}
              
              {/* Exit Edit Mode Button - always available in edit mode */}
              <button
                onClick={handleEditToggle}
                disabled={isSaving}
                className="btn-modern btn-modern-secondary btn-modern-md disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Exit Edit</span>
                </span>
              </button>
            </>
          ) : (
            /* Edit Button */
            <button
              onClick={handleEditToggle}
              className="btn-modern btn-modern-secondary btn-modern-md group"
              type="button"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </span>
            </button>
          )}
        </div>
      )}
      
      {/* AI Tutor Button (only when not in edit mode) */}
      {showAITutor && !isEditMode && (
        <Link
          to={`/tutor-ai?deck=${deck.id}`}
          state={{ deck }}
          className="btn-modern btn-modern-secondary btn-modern-md group"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AI Tutor</span>
          </span>
        </Link>
      )}
      
      {/* Delete Button (only when not in edit mode) */}
      {showDelete && !isEditMode && (
        <button
          onClick={handleDelete}
          className="btn-modern btn-modern-md group bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg rounded-xl px-4 py-2 font-semibold transition-all hover:scale-105"
          type="button"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Delete</span>
          </span>
        </button>
      )}
    </div>
  );
};

export default DeckActionButtons; 