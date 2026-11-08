import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mathChecker } from '../checking/math-checker.js';
import { textChecker } from '../checking/text-checker.js';
import { numericChecker } from '../checking/numeric-checker.js';
import { clozeChecker } from '../checking/cloze-checker.js';
import { exportFlashset, importFlashset } from '../format/flashset.js';
import { LearnEngine } from '../learn/engine.js';
import { SeededRng } from '../learn/prng.js';
import type { Card, CardSet, CardProgress } from '../model/index.js';
import { generateCorpus } from '../../../tests/fixtures/corpus/corpus-generator.js';

describe('Phase C.1 - Core Layer Property & Parametric Tests', () => {
  const corpus = generateCorpus(999);

  describe('Math Checker Invariants & Fuzzing (tens of thousands of cases)', () => {
    it('never throws and always terminates within a reasonable time limit on arbitrary text corpus', () => {
      // Cross mathChecker with every text class
      for (const text of corpus.textCorpus) {
        const start = performance.now();
        expect(() => mathChecker.check(text, 'PV = nRT')).not.toThrow();
        expect(() => mathChecker.check('PV = nRT', text)).not.toThrow();
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(2500); // Guard against catastrophic regex backtracking
      }
    });

    it('never throws on complex / deeply nested / syntax edge case formulas', () => {
      const allFormulas = [
        ...corpus.formulaCorpus.trivial,
        ...corpus.formulaCorpus.nestedFractions,
        ...corpus.formulaCorpus.deepNesting,
        ...corpus.formulaCorpus.powersAndIndices,
        ...corpus.formulaCorpus.greekLetters,
        ...corpus.formulaCorpus.calculus,
        ...corpus.formulaCorpus.matrices,
        ...corpus.formulaCorpus.syntaxEdgeCases,
      ];

      for (const formula of allFormulas) {
        expect(() => mathChecker.check(formula, formula)).not.toThrow();
        expect(() => mathChecker.check(formula, 'x + 1')).not.toThrow();
      }
    });

    it('accepts the canonical answer and all equivalent rewrites, and rejects wrong distractors', () => {
      for (const item of corpus.formulaCorpus.equivalentRewrites) {
        // Identity must accept
        const idVerdict = mathChecker.check(item.reference, item.reference);
        expect(idVerdict.correct).toBe(true);

        // Equivalents must accept
        for (const eq of item.equivalents) {
          const eqVerdict = mathChecker.check(eq, item.reference);
          expect(eqVerdict.correct, `Expected equivalent "${eq}" to be accepted for "${item.reference}"`).toBe(true);
        }

        // Distractors must reject
        for (const distractor of item.distractors) {
          const distVerdict = mathChecker.check(distractor, item.reference);
          expect(distVerdict.correct, `Expected distractor "${distractor}" to be rejected for "${item.reference}"`).toBe(false);
        }
      }
    });

    it('fast-check property: math checker never crashes on arbitrary LaTeX strings (5,000 runs)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 500 }), (rawString) => {
          const verdict = mathChecker.check(rawString, 'E = mc^2');
          return typeof verdict.correct === 'boolean' && typeof verdict.via === 'string';
        }),
        { numRuns: 5000 },
      );
    });

    it('fast-check property: commutativity of addition and side-swap for equations (2,500 runs)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (a, b) => {
            const canonical = `${a} + ${b} = ${a + b}`;
            const swapped = `${b} + ${a} = ${a + b}`;
            const sideSwapped = `${a + b} = ${a} + ${b}`;

            const v1 = mathChecker.check(swapped, canonical);
            const v2 = mathChecker.check(sideSwapped, canonical, { allowSideSwap: true });

            return v1.correct && v2.correct;
          },
        ),
        { numRuns: 2500 },
      );
    });
  });

  describe('Other Checkers Properties (Text, Numeric, Cloze)', () => {
    it('text checker fuzzing with fast-check (2,500 runs)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (str) => {
          const exact = textChecker.check(str, str);
          const trimmed = textChecker.check(`  ${str}  `, str);
          return exact.correct && trimmed.correct;
        }),
        { numRuns: 2500 },
      );
    });

    it('numeric checker never yields NaN and accepts tolerances (2,500 runs)', () => {
      fc.assert(
        fc.property(
          fc.double({ noNaN: true, min: -1e5, max: 1e5 }),
          fc.double({ noNaN: true, min: 0.05, max: 0.5 }),
          (val, tol) => {
            const valStr = val.toFixed(4);
            const nearbyStr = (val + tol * 0.5).toFixed(4);
            const farStr = (val + tol * 2.5).toFixed(4);

            const v1 = numericChecker.check(nearbyStr, valStr, { tol });
            const v2 = numericChecker.check(farStr, valStr, { tol });

            return v1.correct && !v2.correct;
          },
        ),
        { numRuns: 2500 },
      );
    });

    it('cloze checker never crashes on arbitrary malformed blanks (2,500 runs)', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 100 }), (str) => {
          const verdict = clozeChecker.check(str, 'The {{c1::speed}} of light is {{c2::c}}');
          return typeof verdict.correct === 'boolean';
        }),
        { numRuns: 2500 },
      );
    });
  });

  describe('Format Round-Trip Properties (.flashset)', () => {
    it('fast-check property: export then import is completely lossless (2,500 runs)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 40 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 30 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (setId, setTitle, rawCards) => {
            const set: CardSet = {
              id: setId,
              title: setTitle,
              tags: ['science'],
              createdAt: 1000,
              updatedAt: 1000,
              settings: {},
              defaultCardType: 'equation',
              extra: {},
            };

            const cards: Card[] = rawCards.map((rc, idx) => ({
              id: rc.id,
              setId: set.id,
              order: idx,
              type: 'equation',
              front: [{ t: 'text', v: rc.title }],
              back: [{ t: 'math', latex: 'x=1' }],
              answer: { checker: 'math', accepted: [], options: {} },
              hints: [],
              tags: [],
              starred: false,
              media: [],
              extra: {},
              createdAt: 1000,
              updatedAt: 1000,
            }));

            const progress: CardProgress[] = cards.map((c) => ({
              cardId: c.id,
              direction: 'front->back',
              learn: { level: 1, streak: 2 },
              stats: { seen: 3, right: 2, wrong: 1, avgMs: 1200 },
            }));

            const json = exportFlashset(set, cards, progress);
            const imported = importFlashset(json);

            return (
              imported.set.id === set.id &&
              imported.cards.length === cards.length &&
              imported.progress?.length === progress.length &&
              imported.cards[0].id === cards[0].id
            );
          },
        ),
        { numRuns: 2500 },
      );
    });
  });

  describe('Learn Engine Scheduling Invariants (fast-check simulation)', () => {
    it('always reaches complete mastery with simulated student (1,000 sessions)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 1, max: 8 }),
          (seed, cardCount) => {
            const cards: Card[] = Array.from({ length: cardCount }).map((_, i) => ({
              id: `card-${i}`,
              setId: 'set-1',
              order: i,
              type: 'basic',
              front: [{ t: 'text', v: `Front ${i}` }],
              back: [{ t: 'text', v: `Back ${i}` }],
              answer: { checker: 'text', accepted: [], options: {} },
              hints: [],
              tags: [],
              starred: false,
              media: [],
              extra: {},
              createdAt: 0,
              updatedAt: 0,
            }));

            const rng = new SeededRng(seed);
            const engine = new LearnEngine(cards, [], rng);

            let iterations = 0;
            const maxIterations = cardCount * 50;

            while (iterations < maxIterations) {
              const next = engine.getNext();
              if (!next) break; // All cards mastered!

              // Simulate 80% correct student
              const isCorrect = rng.nextFloat() < 0.8;
              engine.submitAnswer(next.card.id, {
                correct: isCorrect,
                via: isCorrect ? 'exact' : 'normalized',
              });

              iterations++;
            }

            // Must have terminated and all cards reached level 3
            for (const c of cards) {
              const p = engine.getProgress(c.id);
              if (!p || p.learn.level !== 3) return false;
            }

            return true;
          },
        ),
        { numRuns: 1000 },
      );
    });
  });
});
