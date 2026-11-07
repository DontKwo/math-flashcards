import { useState, useId } from 'react';
import { exportFlashset, importFlashset } from '@formulaflash/core';
import type { CardSet } from '@formulaflash/core';
import { useLibrary } from '../data/useLibrary.ts';
import { useEditorState } from './useEditorState.ts';
import { EditorCardRow } from './EditorCardRow.tsx';
import { EditorBulkAddModal } from './EditorBulkAddModal.tsx';
import { validateCardRows } from './editor-validation.ts';
import { Button } from '../ui/Button.tsx';
import { Toast } from '../ui/Toast.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Icon } from '../ui/Icon.tsx';
import './screens.css';

interface EditorScreenProps {
  setId?: string | null;
}

export function EditorScreen({ setId = null }: EditorScreenProps) {
  const { saveSet, getSet } = useLibrary();
  const titleInputId = useId();
  const descInputId = useId();
  const categoryInputId = useId();
  const tagInputId = useId();

  const {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    tags,
    addTag,
    removeTag,
    cards,
    updateCard,
    addCard,
    duplicateCard,
    deleteCard,
    moveCard,
    bulkAddCards,
    autosaveStatus,
    undoToast,
    dismissUndoToast,
    undo,
    redo,
    canUndo,
    canRedo,
    existingTags,
    existingCategories,
    saveToRepository,
  } = useEditorState(setId);

  const [tagInput, setTagInput] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [importConflictModal, setImportConflictModal] = useState<{
    incomingSet: CardSet;
  } | null>(null);

  const validationIssues = validateCardRows(
    cards.map((c) => ({
      id: c.id,
      frontText: c.frontText,
      answerText: c.answerText,
      answerMode: c.answerMode,
    }))
  );

  const handleDone = async () => {
    if (!title.trim()) {
      alert('Please provide a title for the set before saving.');
      return;
    }
    await saveToRepository();
    sessionStorage.removeItem('formulaflash_editor_draft');
    if (setId) {
      window.location.hash = `#/set/${setId}`;
    } else {
      window.location.hash = '#/';
    }
  };

  const handleExportFlashset = async () => {
    await saveToRepository();
    const set = await getSet(setId || 'unsaved');
    if (!set) return;

    const blob = await exportFlashset(set);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${set.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.flashset`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFlashset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== 'string') return;
        const imported = await importFlashset(text);

        if (setId || title.trim()) {
          setImportConflictModal({ incomingSet: imported.set });
        } else {
          setTitle(imported.set.title);
          setDescription(imported.set.description || '');
          setCategory(imported.set.category || '');
          imported.set.tags?.forEach(addTag);
          bulkAddCards(
            imported.set.cards.map((c) => ({
              frontText: c.front.map((s) => s.v).join(''),
              answerText: c.back.map((s) => s.v).join(''),
            }))
          );
        }
      } catch {
        alert('Failed to parse .flashset bundle file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="editor-screen-container"
      data-testid="editor-screen"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          void handleDone();
        }
      }}
    >
      {/* TOP BAR */}
      <header className="editor-top-bar" data-testid="editor-top-bar">
        <div className="editor-top-left">
          <Button
            variant="ghost"
            size="sm"
            data-testid="editor-back-btn"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.hash = '#/';
              }
            }}
          >
            <Icon name="arrow-left" size="sm" />
            <span>Back</span>
          </Button>

          <span
            className={`editor-autosave-badge ${autosaveStatus}`}
            data-testid="editor-autosave-status"
          >
            {autosaveStatus === 'saving' && 'Saving...'}
            {autosaveStatus === 'saved' && 'Saved'}
            {autosaveStatus === 'unsaved' && 'Unsaved draft'}
            {autosaveStatus === 'error' && 'Error saving'}
          </span>
        </div>

        <div className="editor-top-actions">
          <button
            type="button"
            className="editor-action-btn"
            disabled={!canUndo}
            data-testid="editor-undo-btn"
            aria-label="Undo edit"
            onClick={undo}
          >
            <Icon name="undo" size="sm" />
          </button>
          <button
            type="button"
            className="editor-action-btn"
            disabled={!canRedo}
            data-testid="editor-redo-btn"
            aria-label="Redo edit"
            onClick={redo}
          >
            <Icon name="redo" size="sm" />
          </button>

          <Button
            variant="secondary"
            size="sm"
            data-testid="editor-bulk-add-open-btn"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Icon name="plus" size="sm" />
            <span>Bulk Add</span>
          </Button>

          <label className="editor-file-label">
            <span className="hidden">Import Flashset</span>
            <input
              type="file"
              accept=".flashset,.json"
              className="hidden"
              onChange={handleImportFlashset}
            />
            <span className="ui-btn ui-btn--ghost ui-btn--sm">Import</span>
          </label>

          <Button variant="ghost" size="sm" onClick={handleExportFlashset}>
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            data-testid="editor-done-btn"
            onClick={handleDone}
          >
            Done
          </Button>
        </div>
      </header>

      {/* METADATA FORM */}
      <section className="editor-meta-panel" data-testid="editor-meta-panel">
        <div className="editor-meta-grid">
          <div className="editor-meta-field">
            <label htmlFor={titleInputId} className="editor-meta-label">Title *</label>
            <input
              id={titleInputId}
              type="text"
              className="editor-meta-input title-input"
              data-testid="editor-title-input"
              placeholder="e.g. Linear Algebra Finals Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="editor-meta-field">
            <label htmlFor={categoryInputId} className="editor-meta-label">Category</label>
            <input
              id={categoryInputId}
              type="text"
              className="editor-meta-input"
              data-testid="editor-category-input"
              list="existing-categories"
              placeholder="e.g. Mathematics"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="existing-categories">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="editor-meta-field">
          <label htmlFor={descInputId} className="editor-meta-label">Description (Optional)</label>
          <textarea
            id={descInputId}
            className="editor-meta-textarea"
            rows={2}
            placeholder="Add a description or course context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="editor-tags-field">
          <label htmlFor={tagInputId} className="editor-meta-label">Tags (comma-separated or press Enter)</label>
          <div className="editor-tags-input-row">
            <input
              id={tagInputId}
              type="text"
              className="editor-meta-input"
              data-testid="editor-tag-input"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  if (tagInput.trim()) {
                    addTag(tagInput);
                    setTagInput('');
                  }
                }
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              data-testid="editor-add-tag-btn"
              onClick={() => {
                if (tagInput.trim()) {
                  addTag(tagInput);
                  setTagInput('');
                }
              }}
            >
              Add
            </Button>
          </div>

          <div className="editor-tags-list">
            {tags.map((t) => (
              <span key={t} className="editor-tag-chip">
                {t}
                <button
                  type="button"
                  className="editor-tag-remove"
                  onClick={() => removeTag(t)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {existingTags.length > 0 && (
            <div className="editor-tag-suggestions">
              <span className="editor-sublabel">Suggestions:</span>
              {existingTags
                .filter((t) => !tags.includes(t))
                .slice(0, 6)
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="editor-suggestion-chip"
                    onClick={() => addTag(t)}
                  >
                    +{t}
                  </button>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* CARD ROWS SECTION */}
      <section className="editor-cards-section" data-testid="editor-cards-section">
        <div className="editor-cards-header">
          <h2 className="editor-cards-title">Cards ({cards.length})</h2>
          <Button
            variant="secondary"
            size="sm"
            data-testid="editor-add-card-btn"
            onClick={() => addCard()}
          >
            <Icon name="plus" size="sm" />
            <span>Add Card</span>
          </Button>
        </div>

        <div className="editor-cards-container" data-testid="editor-cards-container">
          {cards.map((card, idx) => {
            const warning = validationIssues.find((i) => i.cardId === card.id)?.message;
            return (
              <EditorCardRow
                key={card.id}
                card={card}
                index={idx}
                totalCards={cards.length}
                warningMessage={warning}
                onUpdate={(updater) => updateCard(card.id, updater)}
                onDuplicate={() => duplicateCard(card.id)}
                onDelete={() => deleteCard(card.id)}
                onMoveUp={() => moveCard(card.id, 'up')}
                onMoveDown={() => moveCard(card.id, 'down')}
                onEnterInLastField={() => {
                  const newId = addCard();
                  setTimeout(() => {
                    const rowEl = document.getElementById(`editor-row-${newId}`);
                    rowEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
              />
            );
          })}
        </div>

        <div className="editor-bottom-add-card">
          <Button
            variant="secondary"
            size="lg"
            className="editor-large-add-btn"
            onClick={() => addCard()}
          >
            <Icon name="plus" size="md" />
            <span>Add Card (Enter in last field)</span>
          </Button>
        </div>
      </section>

      {/* BULK ADD MODAL */}
      <EditorBulkAddModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={bulkAddCards}
      />

      {/* IMPORT CONFLICT MODAL */}
      {importConflictModal && (
        <Modal
          isOpen={true}
          title="Import Flashset Conflict"
          onClose={() => setImportConflictModal(null)}
          footer={
            <div className="editor-modal-footer">
              <Button variant="ghost" onClick={() => setImportConflictModal(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const incoming = importConflictModal.incomingSet;
                  const newSetId = `set-${Date.now()}`;
                  await saveSet({
                    ...incoming,
                    id: newSetId,
                    title: `${incoming.title} (Imported)`,
                  });
                  setImportConflictModal(null);
                  window.location.hash = `#/set/${newSetId}`;
                }}
              >
                Keep both
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  const incoming = importConflictModal.incomingSet;
                  setTitle(incoming.title);
                  setDescription(incoming.description || '');
                  setCategory(incoming.category || '');
                  incoming.tags?.forEach(addTag);
                  bulkAddCards(
                    incoming.cards.map((c) => ({
                      frontText: c.front.map((s) => s.v).join(''),
                      answerText: c.back.map((s) => s.v).join(''),
                    }))
                  );
                  setImportConflictModal(null);
                }}
              >
                Replace
              </Button>
            </div>
          }
        >
          <p>
            An existing set is currently being edited. Would you like to replace the
            current cards with the imported ones, create a separate new set, or cancel?
          </p>
        </Modal>
      )}

      {/* UNDO TOAST */}
      {undoToast && (
        <Toast
          message={undoToast.message}
          actionLabel="Undo"
          onAction={() => {
            undoToast.restoreAction();
            dismissUndoToast();
          }}
          onClose={dismissUndoToast}
        />
      )}
    </div>
  );
}
