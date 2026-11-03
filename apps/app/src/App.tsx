import React, { useState, useCallback, useEffect } from 'react';
import { MathDisplay } from './components/MathDisplay.tsx';
import { CardCreatorModal } from './components/CardCreatorModal.tsx';
import { SetSelectorModal } from './components/SetSelectorModal.tsx';
import { SettingsModal, loadSettings, type AppSettings } from './components/SettingsModal.tsx';
import { LearnRunner } from './components/LearnRunner.tsx';
import { loadSets, saveSet, saveCard, type FlashcardSet } from './data/storage.ts';
import type { FlashcardItem } from './data/sample-deck.ts';

type AppMode = 'study' | 'learn';

export const App: React.FC = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string>('sample-deck');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<AppMode>('learn');
  const [isFlipped, setIsFlipped] = useState(false);

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
    setIsFlipped(false);
  }, [deck.length]);

  const handlePrev = useCallback((): void => {
    if (deck.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    setIsFlipped(false);
  }, [deck.length]);

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

          {mode === 'study' || !activeSet ? (
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
            activeSet && <LearnRunner set={activeSet} onFinish={() => setMode('study')} />
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
