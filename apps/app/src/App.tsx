import React, { useState, useCallback, useEffect } from 'react';
import { registry, type Verdict, type TermDefinition } from '@formulaflash/core';
import { MathDisplay } from './components/MathDisplay.tsx';
import { VirtualMathToolbar } from './components/VirtualMathToolbar.tsx';
import { MathLiveField } from './components/MathLiveField.tsx';
import { FlashcardViewer } from './components/FlashcardViewer.tsx';
import { CardCreatorModal } from './components/CardCreatorModal.tsx';
import { SetSelectorModal } from './components/SetSelectorModal.tsx';
import { SettingsModal, loadSettings, applyTheme, type AppSettings, type TermDefinitionsSetting } from './components/SettingsModal.tsx';
import { SetGlossaryModal } from './components/SetGlossaryModal.tsx';
import { InteractiveEquation } from './components/InteractiveEquation.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import {
  loadSets,
  saveSet,
  saveCard,
  deleteCard,
  saveSetGlossary,
  type FlashcardSet,
} from './data/storage.ts';
import type { FlashcardItem } from './data/sample-deck.ts';

type AppMode = 'study' | 'learn' | 'analytics';

interface ToastState {
  message: string;
  onUndo?: () => void;
}

export const App: React.FC = () => {
  const [sets, setSets] = useState<FlashcardSet[]>(() => loadSets());
  const [activeSetId, setActiveSetId] = useState<string>(() => loadSets()[0]?.id || 'cfd-complete-reference');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<AppMode>('learn');
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showLearnTermsHint, setShowLearnTermsHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [toast, setToast] = useState<ToastState | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = loadSettings();
    applyTheme(loaded.theme);
    return loaded;
  });

  // Per-session override for term definitions mode
  const [sessionTermsMode, setSessionTermsMode] = useState<TermDefinitionsSetting | null>(null);

  const [showCardCreator, setShowCardCreator] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardItem | undefined>(undefined);
  const [showSetSelector, setShowSetSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];
  const deck = activeSet?.cards || [];
  const currentCard = deck[currentIndex];

  // Resolve active term definitions mode: session override > settings
  const effectiveTermsMode: TermDefinitionsSetting = sessionTermsMode || settings.termDefinitionsMode;

  const showToastNotification = useCallback((message: string, onUndo?: () => void): void => {
    setToast({ message, onUndo });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const handleNext = useCallback((): void => {
    if (deck.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % deck.length);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
    setShowLearnTermsHint(false);
    setIsFlipped(false);
  }, [deck.length]);

  const handlePrev = useCallback((): void => {
    if (deck.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
    setShowLearnTermsHint(false);
    setIsFlipped(false);
  }, [deck.length]);

  const handleInsertSnippet = useCallback((snippet: string): void => {
    setUserAnswer((prev) => prev + snippet);
  }, []);

  const handleCheckAnswer = useCallback((): void => {
    if (!userAnswer.trim() || !currentCard) return;

    const checker = registry.getChecker('math');
    if (!checker) return;

    const result = checker.check(userAnswer.trim(), currentCard.latexAnswer, {
      accentsMatter: settings.accentsMatter,
      greekVariantsEqual: settings.greekVariantsEqual,
      allowSideSwap: settings.allowSideSwap,
    });
    setVerdict(result);
    setScore((prev) => ({
      correct: prev.correct + (result.correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [userAnswer, currentCard, settings]);

  const handleShowAnswer = useCallback((): void => {
    setVerdict({
      correct: false,
      via: 'normalized',
      message: 'Revealed answer',
    });
  }, []);

  const handleCreateSet = (name: string, category: string): void => {
    const newSet: FlashcardSet = {
      id: crypto.randomUUID(),
      name,
      category,
      cards: [],
      glossary: {},
    };
    saveSet(newSet);
    const updated = loadSets();
    setSets(updated);
    setActiveSetId(newSet.id);
    setCurrentIndex(0);
    showToastNotification(`Created deck "${name}"`);
  };

  const handleSaveCard = (card: FlashcardItem): void => {
    saveCard(activeSetId, card);
    setSets(loadSets());
    setEditingCard(undefined);
    showToastNotification(`Card "${card.title}" saved`);
  };

  const handleBulkAddCards = (cards: FlashcardItem[]): void => {
    for (const card of cards) {
      saveCard(activeSetId, card);
    }
    setSets(loadSets());
    showToastNotification(`Imported ${cards.length} cards`);
  };

  const handleDeleteCard = (cardId: string): void => {
    const cardToDelete = deck.find((c) => c.id === cardId);
    if (!cardToDelete) return;

    deleteCard(activeSetId, cardId);
    setSets(loadSets());
    setCurrentIndex((prev) => Math.max(0, Math.min(prev, deck.length - 2)));

    showToastNotification(`Card deleted`, () => {
      saveCard(activeSetId, cardToDelete);
      setSets(loadSets());
    });
  };

  const handleSaveSetGlossary = (newGlossary: Record<string, TermDefinition>): void => {
    saveSetGlossary(activeSetId, newGlossary);
    setSets(loadSets());
  };

  const handleApplyTermToSetGlossary = (term: TermDefinition): void => {
    const currentGlossary = activeSet.glossary || {};
    const updatedGlossary = { ...currentGlossary, [term.symbol]: term };
    handleSaveSetGlossary(updatedGlossary);
    showToastNotification(`Added "${term.symbol}" to deck glossary`);
  };

  const handleApplyGlossaryDefinitionToCards = (symbol: string, term: TermDefinition): void => {
    const currentSets = loadSets();
    const setIdx = currentSets.findIndex((s) => s.id === activeSetId);
    if (setIdx >= 0) {
      for (const card of currentSets[setIdx].cards) {
        if (!card.terms) card.terms = [];
        const existing = card.terms.find((t) => t.symbol === symbol);
        if (!existing || !existing.definition) {
          if (existing) {
            existing.name = term.name;
            existing.definition = term.definition;
            existing.units = term.units;
          } else {
            card.terms.push(term);
          }
        }
      }
      saveSet(currentSets[setIdx]);
      setSets(loadSets());
      showToastNotification(`Copied definition of "${symbol}" to cards`);
    }
  };

  const progressPercent = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  return (
    <>
      <header className="app-header" role="banner">
        <div className="brand">
          <h1 className="brand-title">Formula Flash</h1>
        </div>

        <nav className="header-actions" aria-label="Deck and Settings Navigation">
          <button
            type="button"
            data-testid="nav-decks-btn"
            className="header-btn"
            onClick={() => setShowSetSelector(true)}
            aria-label="Select Deck"
          >
            Decks
          </button>
          <button
            type="button"
            data-testid="nav-glossary-btn"
            className="header-btn"
            onClick={() => setShowGlossaryModal(true)}
            aria-label="Deck Glossary"
          >
            Glossary
          </button>
          <button
            type="button"
            data-testid="nav-add-card-btn"
            className="header-btn"
            onClick={() => {
              setEditingCard(undefined);
              setShowCardCreator(true);
            }}
            aria-label="Add Card"
          >
            + Card
          </button>
          <button
            type="button"
            data-testid="nav-settings-btn"
            className="header-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            Settings
          </button>
        </nav>

        <div className="mode-toggle" role="tablist" aria-label="Study modes">
          <button
            type="button"
            role="tab"
            data-testid="mode-tab-learn"
            aria-selected={mode === 'learn'}
            className={`mode-tab ${mode === 'learn' ? 'active' : ''}`}
            onClick={() => setMode('learn')}
          >
            Learn
          </button>
          <button
            type="button"
            role="tab"
            data-testid="mode-tab-study"
            aria-selected={mode === 'study'}
            className={`mode-tab ${mode === 'study' ? 'active' : ''}`}
            onClick={() => setMode('study')}
          >
            Cards
          </button>
          <button
            type="button"
            role="tab"
            data-testid="mode-tab-analytics"
            aria-selected={mode === 'analytics'}
            className={`mode-tab ${mode === 'analytics' ? 'active' : ''}`}
            onClick={() => setMode('analytics')}
          >
            Analytics
          </button>
        </div>
      </header>

      <main className="app-main">
        {deck.length === 0 ? (
          <section className="flashcard" style={{ textAlign: 'center', padding: '40px 20px', justifyContent: 'center' }}>
            <h2 className="card-title">This deck is empty</h2>
            <p className="card-prompt" style={{ marginBottom: '24px' }}>
              Add equations or terms to start practicing in Learn or Flashcard mode.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                data-testid="empty-add-card-btn"
                className="btn-primary"
                style={{ flex: 'none', minWidth: '180px' }}
                onClick={() => {
                  setEditingCard(undefined);
                  setShowCardCreator(true);
                }}
              >
                Add Your First Card
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="deck-meta" aria-label="Deck details">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="deck-tag">{activeSet?.name}</span>
                <span className="deck-tag">{currentCard.category}</span>
                {/* Quick session toggle for terms mode */}
                <button
                  type="button"
                  data-testid="session-terms-mode-toggle"
                  className="toolbar-btn"
                  style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
                  title="Toggle term definitions mode for this session"
                  onClick={() => {
                    const modes: TermDefinitionsSetting[] = ['on-request', 'after-answer', 'hint-before-answer', 'off'];
                    const currentIdx = modes.indexOf(effectiveTermsMode);
                    const nextMode = modes[(currentIdx + 1) % modes.length];
                    setSessionTermsMode(nextMode);
                    showToastNotification(`Terms mode: ${nextMode}`);
                  }}
                >
                  Terms: {effectiveTermsMode}
                </button>
              </div>
              <span className="card-counter">
                Card {currentIndex + 1} of {deck.length}
              </span>
            </section>

            <div
              className="progress-bar-container"
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Session progress"
            >
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            {mode === 'analytics' ? (
              <AnalyticsView
                stats={{
                  mastered: score.correct,
                  proficient: 0,
                  familiar: Math.max(0, score.total - score.correct),
                  unseen: Math.max(0, deck.length - score.total),
                }}
                totalSessions={score.total > 0 ? 1 : 0}
                streakDays={1}
              />
            ) : mode === 'study' ? (
              <section className="flashcard-wrapper" aria-label="Flashcard Viewer">
                <FlashcardViewer
                  card={currentCard}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  setGlossary={activeSet?.glossary}
                  termDefinitionsMode={effectiveTermsMode}
                  onEditTerms={() => {
                    setEditingCard(currentCard);
                    setShowCardCreator(true);
                  }}
                />
                <div className="nav-controls" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    data-testid="study-prev-btn"
                    className="btn-secondary"
                    onClick={handlePrev}
                    aria-label="Previous card"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    data-testid="study-flip-btn"
                    className="btn-primary"
                    onClick={() => setIsFlipped(!isFlipped)}
                    aria-label="Flip Card"
                  >
                    Flip Card
                  </button>
                  <button
                    type="button"
                    data-testid="study-next-btn"
                    className="btn-secondary"
                    onClick={handleNext}
                    aria-label="Next card"
                  >
                    Next
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    data-testid="study-edit-btn"
                    className="btn-secondary"
                    style={{ flex: 'none', height: '38px', minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      setEditingCard(currentCard);
                      setShowCardCreator(true);
                    }}
                  >
                    Edit Card
                  </button>
                  <button
                    type="button"
                    data-testid="study-delete-btn"
                    className="btn-danger"
                    style={{ flex: 'none', height: '38px', minHeight: '38px', fontSize: '13px' }}
                    onClick={() => handleDeleteCard(currentCard.id)}
                  >
                    Delete Card
                  </button>
                </div>
              </section>
            ) : (
              <section className="learn-panel" aria-label="Learn Interactive Mode">
                <article className="flashcard" style={{ minHeight: 'auto' }}>
                  <div className="card-body" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                    <h2 className="card-title">{currentCard.title}</h2>
                    <p className="card-prompt">{currentCard.prompt}</p>

                    {/* Hint before answering / on-request peek for terms */}
                    {effectiveTermsMode === 'hint-before-answer' && (
                      <div style={{ marginTop: '12px', width: '100%' }}>
                        <button
                          type="button"
                          data-testid="learn-terms-hint-btn"
                          className="toolbar-btn"
                          style={{ fontSize: '12px', padding: '4px 8px', marginBottom: '6px' }}
                          onClick={() => setShowLearnTermsHint(!showLearnTermsHint)}
                        >
                          {showLearnTermsHint ? 'Hide Terms Hint' : '💡 Peek Term Names & Definitions'}
                        </button>
                        {showLearnTermsHint && (
                          <InteractiveEquation
                            latex={currentCard.latexAnswer}
                            cardTerms={currentCard.terms}
                            setGlossary={activeSet?.glossary}
                            hideSymbolsInitially={true}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </article>

                {showHint && currentCard.hint && (
                  <aside className="hint-box" role="note" aria-label="Hint">
                    <strong>Hint: </strong>
                    {currentCard.hint}
                  </aside>
                )}

                <div className="input-container">
                  <label htmlFor="math-answer-input" className="input-label">
                    Type Equation (LaTeX / ASCII)
                  </label>
                  <MathLiveField
                    data-testid="learn-answer-input"
                    value={userAnswer}
                    onChange={setUserAnswer}
                    placeholder="e.g. PV = nRT"
                    className="math-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckAnswer();
                      }
                    }}
                  />

                  <VirtualMathToolbar onInsert={handleInsertSnippet} />

                  <div className="preview-card" aria-label="Equation preview">
                    {userAnswer.trim() ? (
                      <MathDisplay latex={userAnswer} display={false} />
                    ) : (
                      <span className="preview-placeholder">Live equation preview appears here</span>
                    )}
                  </div>
                </div>

                {verdict ? (
                  <div
                    className={`verdict-card ${verdict.correct ? 'correct' : 'incorrect'}`}
                    role="alert"
                  >
                    <div className="verdict-header">
                      {verdict.correct ? '✓ Correct' : '✗ Not quite right'}
                    </div>
                    <div className="verdict-detail">
                      {verdict.correct ? (
                        <span>
                          Verified via <strong>{verdict.via}</strong> equivalence
                          {verdict.via === 'structural' && ' (algebraic AST match)'}.
                        </span>
                      ) : (
                        <div className="verdict-compare">
                          <div className="verdict-compare-box">
                            <strong>Expected Answer:</strong>
                            {effectiveTermsMode !== 'off' ? (
                              <InteractiveEquation
                                latex={currentCard.latexAnswer}
                                cardTerms={currentCard.terms}
                                setGlossary={activeSet?.glossary}
                                autoShowTerms={effectiveTermsMode === 'after-answer'}
                                onEditCardTerms={() => {
                                  setEditingCard(currentCard);
                                  setShowCardCreator(true);
                                }}
                              />
                            ) : (
                              <MathDisplay latex={currentCard.latexAnswer} display={false} />
                            )}
                          </div>
                          {userAnswer && (
                            <div className="verdict-compare-box">
                              <strong>Your Input:</strong>
                              <MathDisplay latex={userAnswer} display={false} />
                            </div>
                          )}
                          {currentCard.explanation && (
                            <div className="card-explanation">
                              <strong>Note: </strong>
                              {currentCard.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      data-testid="verdict-continue-btn"
                      className="btn-primary"
                      style={{ marginTop: '8px' }}
                      onClick={handleNext}
                    >
                      {verdict.correct ? 'Next Card' : 'Continue'}
                    </button>
                  </div>
                ) : (
                  <div className="nav-controls">
                    {currentCard.hint && (
                      <button
                        type="button"
                        data-testid="learn-hint-btn"
                        className="btn-secondary"
                        onClick={() => setShowHint(!showHint)}
                      >
                        {showHint ? 'Hide Hint' : 'Hint'}
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="learn-reveal-btn"
                      className="btn-secondary"
                      onClick={handleShowAnswer}
                    >
                      Reveal
                    </button>
                    <button
                      type="button"
                      data-testid="learn-check-btn"
                      className="btn-primary"
                      disabled={!userAnswer.trim()}
                      onClick={handleCheckAnswer}
                    >
                      Check Answer
                    </button>
                  </div>
                )}

                <div className="nav-controls" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    data-testid="learn-prev-btn"
                    className="btn-secondary"
                    onClick={handlePrev}
                  >
                    Previous
                  </button>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    Score: {score.correct} / {score.total}
                  </div>
                  <button
                    type="button"
                    data-testid="learn-next-btn"
                    className="btn-secondary"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Undo / Feedback Toast */}
      {toast && (
        <aside className="toast-container" role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              type="button"
              data-testid="toast-undo-btn"
              className="toast-btn"
              onClick={() => {
                toast.onUndo?.();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </aside>
      )}

      {showCardCreator && (
        <CardCreatorModal
          initialCard={editingCard}
          onSave={handleSaveCard}
          onBulkAdd={handleBulkAddCards}
          onApplyTermToSetGlossary={handleApplyTermToSetGlossary}
          onClose={() => {
            setShowCardCreator(false);
            setEditingCard(undefined);
          }}
        />
      )}

      {showSetSelector && (
        <SetSelectorModal
          sets={sets}
          activeSetId={activeSetId}
          onSelectSet={(id) => {
            setActiveSetId(id);
            setCurrentIndex(0);
          }}
          onCreateSet={handleCreateSet}
          onClose={() => setShowSetSelector(false)}
        />
      )}

      {showGlossaryModal && (
        <SetGlossaryModal
          activeSet={activeSet}
          onSaveGlossary={handleSaveSetGlossary}
          onApplyDefinitionToCards={handleApplyGlossaryDefinitionToCards}
          onClose={() => setShowGlossaryModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          currentSettings={settings}
          onSave={(newSettings) => setSettings(newSettings)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default App;
