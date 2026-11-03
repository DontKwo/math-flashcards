import { describe, it, expect } from 'vitest';
import { generatePrintableHtml, richContentToString } from './print.js';
import type { CardSet, Card, RichContent } from '../model/index.js';

describe('print format', () => {
  it('richContentToString concatenates correctly', () => {
    const content: RichContent = [
      { t: 'text', v: 'Solve for ' },
      { t: 'math', latex: 'x' },
    ];
    expect(richContentToString(content)).toBe('Solve for x');
  });

  it('generatePrintableHtml generates HTML with terms and answers', () => {
    const set: CardSet = {
      id: 'set1',
      title: 'Math Set',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'standard',
      extra: {},
    };

    const cards: Card[] = [
      {
        id: 'c1',
        setId: 'set1',
        order: 0,
        type: 'standard',
        front: [{ t: 'text', v: 'Front 1' }],
        back: [{ t: 'text', v: 'Back 1' }],
        answer: { checker: 'text', accepted: [{ content: [{ t: 'text', v: 'Back 1' }] }], options: {} },
        hints: [],
        tags: [],
        starred: false,
        media: [],
        extra: {},
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'c2',
        setId: 'set1',
        order: 1,
        type: 'standard',
        front: [{ t: 'text', v: 'Front 2' }],
        back: [{ t: 'text', v: 'Back 2' }],
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

    const html: string = generatePrintableHtml(set, cards);
    expect(html).toContain('Math Set - Flashcards');
    expect(html).toContain('Front 1');
    expect(html).toContain('Front 2');
    expect(html).toContain('Back 1');
    expect(html).toContain('Back 2');
    expect(html).toContain('page-break-after: always');
    expect(html).toContain('front-page');
    expect(html).toContain('back-page');
  });
});
