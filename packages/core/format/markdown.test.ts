import { describe, it, expect } from 'vitest';
import { parseMarkdownDeck, parseRichContent } from './markdown.js';

describe('parseRichContent', () => {
  it('parses plain text', () => {
    const res = parseRichContent('hello world');
    expect(res).toEqual([{ t: 'text', v: 'hello world' }]);
  });

  it('parses inline math', () => {
    const res = parseRichContent('let $x = 1$ be a number');
    expect(res).toEqual([
      { t: 'text', v: 'let ' },
      { t: 'math', latex: 'x = 1', display: false },
      { t: 'text', v: ' be a number' },
    ]);
  });

  it('parses block math', () => {
    const res = parseRichContent('equation:\n$$y = mx + c$$');
    expect(res).toEqual([
      { t: 'text', v: 'equation:\n' },
      { t: 'math', latex: 'y = mx + c', display: true },
    ]);
  });
});

describe('parseMarkdownDeck', () => {
  it('parses heading format deck', () => {
    const md = `
# My First Deck

## Term 1
Definition 1

## $x^2$
Math $y^2$
    `.trim();

    const deck = parseMarkdownDeck(md);

    expect(deck.set.title).toBe('My First Deck');
    expect(deck.cards.length).toBe(2);

    expect(deck.cards[0].front).toEqual([{ t: 'text', v: 'Term 1' }]);
    expect(deck.cards[0].back).toEqual([{ t: 'text', v: 'Definition 1' }]);

    expect(deck.cards[1].front).toEqual([{ t: 'math', latex: 'x^2', display: false }]);
    expect(deck.cards[1].back).toEqual([
      { t: 'text', v: 'Math ' },
      { t: 'math', latex: 'y^2', display: false }
    ]);
  });

  it('parses list format deck', () => {
    const md = `
- **Term A**: Definition A
- Term B: Definition B
    `.trim();

    const deck = parseMarkdownDeck(md, 'Default Title');

    expect(deck.set.title).toBe('Default Title');
    expect(deck.cards.length).toBe(2);

    expect(deck.cards[0].front).toEqual([{ t: 'text', v: 'Term A' }]);
    expect(deck.cards[0].back).toEqual([{ t: 'text', v: 'Definition A' }]);

    expect(deck.cards[1].front).toEqual([{ t: 'text', v: 'Term B' }]);
    expect(deck.cards[1].back).toEqual([{ t: 'text', v: 'Definition B' }]);
  });
});
