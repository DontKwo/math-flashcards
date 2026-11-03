import React, { useState, useCallback, useEffect } from 'react';
import { registry, type Verdict } from '@formulaflash/core';
import { MathDisplay } from './components/MathDisplay.tsx';
import { VirtualMathToolbar } from './components/VirtualMathToolbar.tsx';
import { MathLiveField } from './components/MathLiveField.tsx';
import { CardCreatorModal } from './components/CardCreatorModal.tsx';
import { SetSelectorModal } from './components/SetSelectorModal.tsx';
import { SettingsModal, loadSettings, type AppSettings } from './components/SettingsModal.tsx';
import { loadSets, saveSet, saveCard, type FlashcardSet } from './data/storage.ts';
import type { FlashcardItem } from './data/sample-deck.ts';

type AppMode = 'study' | 'learn';

export const App: React.FunctionComponent = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string>('sample-deck');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<AppMode>('learn');
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  const [showCardCreator, setShowCardCreator] = useState(false);
  const [showSetSelector, setShowSetSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadedSets = loadSets();
    setSets(loadedSets);
  }, []);

  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];
  const deck = activeSet?.cards || [];
  const currentCard = deck[currentIndex];

  const handleNext = useCallback((): void => {
    if (deck.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % deck.length);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
    setIsFlipped(false);
  }, [deck.length]);

  const handlePrev = useCallback((): void => {
    if (deck.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
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
    };
    saveSet(newSet);
    setSets(loadSets());
    setActiveSetId(newSet.id);
    setCurrentIndex(0);
  };

  const handleSaveCard = (card: FlashcardItem): void => {
    saveCard(activeSetId, card);
    setSets(loadSets());
  };

  const progressPercent = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <span className="brand-title">Formula Flash</span>
        </div>

        <div className="header-actions">
          <button type="button" className="header-btn" onClick={() => setShowSetSelector(true)}>
            Decks
          </button>
          <button type="button" className="header-btn" onClick={() => setShowCardCreator(true)}>
            Add Card
          </button>
          <button type="button" className="header-btn" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>

        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'learn'}
            className={`mode-tab ${mode === 'learn' ? 'active' : ''}`}
            onClick={() => setMode('learn')}
          >
            Learn
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'study'}
            className={`mode-tab ${mode === 'study' ? 'active' : ''}`}
            onClick={() => setMode('study')}
          >
            Cards
          </button>
        </div>
      </header>

      {deck.length === 0 ? (
        <div className="deck-meta" style={{ justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '16px' }}>This deck is empty</h2>
            <button type="button" className="btn-primary" onClick={() => setShowCardCreator(true)}>
              Add your first card
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="deck-meta">
            <div>
              <span className="deck-tag" style={{ marginRight: '8px' }}>{activeSet?.name}</span>
              <span className="deck-tag">{currentCard.category}</span>
            </div>
            <span className="card-counter">
              Card {currentIndex + 1} of {deck.length}
            </span>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          {mode === 'study' ? (
            <div className="flashcard-wrapper">
              <div
                className="flashcard"
                onClick={() => setIsFlipped(!isFlipped)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setIsFlipped(!isFlipped);
                  }
                }}
              >
                {!isFlipped ? (
                  <div className="card-body">
                    <h2 className="card-title">{currentCard.title}</h2>
                    <p className="card-prompt">{currentCard.prompt}</p>
                    <div style={{ marginTop: '20px' }}>
                      <span className="card-flip-prompt">Tap card to flip for equation</span>
                    </div>
                  </div>
                ) : (
                  <div className="card-body">
                    <span className="deck-tag" style={{ marginBottom: '8px' }}>
                      Target Equation
                    </span>
                    <div className="card-math-hero">
                      <MathDisplay latex={currentCard.latexAnswer} display={true} />
                    </div>
                    {currentCard.explanation && (
                      <div className="card-explanation">
                        <strong>Explanation: </strong>
                        {currentCard.explanation}
                      </div>
                    )}
                    <div style={{ marginTop: '16px' }}>
                      <span className="card-flip-prompt">Tap to flip back</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="nav-controls" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={handlePrev}>
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  Flip Card
                </button>
                <button type="button" className="btn-secondary" onClick={handleNext}>
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="learn-panel">
              <div className="flashcard" style={{ minHeight: 'auto' }}>
                <div className="card-body" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                  <h2 className="card-title">{currentCard.title}</h2>
                  <p className="card-prompt">{currentCard.prompt}</p>
                </div>
              </div>

              {showHint && currentCard.hint && (
                <div className="hint-box">
                  <strong>Hint: </strong>
                  {currentCard.hint}
                </div>
              )}

              <div className="input-container">
                <label htmlFor="math-answer-input" className="input-label">
                  Type Equation (LaTeX / ASCII)
                </label>
                <MathLiveField
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

                <div className="preview-card">
                  {userAnswer.trim() ? (
                    <MathDisplay latex={userAnswer} display={false} />
                  ) : (
                    <span className="preview-placeholder">Live equation preview appears here</span>
                  )}
                </div>
              </div>

              {verdict ? (
                <div className={`verdict-card ${verdict.correct ? 'correct' : 'incorrect'}`}>
                  <div className="verdict-header">
                    {verdict.correct ? 'Correct' : 'Not quite right'}
                  </div>
                  <div className="verdict-detail">
                    {verdict.correct ? (
                      <span>
                        Verified via <strong>{verdict.via}</strong> equivalence
                        {verdict.via === 'structural' && ' (algebraic AST match)'}.
                      </span>
                    ) : (
                      <div className="verdict-compare">
                        <div>
                          <span>Expected: </span>
                          <MathDisplay latex={currentCard.latexAnswer} display={false} />
                        </div>
                        {userAnswer && (
                          <div>
                            <span>You entered: </span>
                            <MathDisplay latex={userAnswer} display={false} />
                          </div>
                        )}
                        {currentCard.explanation && (
                          <div className="card-explanation" style={{ marginTop: '8px' }}>
                            {currentCard.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
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
                      className="btn-secondary"
                      onClick={() => setShowHint(!showHint)}
                    >
                      {showHint ? 'Hide Hint' : 'Hint'}
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={handleShowAnswer}>
                    Reveal
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!userAnswer.trim()}
                    onClick={handleCheckAnswer}
                  >
                    Check Answer
                  </button>
                </div>
              )}

              <div className="nav-controls" style={{ marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={handlePrev}>
                  Previous
                </button>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Session: {score.correct} / {score.total} correct
                </div>
                <button type="button" className="btn-secondary" onClick={handleNext}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showCardCreator && (
        <CardCreatorModal
          onSave={handleSaveCard}
          onClose={() => setShowCardCreator(false)}
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
