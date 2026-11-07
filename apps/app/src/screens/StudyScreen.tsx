import React, { useState, useEffect, useCallback } from 'react';
import { registry, type Verdict, type Card as CoreCard } from '@formulaflash/core';
import { useRoute } from '../router/index.ts';
import { useLibrary } from '../data/useLibrary.ts';
import { MathDisplay } from '../components/MathDisplay.tsx';
import { VirtualMathToolbar } from '../components/VirtualMathToolbar.tsx';
import { MathLiveField } from '../components/MathLiveField.tsx';
import { Card, Button, ProgressBar, EmptyState } from '../ui/index.ts';
import './screens.css';

export const StudyScreen: React.FC = () => {
  const { route, navigate } = useRoute();
  const { getSet } = useLibrary();
  const setId = route.params.id;
  const isCardsMode = route.pattern === 'study-cards';

  const [cards, setCards] = useState<CoreCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    let mounted = true;
    if (setId) {
      setLoading(true);
      void getSet(setId).then((res) => {
        if (mounted && res) {
          setCards(res.cards);
          setLoading(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [setId, getSet]);

  const currentCard = cards[currentIndex];

  const handleNext = useCallback((): void => {
    if (cards.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
    setIsFlipped(false);
  }, [cards.length]);

  const handlePrev = useCallback((): void => {
    if (cards.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setUserAnswer('');
    setVerdict(null);
    setShowHint(false);
    setIsFlipped(false);
  }, [cards.length]);

  const handleInsertSnippet = useCallback((snippet: string): void => {
    setUserAnswer((prev) => prev + snippet);
  }, []);

  const handleCheckAnswer = useCallback((): void => {
    if (!userAnswer.trim() || !currentCard) return;

    const checker = registry.getChecker('math');
    if (!checker) return;

    const expectedLatex =
      currentCard.back.find((s) => s.t === 'math')?.t === 'math'
        ? (currentCard.back.find((s) => s.t === 'math') as { latex: string }).latex
        : '';

    const result = checker.check(userAnswer.trim(), expectedLatex, {
      accentsMatter: true,
      greekVariantsEqual: true,
      allowSideSwap: true,
    });

    setVerdict(result);
    setScore((prev) => ({
      correct: prev.correct + (result.correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [userAnswer, currentCard]);

  if (loading) {
    return <div data-testid="study-loading">Loading study session...</div>;
  }

  if (cards.length === 0 || !currentCard) {
    return (
      <EmptyState
        title="No cards to study"
        description="This set does not contain any cards yet."
        action={<Button onClick={() => navigate(`/set/${setId}/edit`)}>Add Cards</Button>}
        data-testid="study-empty"
      />
    );
  }

  const frontText = currentCard.front
    .map((s) => (s.t === 'text' ? s.v : s.t === 'math' ? `$${s.latex}$` : ''))
    .join(' ');
  const backLatex =
    currentCard.back.find((s) => s.t === 'math')?.t === 'math'
      ? (currentCard.back.find((s) => s.t === 'math') as { latex: string }).latex
      : '';
  const hintText = currentCard.hints[0]
    ?.map((s) => (s.t === 'text' ? s.v : ''))
    .join(' ');
  const explanationText = currentCard.explanation
    ?.map((s) => (s.t === 'text' ? s.v : ''))
    .join(' ');

  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <span className="set-mode-desc">Card {currentIndex + 1} of {cards.length}</span>
        <span className="set-mode-desc">Session: {score.correct} / {score.total} correct</span>
      </div>

      <ProgressBar value={progressPercent} aria-label="Study progress" />

      {isCardsMode ? (
        // Flip Card Mode
        <div className="screen-container">
          <Card
            interactive
            onClick={() => setIsFlipped(!isFlipped)}
            className="study-card-flip"
            data-testid="study-flip-card"
          >
            {!isFlipped ? (
              <div>
                <p className="screen-title">{frontText}</p>
                <span className="set-mode-desc">
                  Tap card to reveal formula
                </span>
              </div>
            ) : (
              <div>
                <span className="set-mode-desc">
                  Target Equation
                </span>
                <div className="set-card-math-box">
                  <MathDisplay latex={backLatex} display={true} />
                </div>
                {explanationText && (
                  <p className="set-mode-desc">
                    {explanationText}
                  </p>
                )}
                <span className="set-mode-desc">
                  Tap card to flip back
                </span>
              </div>
            )}
          </Card>

          <div className="set-actions">
            <Button variant="secondary" onClick={handlePrev} data-testid="study-prev-btn">
              Previous
            </Button>
            <Button variant="primary" onClick={() => setIsFlipped(!isFlipped)}>
              Flip Card
            </Button>
            <Button variant="secondary" onClick={handleNext} data-testid="study-next-btn">
              Next
            </Button>
          </div>
        </div>
      ) : (
        // Learn Mode (Interactive Math Checking)
        <div className="screen-container" data-testid="study-learn-panel">
          <Card>
            <p className="home-card-title">{frontText}</p>
          </Card>

          {showHint && hintText && (
            <div className="study-hint-box">
              <strong>Hint: </strong>{hintText}
            </div>
          )}

          <div className="editor-form">
            <label className="ui-field-label">
              Type Equation (LaTeX / ASCII)
            </label>
            <MathLiveField
              value={userAnswer}
              onChange={setUserAnswer}
              placeholder="e.g. PV = nRT"
              className="math-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCheckAnswer();
              }}
            />

            <VirtualMathToolbar onInsert={handleInsertSnippet} />

            <div className="study-math-preview">
              {userAnswer.trim() ? (
                <MathDisplay latex={userAnswer} display={false} />
              ) : (
                <span className="set-mode-desc">
                  Live equation preview appears here
                </span>
              )}
            </div>
          </div>

          {verdict ? (
            <Card className={verdict.correct ? 'study-verdict-correct' : 'study-verdict-incorrect'}>
              <div className="editor-form">
                <span className="home-card-title">
                  {verdict.correct ? 'Correct' : 'Not quite right'}
                </span>
                <p className="set-mode-desc">
                  {verdict.correct ? (
                    `Verified via ${verdict.via} equivalence`
                  ) : (
                    <div>
                      <span>Expected: </span>
                      <MathDisplay latex={backLatex} display={false} />
                    </div>
                  )}
                </p>
                <Button variant="primary" onClick={handleNext}>
                  {verdict.correct ? 'Next Card' : 'Continue'}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="set-actions">
              {hintText && (
                <Button variant="secondary" onClick={() => setShowHint(!showHint)}>
                  {showHint ? 'Hide Hint' : 'Hint'}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleCheckAnswer}
                disabled={!userAnswer.trim()}
                data-testid="study-check-btn"
              >
                Check Answer
              </Button>
            </div>
          )}

          <div className="screen-header">
            <Button variant="secondary" onClick={handlePrev}>
              Previous
            </Button>
            <Button variant="secondary" onClick={handleNext}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
