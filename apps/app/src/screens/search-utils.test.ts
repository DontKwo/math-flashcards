import { describe, it, expect } from 'vitest';
import {
  richContentToText,
  cardToSearchableText,
  fuzzyMatch,
  splitMatches,
} from './search-utils.ts';
import type { Card } from '@formulaflash/core';

describe('search-utils', () => {
  it('extracts plain text and LaTeX from RichContent segments', () => {
    const text = richContentToText([
      { t: 'text', v: 'State the relation:' },
      { t: 'math', latex: 'PV = nRT' },
    ]);
    expect(text).toBe('State the relation: PV = nRT');
  });

  it('generates comprehensive searchable text for a card', () => {
    const card: Card = {
      id: 'c1',
      setId: 's1',
      order: 0,
      type: 'equation',
      front: [{ t: 'text', v: 'Kinetic Energy formula' }],
      back: [{ t: 'math', latex: 'E_k = \\frac{1}{2}mv^2' }],
      answer: { checker: 'math', accepted: [], options: {} },
      hints: [],
      tags: ['Physics', 'Mechanics'],
      starred: false,
      media: [],
      extra: {},
      createdAt: 1000,
      updatedAt: 1000,
    };

    const searchable = cardToSearchableText(card);
    expect(searchable).toContain('Kinetic Energy formula');
    expect(searchable).toContain('E_k = \\frac{1}{2}mv^2');
    expect(searchable).toContain('Physics');
  });

  it('performs fuzzy matching including substrings and acronym subsequences', () => {
    expect(fuzzyMatch('gas', 'Ideal Gas Law')).toBe(true);
    expect(fuzzyMatch('pv', 'PV = nRT')).toBe(true);
    expect(fuzzyMatch('pvnrt', 'PV = nRT')).toBe(true);
    expect(fuzzyMatch('xyz', 'Ideal Gas Law')).toBe(false);
  });

  it('splits text into matching highlight segments', () => {
    const segments = splitMatches('Ideal Gas Law and Gas constant', 'gas');
    expect(segments).toEqual([
      { text: 'Ideal ', isMatch: false },
      { text: 'Gas', isMatch: true },
      { text: ' Law and ', isMatch: false },
      { text: 'Gas', isMatch: true },
      { text: ' constant', isMatch: false },
    ]);
  });
});
