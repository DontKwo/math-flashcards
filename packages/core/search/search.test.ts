import { describe, expect, it } from 'vitest';
import type { Card } from '../model/index';
import { searchCards } from './search';

// Creates a basic mock card for testing
function createMockCard(id: string, frontText: string, backText: string, tags: string[] = [], latex: string = ''): Card {
  return {
    id,
    setId: 'set1',
    order: 0,
    type: 'basic',
    front: [
      { t: 'text', v: frontText },
      ...(latex ? [{ t: 'math' as const, latex }] : [])
    ],
    back: [{ t: 'text', v: backText }],
    answer: { checker: 'text', accepted: [], options: {} },
    hints: [],
    tags,
    starred: false,
    media: [],
    extra: {},
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('searchCards', (): void => {
  const cards: Card[] = [
    createMockCard('1', 'Apple', 'A fruit', ['food']),
    createMockCard('2', 'Banana', 'Another fruit', ['food', 'yellow']),
    createMockCard('3', 'Pineapple', 'Spiky fruit', ['food']),
    createMockCard('4', 'Equation', 'Quadratic', [], 'x^2 + y^2 = r^2'),
  ];

  it('matches exact queries with high score', (): void => {
    const results = searchCards(cards, 'Apple');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].card.id).toBe('1');
    expect(results[0].score).toBe(100);
  });

  it('matches prefix queries', (): void => {
    const results = searchCards(cards, 'Ban');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].card.id).toBe('2');
    expect(results[0].score).toBe(90);
  });

  it('matches substrings', (): void => {
    const results = searchCards(cards, 'apple');
    expect(results.some((r) => r.card.id === '3')).toBe(true);
    const pineappleResult = results.find((r) => r.card.id === '3');
    expect(pineappleResult?.score).toBe(80);
  });

  it('matches tags with slightly lower weight', (): void => {
    const results = searchCards(cards, 'yellow');
    expect(results).toHaveLength(1);
    expect(results[0].card.id).toBe('2');
    // Exact match in tags: 100 * 0.8 = 80
    expect(results[0].score).toBe(80);
  });

  it('matches latex equations', (): void => {
    const results = searchCards(cards, 'x^2');
    expect(results).toHaveLength(1);
    expect(results[0].card.id).toBe('4');
  });

  it('handles fuzzy typos', (): void => {
    // "Bannana" instead of "Banana"
    const results = searchCards(cards, 'Bannana');
    expect(results).toHaveLength(1);
    expect(results[0].card.id).toBe('2');
  });

  it('returns all cards with 0 score on empty query', (): void => {
    const results = searchCards(cards, '   ');
    expect(results).toHaveLength(4);
    expect(results.every((r) => r.score === 0)).toBe(true);
  });

  it('sorts results by score descending', (): void => {
    // "Apple" will perfectly match card 1, and substring match card 3 (Pineapple)
    const results = searchCards(cards, 'apple');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[0].card.id).toBe('1');
  });
});
