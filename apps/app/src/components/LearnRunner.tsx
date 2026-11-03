import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LearnEngine, SeededRng, type QuestionPrompt, registry, type Card } from '@formulaflash/core';
import type { FlashcardSet } from '../data/storage.ts';
import { MathLiveField } from './MathLiveField.tsx';
import { MathDisplay } from './MathDisplay.tsx';
import { VirtualMathToolbar } from './VirtualMathToolbar.tsx';
import { loadSettings } from './SettingsModal.tsx';

export interface LearnRunnerProps {
  set: FlashcardSet;
  onFinish: () => void;
}

export const LearnRunner: React.FC<LearnRunnerProps> = ({ set, onFinish }) => {
  const settings = useMemo(() => loadSettings(), []);

  // Map FlashcardItem to core Card format
  const coreCards = useMemo(() => {
    return set.cards.map((fc) => {
      const card: Card = {
        id: fc.id,
        setId: set.id,
        order: 0,
        type: 'standard',
        front: [{ t: 'text', v: fc.prompt }],
        back: [{ t: 'math', latex: fc.latexAnswer }],
        answer: {
          checker: 'math',
          accepted: [{ content: [{ t: 'math', latex: fc.latexAnswer }] }],
          options: {},
        },
        hints: fc.hint ? [[{ t: 'text', v: fc.hint }]] : [],
        explanation: fc.explanation ? [{ t: 'text', v: fc.explanation }] : undefined,
        tags: [fc.category],
        starred: false,
        media: [],
        extra: {},
        createdAt: 0,
        updatedAt: 0,
      };
      return card;
    });
  }, [set]);

  const engine = useMemo(() => {
    const seed = Date.now() >>> 0;
    const rng = new SeededRng(seed);
    return new LearnEngine(coreCards, [], rng);
  }, [coreCards]);

  const [prompt, setPrompt] = useState<QuestionPrompt | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [verdict, setVerdict] = useState<{ correct: boolean; via?: string; message?: string } | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setPrompt(engine.getNext());
  }, [engine]);

  const handleNext = useCallback((): void => {
    setUserAnswer('');
    setVerdict(null);
    setPrompt(engine.getNext());
  }, [engine]);

  const handleInsertSnippet = useCallback((snippet: string): void => {
    setUserAnswer((prev) => prev + snippet);
  }, []);

  const handleCheckMath = useCallback((): void => {
    if (!prompt || !userAnswer.trim()) return;

    const checker = registry.getChecker('math');
    if (!checker) return;

    const expectedLatex = prompt.card.answer.accepted[0].content[0];
    const expectedStr = expectedLatex.t === 'math' ? expectedLatex.latex : '';

    const result = checker.check(userAnswer.trim(), expectedStr, {
      accentsMatter: settings.accentsMatter,
      greekVariantsEqual: settings.greekVariantsEqual,
      allowSideSwap: settings.allowSideSwap,
    });

    engine.submitAnswer(prompt.card.id, result);
    setVerdict(result);
    setSessionScore((prev) => ({
      correct: prev.correct + (result.correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [prompt, userAnswer, settings, engine]);

  const handleCheckMC = useCallback((optionId: string): void => {
    if (!prompt) return;

    const isCorrect = optionId === prompt.card.id;
    const result = { correct: isCorrect, via: 'exact' as const };

    engine.submitAnswer(prompt.card.id, result);
    setVerdict(result);
    setSessionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [prompt, engine]);

  const handleIdk = useCallback((): void => {
    if (!prompt) return;
    const result = { correct: false, via: 'override' as const, message: "I don't know" };
    engine.submitAnswer(prompt.card.id, result);
    setVerdict(result);
    setSessionScore((prev) => ({
      correct: prev.correct,
      total: prev.total + 1,
    }));
  }, [prompt, engine]);

  const handleOverride = useCallback((): void => {
    if (!prompt || !verdict || verdict.correct) return;
    // Overriding a previous wrong answer by submitting again as correct.
    const result = { correct: true, via: 'override' as const, message: "Overridden as correct" };
    engine.submitAnswer(prompt.card.id, result);
    setVerdict(result);
    setSessionScore((prev) => ({
      correct: prev.correct + 1, // Re-adjust correct score. Total was already incremented.
      total: prev.total,
    }));
  }, [prompt, verdict, engine]);

  if (!prompt) {
    return (
      <div className="learn-panel summary-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Round Complete!</h2>
        <p>You scored {sessionScore.correct} out of {sessionScore.total}.</p>
        <button type="button" className="btn-primary" onClick={onFinish} style={{ marginTop: '20px' }}>
          Finish Learn Session
        </button>
      </div>
    );
  }

  const expectedLatexObj = prompt.card.answer.accepted[0].content[0];
  const expectedLatex = expectedLatexObj.t === 'math' ? expectedLatexObj.latex : '';
  const frontTextObj = prompt.card.front[0];
  const frontText = frontTextObj.t === 'text' ? frontTextObj.v : '';

  return (
    <div className="learn-panel">
      <div className="flashcard" style={{ minHeight: 'auto' }}>
        <div className="card-body" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
          <h2 className="card-title">{prompt.card.tags[0] || 'Learn'}</h2>
          <p className="card-prompt">{frontText}</p>
        </div>
      </div>

      {prompt.type === 'mc' && prompt.options && !verdict ? (
        <div className="mc-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {prompt.options.map((optId) => {
            const optCard = coreCards.find((c) => c.id === optId);
            if (!optCard) return null;
            const optLatexObj = optCard.answer.accepted[0].content[0];
            const optLatex = optLatexObj.t === 'math' ? optLatexObj.latex : '';
            return (
              <button
                key={optId}
                type="button"
                className="btn-secondary"
                style={{ textAlign: 'left', padding: '12px' }}
                onClick={() => handleCheckMC(optId)}
              >
                <MathDisplay latex={optLatex} display={false} />
              </button>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
             <button type="button" className="btn-secondary" onClick={handleIdk}>
              I Don&apos;t Know
            </button>
          </div>
        </div>
      ) : null}

      {prompt.type === 'write' && !verdict ? (
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
              if (e.key === 'Enter') handleCheckMath();
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

          <div className="nav-controls" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary" onClick={handleIdk}>
              I Don&apos;t Know
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!userAnswer.trim()}
              onClick={handleCheckMath}
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}

      {verdict ? (
        <div className={`verdict-card ${verdict.correct ? 'correct' : 'incorrect'}`} style={{ marginTop: '16px' }}>
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
                  <MathDisplay latex={expectedLatex} display={false} />
                </div>
                {prompt.type === 'write' && userAnswer && (
                  <div>
                    <span>You entered: </span>
                    <MathDisplay latex={userAnswer} display={false} />
                  </div>
                )}
                {prompt.card.explanation && prompt.card.explanation[0].t === 'text' && (
                  <div className="card-explanation" style={{ marginTop: '8px' }}>
                    {prompt.card.explanation[0].v}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
            >
              Continue
            </button>
            {!verdict.correct && (
               <button
                 type="button"
                 className="btn-secondary"
                 onClick={handleOverride}
               >
                 Override as Correct
               </button>
            )}
          </div>
        </div>
      ) : null}

      <div className="nav-controls" style={{ marginTop: '24px' }}>
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
          Session: {sessionScore.correct} / {sessionScore.total} correct
        </div>
      </div>
    </div>
  );
};
