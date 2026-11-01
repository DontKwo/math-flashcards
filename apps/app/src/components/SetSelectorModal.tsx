import React, { useState } from 'react';
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

  const handleCreate = (): void => {
    if (!newName.trim()) return;
    onCreateSet(newName.trim(), newCategory.trim() || 'General');
    setIsCreating(false);
    setNewName('');
    setNewCategory('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Select Deck</h2>

        {!isCreating ? (
          <>
            <div className="set-list">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className={`set-item ${set.id === activeSetId ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSet(set.id);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
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
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsCreating(true)}
              >
                Create New Deck
              </button>
            </div>
          </>
        ) : (
          <div className="modal-form">
            <div className="input-group">
              <label htmlFor="set-name">Deck Name</label>
              <input
                id="set-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Physics 101"
              />
            </div>
            <div className="input-group">
              <label htmlFor="set-category">Category (Optional)</label>
              <input
                id="set-category"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Science"
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsCreating(false)}>
                Back
              </button>
              <button
                type="button"
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
