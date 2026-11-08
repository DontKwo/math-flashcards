import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { MathDisplay } from './MathDisplay.tsx';
import type { FlashcardItem } from '../data/sample-deck.ts';
import type { TermDefinition } from '@formulaflash/core';
import {
  detectFormulaTerms,
  diffTerms,
  getSuggestionsForSymbol,
  normalizeSymbolKey,
} from '@formulaflash/core';

export interface CardCreatorModalProps {
  onSave: (card: FlashcardItem) => void;
  onClose: () => void;
  initialCard?: FlashcardItem;
  existingCards?: FlashcardItem[];
  onBulkAdd?: (cards: FlashcardItem[]) => void;
  onDeleteCard?: (cardId: string) => void;
  onApplyTermToSetGlossary?: (term: TermDefinition) => void;
}

interface MathToolbarCategory {
  name: string;
  items: Array<{ label: string; snippet: string; title: string }>;
}

const TOOLBAR_CATEGORIES: MathToolbarCategory[] = [
  {
    name: 'Basics',
    items: [
      { label: 'a/b', snippet: '\\frac{a}{b}', title: 'Fraction' },
      { label: 'xⁿ', snippet: '^{n}', title: 'Exponent' },
      { label: 'xₙ', snippet: '_{n}', title: 'Subscript' },
      { label: '√x', snippet: '\\sqrt{x}', title: 'Square Root' },
      { label: '·', snippet: ' \\cdot ', title: 'Multiply' },
      { label: '×', snippet: ' \\times ', title: 'Cross / Multiply' },
      { label: '±', snippet: '\\pm ', title: 'Plus-Minus' },
      { label: '≈', snippet: '\\approx ', title: 'Approximately' },
      { label: '≤', snippet: '\\leq ', title: 'Less Than or Equal' },
      { label: '≥', snippet: '\\geq ', title: 'Greater Than or Equal' },
      { label: '( )', snippet: '()', title: 'Parentheses' },
    ],
  },
  {
    name: 'Calculus & Vectors',
    items: [
      { label: '∫', snippet: '\\int ', title: 'Integral' },
      { label: '∑', snippet: '\\sum ', title: 'Summation' },
      { label: '∂', snippet: '\\partial ', title: 'Partial Derivative' },
      { label: '∇', snippet: '\\nabla ', title: 'Nabla / Del' },
      { label: 'x̂', snippet: '\\hat{x}', title: 'Hat / Unit Vector' },
      { label: 'x̄', snippet: '\\bar{x}', title: 'Bar / Mean' },
      { label: 'v⃗', snippet: '\\vec{v}', title: 'Vector Arrow' },
      { label: 'ẋ', snippet: '\\dot{x}', title: 'Time Derivative (dot)' },
      { label: 'Δ', snippet: '\\Delta ', title: 'Delta / Change' },
    ],
  },
  {
    name: 'Greek & Symbols',
    items: [
      { label: 'π', snippet: '\\pi ', title: 'Pi' },
      { label: 'θ', snippet: '\\theta ', title: 'Theta' },
      { label: 'ρ', snippet: '\\rho ', title: 'Rho' },
      { label: 'α', snippet: '\\alpha ', title: 'Alpha' },
      { label: 'β', snippet: '\\beta ', title: 'Beta' },
      { label: 'γ', snippet: '\\gamma ', title: 'Gamma' },
      { label: 'λ', snippet: '\\lambda ', title: 'Lambda' },
      { label: 'μ', snippet: '\\mu ', title: 'Mu' },
      { label: 'σ', snippet: '\\sigma ', title: 'Sigma' },
      { label: 'ω', snippet: '\\omega ', title: 'Omega' },
      { label: '∞', snippet: '\\infty ', title: 'Infinity' },
    ],
  },
  {
    name: 'Matrices',
    items: [
      {
        label: '2×2',
        snippet: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        title: '2x2 Matrix',
      },
      {
        label: 'Vector',
        snippet: '\\begin{pmatrix} x \\\\ y \\end{pmatrix}',
        title: 'Column Vector',
      },
    ],
  },
];

const DRAFT_KEY = 'formulaflash_card_creator_draft';

export const CardCreatorModal: React.FC<CardCreatorModalProps> = ({
  onSave,
  onClose,
  initialCard,
  onBulkAdd,
  onApplyTermToSetGlossary,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [activeCategory, setActiveCategory] = useState<string>('Basics');

  // Single card form fields
  const [title, setTitle] = useState(initialCard?.title || '');
  const [category, setCategory] = useState(initialCard?.category || '');
  const [prompt, setPrompt] = useState(initialCard?.prompt || '');
  const [latexAnswer, setLatexAnswer] = useState(initialCard?.latexAnswer || '');
  const [hint, setHint] = useState(initialCard?.hint || '');
  const [explanation, setExplanation] = useState(initialCard?.explanation || '');
  const [terms, setTerms] = useState<TermDefinition[]>(initialCard?.terms || []);
  const [manualSymbolInput, setManualSymbolInput] = useState('');

  // Bulk add state
  const [bulkText, setBulkText] = useState('');
  const [bulkDelimiter, setBulkDelimiter] = useState('\t'); // tab default (Quizlet paste)
  const [validationError, setValidationError] = useState<string | null>(null);

  const mathInputRef = useRef<HTMLTextAreaElement>(null);

  // Restore draft if creating a new card
  useEffect(() => {
    if (!initialCard) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.prompt) setPrompt(parsed.prompt);
          if (parsed.latexAnswer) setLatexAnswer(parsed.latexAnswer);
          if (parsed.hint) setHint(parsed.hint);
          if (parsed.explanation) setExplanation(parsed.explanation);
          if (parsed.terms) setTerms(parsed.terms);
        } catch {
          // Ignore draft parse errors
        }
      }
    }
  }, [initialCard]);

  // Autosave draft on change
  useEffect(() => {
    if (!initialCard && (title || prompt || latexAnswer)) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, category, prompt, latexAnswer, hint, explanation, terms })
      );
    }
  }, [title, category, prompt, latexAnswer, hint, explanation, terms, initialCard]);

  // Validate KaTeX syntax live
  useEffect(() => {
    if (!latexAnswer.trim()) {
      setValidationError(null);
      return;
    }
    try {
      katex.renderToString(latexAnswer, { throwOnError: true });
      setValidationError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = msg.replace('KaTeX parse error: ', '');
      setValidationError(friendly);
    }
  }, [latexAnswer]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const insertSnippet = (snippet: string): void => {
    const textarea = mathInputRef.current;
    if (!textarea) {
      setLatexAnswer((prev) => prev + snippet);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = latexAnswer.substring(0, start);
    const after = latexAnswer.substring(end);
    const nextVal = before + snippet + after;
    setLatexAnswer(nextVal);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + snippet.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Term detection & diffing
  const diff = diffTerms(latexAnswer, terms);
  const definedCount = terms.filter((t) => t.definition && t.definition.trim().length > 0).length;

  const handleDetectTerms = (): void => {
    const detected = detectFormulaTerms(latexAnswer);
    const nextTerms: TermDefinition[] = [...terms];

    for (const sym of detected) {
      const k = normalizeSymbolKey(sym);
      if (!nextTerms.some((t) => normalizeSymbolKey(t.symbol) === k)) {
        const suggestions = getSuggestionsForSymbol(sym);
        const best = suggestions[0];
        nextTerms.push({
          symbol: sym,
          name: best?.name || '',
          definition: best?.definition || '',
          units: best?.units || '',
        });
      }
    }
    setTerms(nextTerms);
  };

  const handleAddManualTerm = (): void => {
    const sym = manualSymbolInput.trim();
    if (!sym) return;
    const k = normalizeSymbolKey(sym);
    if (!terms.some((t) => normalizeSymbolKey(t.symbol) === k)) {
      setTerms([...terms, { symbol: sym, name: '', definition: '', units: '' }]);
      setManualSymbolInput('');
    }
  };

  const handleRemoveTerm = (index: number): void => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  const handleUpdateTerm = (index: number, updated: TermDefinition): void => {
    const next = [...terms];
    next[index] = updated;
    setTerms(next);
  };

  const handleRemoveStaleTerms = (): void => {
    const staleKeys = new Set(diff.stale.map((s) => normalizeSymbolKey(s.symbol)));
    setTerms(terms.filter((t) => !staleKeys.has(normalizeSymbolKey(t.symbol))));
  };

  const handleMoveTerm = (index: number, direction: 'up' | 'down'): void => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= terms.length) return;
    const next = [...terms];
    const temp = next[index];
    next[index] = next[newIdx];
    next[newIdx] = temp;
    setTerms(next);
  };

  const handleSave = (addAnother = false): void => {
    if (!title.trim() || !prompt.trim() || !latexAnswer.trim()) return;

    const newCard: FlashcardItem = {
      id: initialCard?.id || crypto.randomUUID(),
      title: title.trim(),
      category: category.trim() || 'General',
      prompt: prompt.trim(),
      latexAnswer: latexAnswer.trim(),
      hint: hint.trim(),
      explanation: explanation.trim(),
      terms: terms.length > 0 ? terms : undefined,
    };

    onSave(newCard);
    localStorage.removeItem(DRAFT_KEY);

    if (addAnother) {
      setTitle('');
      setPrompt('');
      setLatexAnswer('');
      setHint('');
      setExplanation('');
      setTerms([]);
      const titleInput = document.getElementById('card-title');
      if (titleInput) titleInput.focus();
    } else {
      onClose();
    }
  };

  const handleBulkImport = (): void => {
    if (!bulkText.trim() || !onBulkAdd) return;
    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const created: FlashcardItem[] = [];

    for (const line of lines) {
      const parts = line.split(bulkDelimiter);
      if (parts.length >= 2) {
        created.push({
          id: crypto.randomUUID(),
          title: parts[0].trim(),
          prompt: parts[0].trim(),
          latexAnswer: parts[1].trim(),
          category: category.trim() || 'General',
          hint: parts[2]?.trim() || '',
          explanation: parts[3]?.trim() || '',
        });
      }
    }

    if (created.length > 0) {
      onBulkAdd(created);
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-creator-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '720px', width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 id="card-creator-dialog-title" className="modal-title">
              {initialCard ? 'Edit Flashcard' : 'Add Flashcards'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="segmented-control" role="group" aria-label="Creation Mode">
              <button
                type="button"
                data-testid="creator-tab-single-btn"
                className={`segmented-btn ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                Single Card
              </button>
              <button
                type="button"
                data-testid="creator-tab-bulk-btn"
                className={`segmented-btn ${activeTab === 'bulk' ? 'active' : ''}`}
                onClick={() => setActiveTab('bulk')}
              >
                Bulk Paste
              </button>
            </div>

            <button
              type="button"
              data-testid="creator-close-btn"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
        </div>

        {activeTab === 'single' ? (
          <div className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label htmlFor="card-title">Card Title *</label>
                <input
                  id="card-title"
                  data-testid="creator-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ideal Gas Law"
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="card-category">Category / Topic</label>
                <input
                  id="card-category"
                  data-testid="creator-category-input"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Thermodynamics"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="card-prompt">Question / Prompt *</label>
              <textarea
                id="card-prompt"
                data-testid="creator-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="State the equation relating pressure, volume, moles and temperature..."
                rows={2}
              />
            </div>

            {/* Equation Editor */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="card-answer-input">Equation Answer (LaTeX / Math) *</label>
                <span className="input-helper">Live preview updates as you type</span>
              </div>

              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', overflowX: 'auto' }}>
                {TOOLBAR_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    data-testid={`creator-toolbar-cat-${idx}`}
                    className={`segmented-btn ${activeCategory === cat.name ? 'active' : ''}`}
                    style={{ fontSize: '12px', padding: '4px 8px', minHeight: '32px' }}
                    onClick={() => setActiveCategory(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="math-toolbar" role="toolbar" aria-label="Math insertion buttons">
                {TOOLBAR_CATEGORIES.find((c) => c.name === activeCategory)?.items.map((item, idx) => (
                  <button
                    key={item.label}
                    type="button"
                    data-testid={`creator-toolbar-item-${idx}`}
                    className="toolbar-btn"
                    title={item.title}
                    onClick={() => insertSnippet(item.snippet)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                id="card-answer-input"
                data-testid="creator-answer-input"
                ref={mathInputRef}
                value={latexAnswer}
                onChange={(e) => setLatexAnswer(e.target.value)}
                placeholder="e.g. PV = nRT or \frac{1}{2}mv^2"
                rows={3}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  lineHeight: '1.4',
                  resize: 'vertical',
                }}
              />

              {validationError && (
                <div style={{ color: 'var(--error)', fontSize: '13px', display: 'flex', gap: '6px' }}>
                  <span>⚠️ Syntax notice:</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Live Preview */}
              <div className="preview-card" style={{ minHeight: '56px' }}>
                {latexAnswer.trim() ? (
                  <MathDisplay latex={latexAnswer} display={true} />
                ) : (
                  <span className="preview-placeholder">Live rendered equation preview appears here</span>
                )}
              </div>
            </div>

            {/* Terms Section */}
            <div className="settings-section" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span className="settings-section-title" style={{ fontSize: '15px' }}>Term Definitions</span>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {terms.length > 0 ? `${definedCount} of ${terms.length} terms defined` : 'Define variables and parameters in this formula'}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="creator-detect-terms-btn"
                  className="btn-secondary"
                  style={{ minHeight: '34px', height: '34px', fontSize: '13px', padding: '0 12px' }}
                  onClick={handleDetectTerms}
                  disabled={!latexAnswer.trim()}
                >
                  Detect Terms
                </button>
              </div>

              {/* Stale Terms Notice */}
              {diff.stale.length > 0 && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--error)' }}>
                    ⚠️ {diff.stale.length} term(s) no longer in formula: {diff.stale.map((s) => s.symbol).join(', ')}
                  </span>
                  <button
                    type="button"
                    data-testid="creator-remove-stale-btn"
                    className="btn-secondary"
                    style={{ minHeight: '26px', height: '26px', fontSize: '11px', padding: '0 8px' }}
                    onClick={handleRemoveStaleTerms}
                  >
                    Remove Stale
                  </button>
                </div>
              )}

              {/* Term Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '35vh', overflowY: 'auto' }}>
                {terms.map((term, idx) => {
                  const isDefined = !!term.definition?.trim();
                  const suggestions = getSuggestionsForSymbol(term.symbol);

                  return (
                    <div
                      key={idx}
                      data-testid={`creator-term-row-${idx}`}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: isDefined ? '1px solid var(--border)' : '1px solid rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 600, minWidth: '36px' }}>
                            <MathDisplay latex={term.symbol} display={false} />
                          </span>
                          {!isDefined && (
                            <span className="deck-tag" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', fontSize: '11px' }}>
                              Undefined
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            type="button"
                            data-testid={`creator-term-up-${idx}`}
                            className="toolbar-btn"
                            disabled={idx === 0}
                            onClick={() => handleMoveTerm(idx, 'up')}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            data-testid={`creator-term-down-${idx}`}
                            className="toolbar-btn"
                            disabled={idx === terms.length - 1}
                            onClick={() => handleMoveTerm(idx, 'down')}
                            title="Move down"
                          >
                            ↓
                          </button>
                          {onApplyTermToSetGlossary && (
                            <button
                              type="button"
                              data-testid={`creator-term-apply-glossary-${idx}`}
                              className="toolbar-btn"
                              style={{ fontSize: '11px', padding: '0 8px' }}
                              title="Add definition to set glossary"
                              onClick={() => onApplyTermToSetGlossary(term)}
                            >
                              Apply to Deck
                            </button>
                          )}
                          <button
                            type="button"
                            data-testid={`creator-term-delete-${idx}`}
                            className="toolbar-btn"
                            style={{ color: 'var(--error)' }}
                            onClick={() => handleRemoveTerm(idx)}
                            title="Remove term"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Suggestions Chips */}
                      {suggestions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Suggestions:</span>
                          {suggestions.map((sugg, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              data-testid={`creator-term-${idx}-suggestion-${sIdx}`}
                              className="toolbar-btn"
                              style={{ fontSize: '11px', padding: '2px 6px', height: 'auto' }}
                              onClick={() =>
                                handleUpdateTerm(idx, {
                                  ...term,
                                  name: sugg.name,
                                  definition: sugg.definition,
                                  units: sugg.units,
                                })
                              }
                            >
                              {sugg.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                        <input
                          type="text"
                          data-testid={`creator-term-name-${idx}`}
                          value={term.name || ''}
                          onChange={(e) => handleUpdateTerm(idx, { ...term, name: e.target.value })}
                          placeholder="Short name (e.g. Kinematic viscosity)"
                          style={{ fontSize: '13px', padding: '6px 8px' }}
                        />
                        <input
                          type="text"
                          data-testid={`creator-term-units-${idx}`}
                          value={term.units || ''}
                          onChange={(e) => handleUpdateTerm(idx, { ...term, units: e.target.value })}
                          placeholder="Units (e.g. m^2/s)"
                          style={{ fontSize: '13px', padding: '6px 8px' }}
                        />
                      </div>

                      <textarea
                        data-testid={`creator-term-definition-${idx}`}
                        value={term.definition || ''}
                        onChange={(e) => handleUpdateTerm(idx, { ...term, definition: e.target.value })}
                        placeholder="Detailed definition of this quantity..."
                        rows={2}
                        style={{ fontSize: '13px', padding: '6px 8px' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add manual term input */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  data-testid="creator-manual-symbol-input"
                  value={manualSymbolInput}
                  onChange={(e) => setManualSymbolInput(e.target.value)}
                  placeholder="Add manual symbol (e.g. \nabla or \partial)"
                  style={{ flex: 1, fontSize: '13px' }}
                />
                <button
                  type="button"
                  data-testid="creator-add-manual-term-btn"
                  className="btn-secondary"
                  style={{ minHeight: '34px', height: '34px', fontSize: '13px', padding: '0 12px' }}
                  onClick={handleAddManualTerm}
                  disabled={!manualSymbolInput.trim()}
                >
                  + Add Term
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label htmlFor="card-hint">Hint (Optional)</label>
                <input
                  id="card-hint"
                  data-testid="creator-hint-input"
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Optional progressive hint"
                />
              </div>

              <div className="input-group">
                <label htmlFor="card-explanation">Explanation / Derivation (Optional)</label>
                <input
                  id="card-explanation"
                  data-testid="creator-explanation-input"
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Shown on the back after answering"
                />
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '8px' }}>
              <button
                type="button"
                data-testid="creator-cancel-btn"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!initialCard && (
                  <button
                    type="button"
                    data-testid="creator-save-another-btn"
                    className="btn-secondary"
                    onClick={() => handleSave(true)}
                    disabled={!title.trim() || !prompt.trim() || !latexAnswer.trim()}
                  >
                    Save & Add Another
                  </button>
                )}
                <button
                  type="button"
                  data-testid="creator-save-btn"
                  className="btn-primary"
                  onClick={() => handleSave(false)}
                  disabled={!title.trim() || !prompt.trim() || !latexAnswer.trim()}
                >
                  {initialCard ? 'Save Changes' : 'Save Card'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Bulk paste tab */
          <div className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label htmlFor="bulk-delimiter">Separator between Term & Equation</label>
              <select
                id="bulk-delimiter"
                data-testid="creator-bulk-delimiter-select"
                value={bulkDelimiter}
                onChange={(e) => setBulkDelimiter(e.target.value)}
              >
                <option value="\t">Tab (Default Quizlet / Spreadsheet paste)</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
                <option value=" - ">Hyphen with spaces ( - )</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="bulk-cards-text">Paste Cards (One card per line)</label>
              <textarea
                id="bulk-cards-text"
                data-testid="creator-bulk-textarea"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Ideal Gas Law\tPV = nRT\nKinetic Energy\tE = \\frac{1}{2}mv^2\nOhm\'s Law\tV = IR'}
                rows={8}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}
              />
              <span className="input-helper">
                Format: Term &lt;delimiter&gt; Equation [&lt;delimiter&gt; Hint &lt;delimiter&gt; Explanation]
              </span>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                type="button"
                data-testid="creator-bulk-cancel-btn"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="creator-bulk-submit-btn"
                className="btn-primary"
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
              >
                Import Cards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
