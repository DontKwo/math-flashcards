import React from 'react';
import type { FlashcardItem } from '../data/sample-deck.ts';
import { MathDisplay } from './MathDisplay.tsx';

export interface FlashcardViewerProps {
  card: FlashcardItem;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ card, isFlipped, onFlip }) => {
  return (
    <div
      className="flashcard-viewer-container"
      style={{ perspective: '1000px', width: '100%', marginBottom: '20px' }}
    >
      <div
        className="flashcard-inner"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '280px',
          transition: 'transform 0.5s ease',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Card back showing equation. Tap to flip to question.' : 'Card front showing question. Tap to flip for equation.'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFlip();
          }
        }}
      >
        {/* Front of Card */}
        <div
          className="flashcard-face flashcard-front flashcard"
          aria-hidden={isFlipped}
          style={{
            position: isFlipped ? 'absolute' : 'relative',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            visibility: isFlipped ? 'hidden' : 'visible',
          }}
        >
          <div className="card-body">
            <h2 className="card-title">{card.title}</h2>
            <p className="card-prompt">{card.prompt}</p>
            <div style={{ marginTop: '20px' }}>
              <span className="card-flip-prompt">Tap card to flip for equation</span>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div
          className="flashcard-face flashcard-back flashcard"
          aria-hidden={!isFlipped}
          style={{
            position: isFlipped ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            visibility: isFlipped ? 'visible' : 'hidden',
          }}
        >
          <div className="card-body">
            <span className="deck-tag" style={{ marginBottom: '8px' }}>
              Target Equation
            </span>
            <div className="card-math-hero">
              <MathDisplay latex={card.latexAnswer} display={true} />
            </div>
            {card.explanation && (
              <div className="card-explanation">
                <strong>Explanation: </strong>
                {card.explanation}
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <span className="card-flip-prompt">Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
