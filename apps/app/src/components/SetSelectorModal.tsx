import React, { useState, useEffect } from 'react';
import type { FlashcardSet } from '../data/storage.ts';

export interface SetSelectorModalProps {
  sets: FlashcardSet[];
  activeSetId: string;
  onSelectSet: (setId: string) => void;
  onCreateSet: (name: string, category: string) => void;
  onClose: () => void;
}

export const SetSelectorModal: React.FC<SetSelectorModalProps> = ({
  sets,
  activeSetId,
  onSelectSet,
  onCreateSet,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreate = (): void => {
    if (!newName.trim()) return;
    onCreateSet(newName.trim(), newCategory.trim() || 'General');
    setIsCreating(false);
    setNewName('');
    setNewCategory('');
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-selector-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="set-selector-dialog-title" className="modal-title">
            {isCreating ? 'Create New Deck' : 'Select Deck'}
          </h2>
          <button
            type="button"
            data-testid="set-selector-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {!isCreating ? (
          <>
            <div className="set-list" role="listbox" aria-label="Deck List">
              {sets.map((set, idx) => (
                <div
                  key={set.id}
                  data-testid={`set-selector-item-${idx}`}
                  className={`set-item ${set.id === activeSetId ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSet(set.id);
                    onClose();
                  }}
                  role="option"
                  aria-selected={set.id === activeSetId}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectSet(set.id);
                      onClose();
                    }
                  }}
                >
                  <div>
                    <div className="set-name">{set.name}</div>
                    <div className="deck-tag" style={{ display: 'inline-block', marginTop: '4px' }}>
                      {set.category}
                    </div>
                  </div>
                  <div className="set-count">{set.cards.length} cards</div>
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                data-testid="set-selector-cancel-btn"
                className="btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                data-testid="set-selector-new-btn"
                className="btn-primary"
                onClick={() => setIsCreating(true)}
              >
                + New Deck
              </button>
            </div>
          </>
        ) : (
          <div className="modal-form">
            <div className="input-group">
              <label htmlFor="set-name">Deck Name</label>
              <input
                id="set-name"
                data-testid="set-create-name-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Physics 101"
                autoFocus
              />
            </div>
            <div className="input-group" style={{ marginTop: '12px' }}>
              <label htmlFor="set-category">Category (Optional)</label>
              <input
                id="set-category"
                data-testid="set-create-category-input"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Science"
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                data-testid="set-create-back-btn"
                className="btn-secondary"
                onClick={() => setIsCreating(false)}
              >
                Back
              </button>
              <button
                type="button"
                data-testid="set-create-submit-btn"
                className="btn-primary"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                Create Deck
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
