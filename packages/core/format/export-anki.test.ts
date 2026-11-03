import { describe, it, expect } from 'vitest';
import type { CardSet, Card } from '../model/index.js';
import { exportToAnkiText } from './export-anki.js';

describe('exportToAnkiText', () => {
  it('exports cards to tab-delimited text with Anki math tags', () => {
    const set: CardSet = {
      id: 'set1',
      title: 'Math Set',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'qa',
      extra: {},
    };

    const cards: Card[] = [
      {
        id: 'card1',
        setId: 'set1',
        order: 0,
        type: 'qa',
        front: [{ t: 'text', v: 'Solve for x: ' }, { t: 'math', latex: '2x = 4' }],
        back: [{ t: 'math', latex: 'x = 2' }],
        answer: { checker: 'math', accepted: [], options: {} },
        hints: [],
        tags: [],
        starred: false,
        media: [],
        extra: {},
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'card2',
        setId: 'set1',
        order: 1,
        type: 'qa',
        front: [{ t: 'text', v: 'What is ' }, { t: 'math', latex: '\\pi' }, { t: 'text', v: ' ?' }],
        back: [{ t: 'text', v: 'Pi' }],
        answer: { checker: 'text', accepted: [], options: {} },
        hints: [],
        tags: [],
        starred: false,
        media: [],
        extra: {},
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const result = exportToAnkiText(set, cards);
    expect(result).toBe(
      'Solve for x: [$]2x = 4[/$]\t[$]x = 2[/$]\n' +
      'What is [$]\\pi[/$] ?\tPi'
    );
  });

  it('handles empty card lists', () => {
    const set: CardSet = {
      id: 'set1',
      title: 'Empty Set',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'qa',
      extra: {},
    };

    const result = exportToAnkiText(set, []);
    expect(result).toBe('');
  });
});
