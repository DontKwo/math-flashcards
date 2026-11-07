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
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onFlip();
          }
        }}
      >
        {/* Front of Card */}
        <div
          className="flashcard-face flashcard-front flashcard"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
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
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
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
