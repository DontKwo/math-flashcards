import { describe, it, expect } from 'vitest';
import { clozeChecker } from './cloze-checker.js';

describe('ClozeChecker', () => {
  it('matches single blank exactly', () => {
    expect(clozeChecker.check('apple', 'An {{c1::apple}} a day.')).toEqual({ correct: true, via: 'exact' });
    expect(clozeChecker.check('["apple"]', 'An {{c1::apple}} a day.')).toEqual({ correct: true, via: 'exact' });
  });

  it('matches multiple blanks', () => {
    expect(clozeChecker.check('["apple", "doctor"]', 'An {{c1::apple}} a day keeps the {{c2::doctor}} away.')).toEqual({ correct: true, via: 'exact' });
  });

  it('rejects missing or extra blanks', () => {
    expect(clozeChecker.check('apple', 'An {{c1::apple}} a day keeps the {{c2::doctor}} away.')).toMatchObject({ correct: false });
    expect(clozeChecker.check('["apple", "doctor", "away"]', 'An {{c1::apple}} a day keeps the {{c2::doctor}} away.')).toMatchObject({ correct: false });
  });

  it('handles normalized matches (case insensitive by default)', () => {
    expect(clozeChecker.check('APPLE', 'An {{c1::apple}} a day.')).toEqual({ correct: true, via: 'normalized' });
  });

  it('handles options (case sensitive)', () => {
    expect(clozeChecker.check('APPLE', 'An {{c1::apple}} a day.', { caseSensitive: true })).toMatchObject({ correct: false });
  });

  it('falls back to text checker if no clozes in expected', () => {
    expect(clozeChecker.check('apple', 'apple')).toEqual({ correct: true, via: 'exact' });
    expect(clozeChecker.check('APPLE', 'apple')).toEqual({ correct: true, via: 'normalized' });
  });

  it('handles cloze with hint', () => {
    expect(clozeChecker.check('apple', 'An {{c1::apple::fruit}} a day.')).toEqual({ correct: true, via: 'exact' });
  });
});
