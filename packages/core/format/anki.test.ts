import { describe, it, expect } from 'vitest';
import { parseAnkiExport } from './anki.js';

describe('Anki Importer', () => {
  it('should parse TSV format correctly', () => {
    const tsv = `front 1\tback 1
front 2\tback 2`;
    const bundle = parseAnkiExport(tsv, 'My Set');

    expect(bundle.set.title).toBe('My Set');
    expect(bundle.cards.length).toBe(2);
    expect(bundle.cards[0].front).toEqual([{ t: 'text', v: 'front 1' }]);
    expect(bundle.cards[0].back).toEqual([{ t: 'text', v: 'back 1' }]);
  });

  it('should parse CSV format correctly', () => {
    const csv = `"front, 1","back, 1"
"front ""2""","back 2"`;
    const bundle = parseAnkiExport(csv, 'My Set');

    expect(bundle.cards.length).toBe(2);
    expect(bundle.cards[0].front).toEqual([{ t: 'text', v: 'front, 1' }]);
    expect(bundle.cards[1].front).toEqual([{ t: 'text', v: 'front "2"' }]);
  });

  it('should convert math delimiters correctly', () => {
    const tsv = `hello $x^2$ world\tanswer \\[y_i\\]`;
    const bundle = parseAnkiExport(tsv, 'Math Set');

    expect(bundle.cards[0].front).toEqual([
      { t: 'text', v: 'hello ' },
      { t: 'math', latex: 'x^2', display: false },
      { t: 'text', v: ' world' }
    ]);
    expect(bundle.cards[0].back).toEqual([
      { t: 'text', v: 'answer ' },
      { t: 'math', latex: 'y_i', display: true }
    ]);
  });

  it('should strip HTML tags but preserve text', () => {
    const tsv = `<div><b>Front</b></div>\t<span style="color: red">Back<br>Text</span>`;
    const bundle = parseAnkiExport(tsv, 'HTML Set');

    expect(bundle.cards[0].front).toEqual([{ t: 'text', v: 'Front' }]);
    expect(bundle.cards[0].back).toEqual([{ t: 'text', v: 'BackText' }]);
  });
});
