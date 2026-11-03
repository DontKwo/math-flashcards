import React, { useState } from 'react';
import { MathLiveField } from './MathLiveField.tsx';
import type { FlashcardItem } from '../data/sample-deck.ts';

export interface CardCreatorModalProps {
  onSave: (card: FlashcardItem) => void;
  onClose: () => void;
}

export const CardCreatorModal: React.FunctionComponent<CardCreatorModalProps> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [prompt, setPrompt] = useState('');
  const [latexAnswer, setLatexAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleSave = (): void => {
    if (!title || !prompt || !latexAnswer) return;

    const newCard: FlashcardItem = {
      id: crypto.randomUUID(),
      title,
      category: category || 'General',
      prompt,
      latexAnswer,
      hint,
      explanation,
    };
    onSave(newCard);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Create Flashcard</h2>

        <div className="modal-form">
          <div className="input-group">
            <label htmlFor="card-title">Title</label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coulomb's Law"
            />
          </div>

          <div className="input-group">
            <label htmlFor="card-category">Category</label>
            <input
              id="card-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Physics"
            />
          </div>

          <div className="input-group">
            <label htmlFor="card-prompt">Prompt</label>
            <textarea
              id="card-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Question text"
              rows={3}
            />
          </div>

          <div className="input-group">
            <label htmlFor="card-answer">Equation Answer</label>
            <MathLiveField
              value={latexAnswer}
              onChange={setLatexAnswer}
              placeholder="e.g. F = k_e \frac{q_1 q_2}{r^2}"
              className="math-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="card-hint">Hint (Optional)</label>
            <input
              id="card-hint"
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Optional hint"
            />
          </div>

          <div className="input-group">
            <label htmlFor="card-explanation">Explanation (Optional)</label>
            <textarea
              id="card-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Optional explanation for the back of the card"
              rows={3}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={!title || !prompt || !latexAnswer}
          >
            Save Card
          </button>
        </div>
      </div>
    </div>
  );
};
