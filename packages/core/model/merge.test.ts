import { describe, it, expect } from 'vitest';
import { duplicateSet, mergeSets } from './merge.js';
import type { Card, CardSet, AnswerSpec, RichContent } from './index.js';

describe('merge utilities', () => {
  const dummyRichContent: RichContent = [{ t: 'text', v: 'dummy' }];
  const dummyAnswer: AnswerSpec = { checker: 'dummy', accepted: [], options: {} };

  const createMockSet = (id: string): CardSet => ({
    id,
    title: 'Test Set',
    tags: [],
    createdAt: 100,
    updatedAt: 100,
    settings: {},
    defaultCardType: 'basic',
    extra: {},
  });

  const createMockCard = (id: string, setId: string, order: number, extraId = ''): Card => ({
    id,
    setId,
    order,
    type: 'basic',
    front: dummyRichContent,
    back: dummyRichContent,
    answer: dummyAnswer,
    hints: [],
    tags: [],
    starred: false,
    media: [],
    extra: extraId ? { id: extraId } : {},
    createdAt: 100,
    updatedAt: 100,
  });

  describe('duplicateSet', () => {
    it('creates new UUIDs for set and all cards', () => {
      const set = createMockSet('set-1');
      const cards = [
        createMockCard('card-1', 'set-1', 0),
        createMockCard('card-2', 'set-1', 1),
      ];

      const result = duplicateSet(set, cards, 'New Title');

      expect(result.set.id).not.toBe('set-1');
      expect(result.set.title).toBe('New Title');
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0]?.id).not.toBe('card-1');
      expect(result.cards[1]?.id).not.toBe('card-2');
      expect(result.cards[0]?.setId).toBe(result.set.id);
      expect(result.cards[1]?.setId).toBe(result.set.id);
    });

    it('defaults to (Copy) title suffix', () => {
      const set = createMockSet('set-1');
      const result = duplicateSet(set, []);
      expect(result.set.title).toBe('Test Set (Copy)');
    });
  });

  describe('mergeSets', () => {
    it('deduplicates identical cards', () => {
      const targetSet = createMockSet('target-set');
      const targetCards = [
        createMockCard('t-1', 'target-set', 0), // signature matches s-1
      ];
      const sourceCards = [
        createMockCard('s-1', 'source-set', 0), // should be deduplicated
        { ...createMockCard('s-2', 'source-set', 0), front: [{ t: 'text', v: 'diff' }] as RichContent }, // different
      ];

      const result = mergeSets(targetSet, targetCards, sourceCards);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('t-1');
      expect(result[1]?.id).not.toBe('s-2');
      expect(result[1]?.setId).toBe('target-set');
      expect(result[1]?.order).toBe(1);
    });
  });
});
