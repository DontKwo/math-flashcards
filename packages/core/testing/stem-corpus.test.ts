import { describe, it, expect } from 'vitest';
import { calculusDeck, maxwellDeck, thermodynamicsDeck } from './stem-corpus.js';
import { FlashsetBundleSchema } from '../format/flashset.js';
import { ComputeEngine } from '@cortex-js/compute-engine';
import { preprocessLatex } from '../math/preprocess.js';
import type { Segment } from '../model/index.js';

describe('STEM Corpus', () => {
  const decks = [
    { name: 'Calculus', bundle: calculusDeck },
    { name: 'Maxwell', bundle: maxwellDeck },
    { name: 'Thermodynamics', bundle: thermodynamicsDeck },
  ];

  const ce = new ComputeEngine();

  for (const deck of decks) {
    describe(`${deck.name} Deck`, () => {
      it('should validate against FlashsetBundleSchema', () => {
        const result = FlashsetBundleSchema.safeParse(deck.bundle);
        expect(result.success).toBe(true);
      });

      it('should have equations that parse cleanly in ComputeEngine', () => {
        for (const card of deck.bundle.cards) {
          const checkSegments = (segments: Segment[]) => {
            for (const seg of segments) {
              if (seg.t === 'math' && typeof seg.latex === 'string') {
                const preprocessed = preprocessLatex(seg.latex);
                try {
                  const expr = ce.parse(preprocessed).canonical;
                  expect(expr).toBeDefined();
                } catch {
                  throw new Error(`Failed to parse equation: "${seg.latex}" in card ${card.id}`);
                }
              }
            }
          };

          checkSegments(card.front);
          checkSegments(card.back);
          if (card.answer && card.answer.accepted) {
            for (const accepted of card.answer.accepted) {
              checkSegments(accepted.content);
            }
          }
        }
      });
    });
  }
});
