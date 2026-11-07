import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  registry,
  LearnEngine,
  SeededRng,
  type Verdict,
  type Card as CoreCard,
  type CardProgress,
  type QuestionPrompt,
  type StudySession,
  type StudyDirection,
  type RoundSummary,
} from '@formulaflash/core';
import { useRoute } from '../router/index.ts';
import { useLibrary } from '../data/useLibrary.ts';
import { MathDisplay } from '../components/MathDisplay.tsx';
import { VirtualMathToolbar } from '../components/VirtualMathToolbar.tsx';
import { MathLiveField } from '../components/MathLiveField.tsx';
import { Card, Button, ProgressBar, EmptyState, Chip } from '../ui/index.ts';
import './screens.css';

export const StudyScreen: React.FC = () => {
  const { route, navigate } = useRoute();
  const { getSet, repository, init: reloadLibrary } = useLibrary();
  const setId = route.params.id;
  const isCardsMode = route.pattern === 'study-cards';

  const [cards, setCards] = useState<CoreCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Cards Mode state
  const [cardsIndex, setCardsIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffleCards, setShuffleCards] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [swapFrontBack, setSwapFrontBack] = useState(false);

  // Learn Mode state
  const [engine, setEngine] = useState<LearnEngine | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<QuestionPrompt | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [direction, setDirection] = useState<StudyDirection>('front->back');
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundSummaryData, setRoundSummaryData] = useState<RoundSummary | null>(null);
  const [isRetypePhase, setIsRetypePhase] = useState(false);
  const [retypeValue, setRetypeValue] = useState('');

  // Keyboard navigation & double-enter guard
  const isSubmittingRef = useRef(false);

  // Touch swipe state for Cards mode
  const touchStartXRef = useRef<number | null>(null);

  // Load set, cards, and existing progress
  useEffect(() => {
    let mounted = true;
    if (setId) {
      setLoading(true);
      void (async (): Promise<void> => {
        const res = await getSet(setId);
        if (!res || !mounted) {
          if (mounted) setLoading(false);
          return;
        }

        const loadedCards = res.cards;
        setCards(loadedCards);

        // Load progress for Learn Mode
        const progressList = await repository.listProgress(setId);
        const rng = new SeededRng(Date.now() >>> 0);
        const newEngine = new LearnEngine(loadedCards, progressList, rng, {
          direction: 'front->back',
          roundSize: 5,
          retypeAfterMiss: true,
        });

        // Initialize study session record
        const newSessId = crypto.randomUUID();
        setSessionId(newSessId);
        const sessionRecord: StudySession = {
          id: newSessId,
          setIds: [setId],
          mode: isCardsMode ? 'cards' : 'learn',
          startedAt: Date.now(),
          events: [],
        };
        await repository.saveSession(sessionRecord);

        setEngine(newEngine);
        setCurrentPrompt(newEngine.getNext());
        setLoading(false);
      })();
    }
    return () => {
      mounted = false;
    };
  }, [setId, getSet, repository, isCardsMode]);

  // Learn Mode: Submit answer
  const handleSubmitAnswer = useCallback(
    async (givenAnswer: string): Promise<void> => {
      if (isSubmittingRef.current || !engine || !currentPrompt || !setId) return;
      isSubmittingRef.current = true;

      const trimmed = givenAnswer.trim();
      if (!trimmed) {
        isSubmittingRef.current = false;
        return;
      }

      const expected = currentPrompt.expectedLatexOrText;
      const checkerId = currentPrompt.card.answer.checker || 'math';
      const checker = registry.getChecker(checkerId) || registry.getChecker('math');

      // Check verdict
      let checkVerdict: Verdict;
      if (checker) {
        checkVerdict = checker.check(trimmed, expected, {
          accentsMatter: true,
          greekVariantsEqual: true,
          allowSideSwap: true,
        });
      } else {
        checkVerdict = {
          correct: trimmed === expected,
          via: trimmed === expected ? 'exact' : 'structural',
        };
      }

      setVerdict(checkVerdict);
      engine.submitAnswer(currentPrompt.card.id, checkVerdict);

      // Persist progress
      const updatedProg = engine.getProgress(currentPrompt.card.id);
      if (updatedProg) {
        await repository.saveProgress(updatedProg);
      }

      // Record study event in session
      if (sessionId) {
        const sess = await repository.getSession(sessionId);
        if (sess) {
          sess.events.push({
            cardId: currentPrompt.card.id,
            direction: currentPrompt.direction,
            qType: currentPrompt.type,
            given: trimmed,
            verdict: checkVerdict,
            ms: 1000,
            at: Date.now(),
          });
          sess.endedAt = Date.now();
          await repository.saveSession(sess);
        }
      }

      // Check if retype required on miss
      if (!checkVerdict.correct && engine.getRetypePendingCardId() === currentPrompt.card.id) {
        setIsRetypePhase(true);
        setRetypeValue('');
      }

      void reloadLibrary();
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 200);
    },
    [engine, currentPrompt, setId, repository, sessionId, reloadLibrary]
  );

  // Learn Mode: Advance to next question or show round summary
  const handleContinueNext = useCallback((): void => {
    if (!engine) return;

    if (engine.isRoundComplete()) {
      const summary = engine.getRoundSummary();
      setRoundSummaryData(summary);
      setShowRoundSummary(true);
      return;
    }

    const nextPrompt = engine.getNext();
    setCurrentPrompt(nextPrompt);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
    setIsRetypePhase(false);
    setRetypeValue('');
  }, [engine]);

  // Escape hatch: "I don't know"
  const handleIDontKnow = useCallback(async (): Promise<void> => {
    if (!engine || !currentPrompt) return;
    const failVerdict: Verdict = {
      correct: false,
      via: 'structural',
      message: 'Revealed answer',
    };
    setVerdict(failVerdict);
    engine.submitAnswer(currentPrompt.card.id, failVerdict);

    const updatedProg = engine.getProgress(currentPrompt.card.id);
    if (updatedProg) {
      await repository.saveProgress(updatedProg);
    }

    if (sessionId) {
      const sess = await repository.getSession(sessionId);
      if (sess) {
        sess.events.push({
          cardId: currentPrompt.card.id,
          direction: currentPrompt.direction,
          qType: currentPrompt.type,
          given: "I don't know",
          verdict: failVerdict,
          ms: 1000,
          at: Date.now(),
        });
        sess.endedAt = Date.now();
        await repository.saveSession(sess);
      }
    }

    setIsRetypePhase(true);
    setRetypeValue('');
    void reloadLibrary();
  }, [engine, currentPrompt, repository, sessionId, reloadLibrary]);

  // Escape hatch: "Mark my answer correct" override
  const handleOverrideCorrect = useCallback(async (): Promise<void> => {
    if (!engine || !currentPrompt) return;
    engine.overrideCorrect(currentPrompt.card.id);

    const overrideVerdict: Verdict = {
      correct: true,
      via: 'override',
      message: 'Marked correct by user',
    };
    setVerdict(overrideVerdict);
    setIsRetypePhase(false);

    const updatedProg = engine.getProgress(currentPrompt.card.id);
    if (updatedProg) {
      await repository.saveProgress(updatedProg);
    }

    if (sessionId) {
      const sess = await repository.getSession(sessionId);
      if (sess) {
        sess.events.push({
          cardId: currentPrompt.card.id,
          direction: currentPrompt.direction,
          qType: currentPrompt.type,
          given: userAnswer,
          verdict: overrideVerdict,
          ms: 1000,
          at: Date.now(),
        });
        sess.endedAt = Date.now();
        await repository.saveSession(sess);
      }
    }

    void reloadLibrary();
  }, [engine, currentPrompt, userAnswer, repository, sessionId, reloadLibrary]);

  // Learn Mode: Direction changer
  const handleDirectionChange = (newDir: StudyDirection): void => {
    setDirection(newDir);
    if (cards.length > 0) {
      void repository.listProgress(setId).then((progressList) => {
        const rng = new SeededRng(Date.now() >>> 0);
        const newEngine = new LearnEngine(cards, progressList, rng, {
          direction: newDir,
          roundSize: 5,
          retypeAfterMiss: true,
        });
        setEngine(newEngine);
        setCurrentPrompt(newEngine.getNext());
        setUserAnswer('');
        setVerdict(null);
        setShowRoundSummary(false);
      });
    }
  };

  // Cards Mode navigation & actions
  const displayedCards = React.useMemo(() => {
    let list = [...cards];
    if (starredOnly) {
      list = list.filter((c) => c.starred);
    }
    if (shuffleCards) {
      const prng = new SeededRng(42);
      list = prng.shuffle(list);
    }
    return list;
  }, [cards, starredOnly, shuffleCards]);

  const currentFlipCard = displayedCards[cardsIndex] || displayedCards[0];

  const handleNextFlipCard = useCallback((): void => {
    if (displayedCards.length === 0) return;
    setCardsIndex((prev) => (prev + 1) % displayedCards.length);
    setIsFlipped(false);
  }, [displayedCards.length]);

  const handlePrevFlipCard = useCallback((): void => {
    if (displayedCards.length === 0) return;
    setCardsIndex((prev) => (prev - 1 + displayedCards.length) % displayedCards.length);
    setIsFlipped(false);
  }, [displayedCards.length]);

  // Flashcards rate: "Know it" / "Still learning"
  const handleRateFlipCard = useCallback(
    async (knowIt: boolean): Promise<void> => {
      if (!currentFlipCard) return;
      const prog = (await repository.getProgress(currentFlipCard.id, 'front->back')) || {
        cardId: currentFlipCard.id,
        direction: 'front->back',
        learn: { level: 0, streak: 0 },
        stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
      };

      prog.stats.seen += 1;
      if (knowIt) {
        prog.stats.right += 1;
        prog.learn.streak += 1;
        prog.learn.level = Math.min(3, prog.learn.level + 1) as CardProgress['learn']['level'];
      } else {
        prog.stats.wrong += 1;
        prog.learn.streak = 0;
      }

      await repository.saveProgress(prog);
      void reloadLibrary();
      handleNextFlipCard();
    },
    [currentFlipCard, repository, reloadLibrary, handleNextFlipCard]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isCardsMode) {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped((f) => !f);
        } else if (e.key === 'ArrowRight') {
          handleNextFlipCard();
        } else if (e.key === 'ArrowLeft') {
          handlePrevFlipCard();
        }
      } else {
        // Learn mode keyboard shortcuts
        if (e.key === 'Enter') {
          if (verdict && !isRetypePhase) {
            handleContinueNext();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCardsMode, verdict, isRetypePhase, handleContinueNext, handleNextFlipCard, handlePrevFlipCard]);

  // Touch swipe support for Flip card
  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handlePrevFlipCard();
      else handleNextFlipCard();
    }
    touchStartXRef.current = null;
  };

  if (loading) {
    return <div data-testid="study-loading">Loading study session...</div>;
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        title="No cards to study"
        description="This set does not contain any cards yet."
        action={<Button onClick={() => navigate(`/set/${setId}/edit`)}>Add Cards</Button>}
        data-testid="study-empty"
      />
    );
  }

  // --- FLASHCARDS MODE ---
  if (isCardsMode) {
    const totalCount = displayedCards.length;
    const safePercent = totalCount > 0 ? ((cardsIndex + 1) / totalCount) * 100 : 0;
    const frontContent = swapFrontBack ? currentFlipCard?.back : currentFlipCard?.front;
    const backContent = swapFrontBack ? currentFlipCard?.front : currentFlipCard?.back;

    const frontText = frontContent?.map((s) => (s.t === 'text' ? s.v : s.t === 'math' ? `$${s.latex}$` : '')).join(' ') || '';
    const backLatex = backContent?.find((s) => s.t === 'math')?.t === 'math' ? (backContent.find((s) => s.t === 'math') as { latex: string }).latex : '';
    const backText = backContent?.map((s) => (s.t === 'text' ? s.v : '')).join(' ') || '';

    return (
      <div className="screen-container">
        <div className="screen-header">
          <div className="set-actions">
            <span className="set-mode-desc">
              Card {cardsIndex + 1} of {totalCount}
            </span>
          </div>
          <div className="set-actions">
            <Button
              variant={shuffleCards ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShuffleCards(!shuffleCards)}
              data-testid="study-shuffle-btn"
            >
              Shuffle
            </Button>
            <Button
              variant={swapFrontBack ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSwapFrontBack(!swapFrontBack)}
              data-testid="study-swap-btn"
            >
              Swap Sides
            </Button>
            <Button
              variant={starredOnly ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStarredOnly(!starredOnly)}
              data-testid="study-starred-btn"
            >
              Starred
            </Button>
          </div>
        </div>

        <ProgressBar value={safePercent} aria-label="Flashcards progress" />

        <div
          className="study-card-perspective"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Card
            interactive
            onClick={() => setIsFlipped(!isFlipped)}
            className="study-card-flip"
            data-testid="study-flip-card"
          >
            {!isFlipped ? (
              <div>
                <p className="screen-title">{frontText}</p>
                <span className="set-mode-desc">Tap or press Space to flip</span>
              </div>
            ) : (
              <div>
                <span className="set-mode-desc">Target Formula</span>
                {backLatex && (
                  <div className="set-card-math-box">
                    <MathDisplay latex={backLatex} display={true} />
                  </div>
                )}
                {backText && <p className="home-card-title">{backText}</p>}
                <span className="set-mode-desc">Tap or press Space to flip back</span>
              </div>
            )}
          </Card>
        </div>

        <div className="set-actions">
          <Button
            variant="secondary"
            onClick={() => {
              void handleRateFlipCard(false);
            }}
            data-testid="study-rate-learning-btn"
          >
            Still Learning
          </Button>
          <Button variant="ghost" onClick={handlePrevFlipCard} data-testid="study-prev-btn">
            Previous
          </Button>
          <Button variant="ghost" onClick={handleNextFlipCard} data-testid="study-next-btn">
            Next
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              void handleRateFlipCard(true);
            }}
            data-testid="study-rate-know-btn"
          >
            Know it
          </Button>
        </div>
      </div>
    );
  }

  // --- LEARN MODE: ROUND SUMMARY ---
  if (showRoundSummary && roundSummaryData) {
    return (
      <div className="screen-container" data-testid="study-round-summary">
        <Card className="study-round-summary">
          <h2 className="screen-title">Round Summary</h2>
          <p className="screen-subtitle">Great work on this round!</p>

          <div className="study-stats-pills">
            <div className="stats-pill stats-pill-mastered">
              <span>Correct</span>
              <p>{roundSummaryData.correctCount}</p>
            </div>
            <div className="stats-pill stats-pill-learning">
              <span>Missed / Re-tested</span>
              <p>{roundSummaryData.missedCount}</p>
            </div>
            <div className="stats-pill stats-pill-mastered">
              <span>Promoted</span>
              <p>{roundSummaryData.promotedCount}</p>
            </div>
          </div>

          <div className="set-actions">
            <Button
              variant="secondary"
              onClick={() => navigate(`/set/${setId}`)}
              data-testid="study-round-finish-btn"
            >
              Finish Session
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowRoundSummary(false);
                engine?.resetRoundSummary();
                handleContinueNext();
              }}
              data-testid="study-round-continue-btn"
            >
              Continue Next Round
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- LEARN MODE: SESSION COMPLETE ---
  if (!currentPrompt || engine?.isSessionComplete()) {
    return (
      <EmptyState
        title="All Cards Mastered!"
        description="You have mastered all cards in this set for Learn mode."
        action={
          <Button variant="primary" onClick={() => navigate(`/set/${setId}`)} data-testid="study-finish-btn">
            Back to Deck
          </Button>
        }
        data-testid="study-complete-state"
      />
    );
  }

  // --- LEARN MODE: ACTIVE QUESTION ---
  const promptFront = currentPrompt.promptContent
    .map((s) => (s.t === 'text' ? s.v : s.t === 'math' ? `$${s.latex}$` : ''))
    .join(' ');
  const hintText = currentPrompt.card.hints[0]
    ?.map((s) => (s.t === 'text' ? s.v : ''))
    .join(' ');

  const masteryCounts = engine?.getMasteryCounts() || {
    unseen: 0,
    familiar: 0,
    proficient: 0,
    mastered: 0,
  };
  const masteredPercent = cards.length > 0 ? (masteryCounts.mastered / cards.length) * 100 : 0;

  return (
    <div className="screen-container" data-testid="study-learn-panel">
      {/* Header with stats & direction selector */}
      <div className="screen-header">
        <div>
          <span className="set-mode-desc">
            Mastered: {masteryCounts.mastered}/{cards.length} ({Math.round(masteredPercent)}%)
          </span>
          <div className="home-card-tags">
            <Chip variant={currentPrompt.type === 'mc' ? 'accent' : 'default'}>
              {currentPrompt.type === 'mc' ? 'Multiple Choice' : 'Written Recall'}
            </Chip>
            <Chip variant="default">Level {currentPrompt.progress.learn.level}</Chip>
          </div>
        </div>

        <div className="set-actions">
          <Button
            size="sm"
            variant={direction === 'front->back' ? 'primary' : 'secondary'}
            onClick={() => handleDirectionChange('front->back')}
            data-testid="study-dir-standard"
          >
            Term → Def
          </Button>
          <Button
            size="sm"
            variant={direction === 'back->front' ? 'primary' : 'secondary'}
            onClick={() => handleDirectionChange('back->front')}
            data-testid="study-dir-reverse"
          >
            Def → Term
          </Button>
        </div>
      </div>

      <ProgressBar value={masteredPercent} aria-label="Session mastery progress" />

      {/* Prompt Card */}
      <Card>
        <span className="set-mode-desc">Question</span>
        <h2 className="screen-title">{promptFront}</h2>
      </Card>

      {showHint && hintText && (
        <div className="study-hint-box">
          <strong>Hint: </strong>
          {hintText}
        </div>
      )}

      {/* QUESTION FORMAT: MULTIPLE CHOICE */}
      {currentPrompt.type === 'mc' && !verdict ? (
        <div className="study-mc-grid">
          {currentPrompt.options?.map((option, idx) => (
            <button
              key={option}
              type="button"
              className="study-mc-btn"
              onClick={() => {
                void handleSubmitAnswer(option);
              }}
              data-testid={`study-mc-option-${idx}`}
            >
              <MathDisplay latex={option} display={false} />
            </button>
          ))}
        </div>
      ) : null}

      {/* QUESTION FORMAT: WRITTEN (MATHLIVE) */}
      {currentPrompt.type === 'write' && !verdict ? (
        <div className="editor-form">
          <label className="ui-field-label">Your answer</label>
          <MathLiveField
            value={userAnswer}
            onChange={setUserAnswer}
            placeholder="Type equation..."
            className="math-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSubmitAnswer(userAnswer);
              }
            }}
          />

          <VirtualMathToolbar onInsert={(snippet) => setUserAnswer((prev) => prev + snippet)} />

          <div className="study-math-preview">
            {userAnswer.trim() ? (
              <MathDisplay latex={userAnswer} display={false} />
            ) : (
              <span className="set-mode-desc">Live equation preview appears here</span>
            )}
          </div>
        </div>
      ) : null}

      {/* VERDICT FEEDBACK & RETYPE GATE */}
      {verdict ? (
        <Card className={verdict.correct ? 'study-verdict-correct' : 'study-verdict-incorrect'}>
          <div className="editor-form">
            <span className="home-card-title">{verdict.correct ? 'Correct' : 'Not quite right'}</span>
            <p className="set-mode-desc">
              {verdict.correct ? (
                `Verified via ${verdict.via} equivalence`
              ) : (
                <div>
                  <span>Expected: </span>
                  <MathDisplay latex={currentPrompt.expectedLatexOrText} display={false} />
                </div>
              )}
            </p>

            {/* Retype correct answer gate */}
            {isRetypePhase && !verdict.correct ? (
              <div className="editor-form">
                <span className="home-card-title">
                  {verdict.correct ? 'Correct' : 'Not quite right'}
                </span>
                <div className="set-mode-desc">
                  {verdict.correct ? (
                    <span>{`Verified via ${verdict.via} equivalence`}</span>
                  ) : (
                    <div>
                      <span>Expected: </span>
                      <MathDisplay latex={backLatex} display={false} />
                    </div>
                  )}
                </div>
                <Button variant="primary" onClick={handleNext}>
                  {verdict.correct ? 'Next Card' : 'Continue'}
                </Button>
              </div>
            ) : null}

            <div className="set-actions">
              {!verdict.correct && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    void handleOverrideCorrect();
                  }}
                  data-testid="study-override-btn"
                >
                  Mark my answer correct
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleContinueNext}
                disabled={isRetypePhase && !retypeValue.trim()}
                data-testid="study-continue-btn"
              >
                {verdict.correct ? 'Next Card' : 'Continue'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Action buttons: Hint, I don't know, Check Answer */
        <div className="screen-header">
          <div className="set-actions">
            {hintText && (
              <Button variant="secondary" onClick={() => setShowHint(!showHint)} data-testid="study-hint-btn">
                {showHint ? 'Hide Hint' : 'Hint'}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                void handleIDontKnow();
              }}
              data-testid="study-dont-know-btn"
            >
              I don&apos;t know
            </Button>
          </div>

          {currentPrompt.type === 'write' && (
            <Button
              variant="primary"
              onClick={() => {
                void handleSubmitAnswer(userAnswer);
              }}
              disabled={!userAnswer.trim()}
              data-testid="study-check-btn"
            >
              Check Answer
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
