import { useState, useRef } from 'react';
import type { EditorCardRowData } from './useEditorState.ts';
import { SegmentedControl } from '../ui/SegmentedControl.tsx';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';
import { MathDisplay } from '../components/MathDisplay.tsx';
import { MathLiveField } from '../components/MathLiveField.tsx';
import { EditorTestAnswer } from './EditorTestAnswer.tsx';

interface EditorCardRowProps {
  card: EditorCardRowData;
  index: number;
  totalCards: number;
  onUpdate: (updater: (card: EditorCardRowData) => EditorCardRowData) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEnterInLastField: () => void;
  warningMessage?: string;
}

export function EditorCardRow({
  card,
  index,
  totalCards,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onEnterInLastField,
  warningMessage,
}: EditorCardRowProps) {
  const [isAnswerFocused, setIsAnswerFocused] = useState(false);
  const [showDetails, setShowDetails] = useState(
    Boolean(card.hint || card.explanation || card.acceptedAnswers.length > 0)
  );

  const answerRef = useRef<HTMLDivElement>(null);

  const modeOptions = [
    { label: 'Text', value: 'text' },
    { label: 'Math', value: 'math' },
    { label: 'Mixed', value: 'mixed' },
  ];

  return (
    <div
      className="editor-row-card"
      data-testid={`editor-row-${card.id}`}
      id={`editor-row-${card.id}`}
    >
      <div className="editor-row-header">
        <div className="editor-row-meta">
          <span className="editor-row-number">{index + 1}</span>
          <button
            type="button"
            className={`editor-row-star-btn ${card.starred ? 'is-starred' : ''}`}
            data-testid={`editor-card-star-${card.id}`}
            aria-label={card.starred ? 'Unstar card' : 'Star card'}
            onClick={() => onUpdate((c) => ({ ...c, starred: !c.starred }))}
          >
            <Icon name="star" size="sm" />
          </button>
        </div>

        <div className="editor-row-actions">
          <button
            type="button"
            className="editor-action-btn"
            disabled={index === 0}
            data-testid={`editor-move-up-${card.id}`}
            aria-label="Move card up"
            onClick={onMoveUp}
          >
            <Icon name="chevron-up" size="sm" />
          </button>
          <button
            type="button"
            className="editor-action-btn"
            disabled={index === totalCards - 1}
            data-testid={`editor-move-down-${card.id}`}
            aria-label="Move card down"
            onClick={onMoveDown}
          >
            <Icon name="chevron-down" size="sm" />
          </button>
          <button
            type="button"
            className="editor-action-btn"
            data-testid={`editor-card-duplicate-${card.id}`}
            aria-label="Duplicate card"
            onClick={onDuplicate}
          >
            <Icon name="copy" size="sm" />
          </button>
          <button
            type="button"
            className="editor-action-btn is-danger"
            data-testid={`editor-card-delete-${card.id}`}
            aria-label="Delete card"
            onClick={onDelete}
          >
            <Icon name="trash" size="sm" />
          </button>
        </div>
      </div>

      {warningMessage && (
        <div className="editor-row-warning" data-testid={`editor-card-warning-${card.id}`}>
          <Icon name="info" size="sm" />
          <span>{warningMessage}</span>
        </div>
      )}

      <div className="editor-row-fields">
        {/* FRONT / TERM FIELD */}
        <div className="editor-field-column">
          <div className="editor-field-toolbar">
            <span className="editor-field-label">Term / Prompt</span>
            <SegmentedControl
              size="sm"
              options={modeOptions}
              value={card.frontMode}
              onChange={(val) =>
                onUpdate((c) => ({ ...c, frontMode: val as 'text' | 'math' | 'mixed' }))
              }
            />
          </div>
          <div className="editor-field-body">
            {card.frontMode === 'math' ? (
              <MathLiveField
                value={card.frontText}
                onChange={(latex) => onUpdate((c) => ({ ...c, frontText: latex }))}
                placeholder="Enter LaTeX math formula..."
              />
            ) : (
              <textarea
                className="editor-textarea"
                rows={3}
                data-testid={`editor-term-input-${card.id}`}
                placeholder="Enter question, term, or prompt..."
                value={card.frontText}
                onChange={(e) => onUpdate((c) => ({ ...c, frontText: e.target.value }))}
              />
            )}
          </div>
        </div>

        {/* BACK / ANSWER FIELD */}
        <div className="editor-field-column" ref={answerRef}>
          <div className="editor-field-toolbar">
            <span className="editor-field-label">Answer / Definition</span>
            <SegmentedControl
              size="sm"
              options={modeOptions}
              value={card.answerMode}
              onChange={(val) =>
                onUpdate((c) => ({ ...c, answerMode: val as 'text' | 'math' | 'mixed' }))
              }
            />
          </div>
          <div
            className="editor-field-body"
            onFocus={() => setIsAnswerFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsAnswerFocused(false);
              }
            }}
          >
            {card.answerMode === 'math' ? (
              !isAnswerFocused && card.answerText ? (
                <div
                  className="editor-static-math-preview"
                  onClick={() => setIsAnswerFocused(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setIsAnswerFocused(true);
                    }
                  }}
                >
                  <MathDisplay latex={card.answerText} displayMode />
                </div>
              ) : (
                <MathLiveField
                  value={card.answerText}
                  onChange={(latex) => onUpdate((c) => ({ ...c, answerText: latex }))}
                  placeholder="Enter math answer in LaTeX..."
                />
              )
            ) : (
              <textarea
                className="editor-textarea"
                rows={3}
                data-testid={`editor-answer-input-${card.id}`}
                placeholder="Enter answer definition..."
                value={card.answerText}
                onChange={(e) => onUpdate((c) => ({ ...c, answerText: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && index === totalCards - 1) {
                    e.preventDefault();
                    onEnterInLastField();
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE DETAILS (ALTERNATES, HINT, EXPLANATION) */}
      <div className="editor-details-section">
        <button
          type="button"
          className="editor-details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Icon name={showDetails ? 'chevron-up' : 'chevron-down'} size="sm" />
          <span>Details (accepted alternates, hint, explanation)</span>
        </button>

        {showDetails && (
          <div className="editor-details-content">
            <div className="editor-details-alternates">
              <span className="editor-sublabel">Accepted Alternate Answers</span>
              {card.acceptedAnswers.map((alt, altIdx) => (
                <div key={altIdx} className="editor-alt-row">
                  <input
                    type="text"
                    className="editor-subinput"
                    value={alt}
                    placeholder={`Alternate Answer #${altIdx + 1}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdate((c) => {
                        const next = [...c.acceptedAnswers];
                        next[altIdx] = val;
                        return { ...c, acceptedAnswers: next };
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="editor-remove-alt-btn"
                    onClick={() => {
                      onUpdate((c) => ({
                        ...c,
                        acceptedAnswers: c.acceptedAnswers.filter((_, i) => i !== altIdx),
                      }));
                    }}
                  >
                    <Icon name="x" size="sm" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onUpdate((c) => ({
                    ...c,
                    acceptedAnswers: [...c.acceptedAnswers, ''],
                  }))
                }
              >
                + Alternate Answer
              </Button>
            </div>

            <div className="editor-details-meta-grid">
              <div>
                <label className="editor-sublabel">Hint (Collapsed by default in Study)</label>
                <input
                  type="text"
                  className="editor-subinput"
                  placeholder="Optional hint..."
                  value={card.hint}
                  onChange={(e) => onUpdate((c) => ({ ...c, hint: e.target.value }))}
                />
              </div>
              <div>
                <label className="editor-sublabel">Explanation</label>
                <input
                  type="text"
                  className="editor-subinput"
                  placeholder="Optional context or step-by-step notes..."
                  value={card.explanation}
                  onChange={(e) => onUpdate((c) => ({ ...c, explanation: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIVE ANSWER CHECKER */}
      <EditorTestAnswer
        cardId={card.id}
        expectedAnswer={card.answerText}
        mode={card.answerMode}
        acceptedAlternates={card.acceptedAnswers}
      />
    </div>
  );
}
