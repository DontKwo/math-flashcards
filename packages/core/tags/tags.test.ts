import { describe, it, expect } from 'vitest';
import { listAllTags, filterCardsByTags, renameTag } from './tags.js';
import type { Card } from '../model/index.js';

function createMockCard(id: string, tags: string[]): Card {
  return {
    id,
    tags,
    setId: 'set1',
    order: 0,
    type: 'basic',
    front: [],
    back: [],
    answer: { checker: 'text', accepted: [], options: {} },
    hints: [],
    starred: false,
    media: [],
    extra: {},
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('Tags utility functions', () => {
  const cards = [
    createMockCard('1', ['math', 'science']),
    createMockCard('2', ['math', 'history']),
    createMockCard('3', ['science']),
    createMockCard('4', []),
  ];

  it('listAllTags deduplicates and returns all tags', () => {
    const allTags = listAllTags(cards);
    expect(allTags).toContain('math');
    expect(allTags).toContain('science');
    expect(allTags).toContain('history');
    expect(allTags.length).toBe(3);
  });

  describe('filterCardsByTags', () => {
    it('returns all cards if no tags provided', () => {
      expect(filterCardsByTags(cards, [])).toEqual(cards);
    });

    it('filters by union by default (matchAll=false)', () => {
      const filtered = filterCardsByTags(cards, ['math', 'history']);
      // Should match card 1 (math), card 2 (math, history)
      expect(filtered.map(c => c.id)).toEqual(['1', '2']);
    });

    it('filters by intersection when matchAll=true', () => {
      const filtered = filterCardsByTags(cards, ['math', 'history'], true);
      // Should only match card 2 (math, history)
      expect(filtered.map(c => c.id)).toEqual(['2']);
    });

    it('returns empty when no cards match intersection', () => {
      const filtered = filterCardsByTags(cards, ['math', 'science', 'history'], true);
      expect(filtered.length).toBe(0);
    });
  });

  describe('renameTag', () => {
    it('renames a tag and preserves others', () => {
      const renamed = renameTag(cards, 'math', 'mathematics');

      expect(renamed[0].tags).toEqual(['mathematics', 'science']);
      expect(renamed[1].tags).toEqual(['mathematics', 'history']);

      // Unaffected cards remain exactly the same
      expect(renamed[2]).toBe(cards[2]);
      expect(renamed[3]).toBe(cards[3]);
    });

    it('deduplicates tags if renaming causes a collision', () => {
      const collisionCards = [
        createMockCard('1', ['math', 'science']),
      ];
      // rename 'math' to 'science'
      const renamed = renameTag(collisionCards, 'math', 'science');
      expect(renamed[0].tags).toEqual(['science']);
    });
  });
});
