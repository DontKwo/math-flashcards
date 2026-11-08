import { describe, it, expect } from 'vitest';
import { generateCorpus } from './corpus-generator.js';

describe('Deterministic Data Corpus', () => {
  it('generates reproducible data with the same seed', () => {
    const c1 = generateCorpus(12345);
    const c2 = generateCorpus(12345);
    expect(c1).toEqual(c2);
  });

  it('generates all required text edge cases', () => {
    const c = generateCorpus();
    expect(c.textCorpus).toContain('');
    expect(c.textCorpus.some((t) => t.length > 10000)).toBe(true);
    expect(c.textCorpus.some((t) => t.includes('<script>'))).toBe(true);
    expect(c.textCorpus).toContain('NaN');
    expect(c.textCorpus).toContain('undefined');
    expect(c.textCorpus).toContain('null');
    expect(c.textCorpus).toContain('[object Object]');
  });

  it('generates all required formula syntaxes and equivalence cases', () => {
    const c = generateCorpus();
    expect(c.formulaCorpus.trivial.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.nestedFractions.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.deepNesting.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.powersAndIndices.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.greekLetters.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.calculus.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.matrices.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.syntaxEdgeCases.length).toBeGreaterThan(0);
    expect(c.formulaCorpus.equivalentRewrites.length).toBeGreaterThan(0);
  });

  it('generates extreme numbers and special floats', () => {
    const c = generateCorpus();
    expect(c.numbersCorpus).toContain(0);
    expect(c.numbersCorpus).toContain(Infinity);
    expect(c.numbersCorpus.some((n) => Number.isNaN(n))).toBe(true);
    expect(c.numbersCorpus).toContain('1,5');
  });

  it('generates valid and invalid files and app states', () => {
    const c = generateCorpus();
    expect(c.filesCorpus.some((f) => f.valid)).toBe(true);
    expect(c.filesCorpus.some((f) => !f.valid)).toBe(true);
    expect(c.appStateCorpus.some((s) => s.corrupted)).toBe(true);
  });
});
