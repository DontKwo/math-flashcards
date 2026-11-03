import { describe, it, expect } from 'vitest';
import { generateDistractors } from './distractors.js';
import { Mulberry32 } from './prng.js';
import type { Card } from '../model/index.js';
import { mathChecker } from '../checking/index.js';
import { registry } from '../registry/index.js';

describe('generateDistractors', () => {
  const createMockCard = (id: string, answerText: string): Card => ({
    id,
    setId: 'set1',
    order: 0,
    type: 'basic',
    front: [],
    back: [],
    answer: {
      checker: 'math',
      accepted: [{ content: [{ t: 'math', latex: answerText }] }],
      options: {},
    },
    hints: [],
    tags: [],
    starred: false,
    media: [],
    extra: {},
    createdAt: 0,
    updatedAt: 0,
  });

  const cards: Card[] = [
    createMockCard('c1', '10'),
    createMockCard('c2', '20'),
    createMockCard('c3', '30'),
    createMockCard('c4', '40'),
    createMockCard('c5', '50'),
    createMockCard('c6', '60'),
    createMockCard('c7', '70'),
    createMockCard('c8', '80'),
    createMockCard('c9', '90'),
    createMockCard('c10', '100'),
  ];

  it('generates unique distractors and excludes the target answer', () => {
    // Make sure we have a checker registered
    if (!registry.getChecker('math')) {
        registry.registerChecker(mathChecker, { overwrite: true });
    }

    const rng = new Mulberry32(12345);
    const targetCard = cards[0]; // answer is '10'
    const count = 3;

    const distractors = generateDistractors(targetCard, cards, count, rng);

    expect(distractors.length).toBe(count);
    expect(distractors).not.toContain('10');

    const unique = new Set(distractors);
    expect(unique.size).toBe(count);
  });

  it('is deterministic when using the same RNG seed', () => {
    if (!registry.getChecker('math')) {
        registry.registerChecker(mathChecker, { overwrite: true });
    }
    const rng1 = new Mulberry32(12345);
    const distractors1 = generateDistractors(cards[0], cards, 3, rng1);

    const rng2 = new Mulberry32(12345);
    const distractors2 = generateDistractors(cards[0], cards, 3, rng2);

    expect(distractors1).toEqual(distractors2);
  });
});
