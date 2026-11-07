import { describe, it, expect } from 'vitest';
import { generateLibrary, generateLegacyStorage, generateImportFile } from './factory.ts';

describe('Data Factory', () => {
  it('generates deterministic libraries with PRNG seed', () => {
    const lib1 = generateLibrary({ seed: 42, setCount: 3, cardsPerSet: 4 });
    const lib2 = generateLibrary({ seed: 42, setCount: 3, cardsPerSet: 4 });
    expect(lib1).toEqual(lib2);
    expect(lib1.sets.length).toBe(3);
    expect(lib1.cards.length).toBe(12);
  });

  it('generates different content profiles properly', () => {
    const profiles = [
      'plain-text',
      'math-only',
      'huge-latex',
      'invalid-latex',
      'emoji-rtl',
      'xss-html',
      'duplicate-names',
      'empty-whitespace',
      'with-hints-explanations',
    ] as const;

    for (const profile of profiles) {
      const lib = generateLibrary({ seed: 99, setCount: 2, cardsPerSet: 2, contentProfile: profile });
      expect(lib.sets.length).toBe(2);
      expect(lib.cards.length).toBe(4);
    }
  });

  it('generates legacy storage shapes and import files', () => {
    const validLegacy = generateLegacyStorage('valid');
    expect(validLegacy.formulaflash_sets).toBeDefined();

    const corruptedLegacy = generateLegacyStorage('corrupted');
    expect(() => JSON.parse(corruptedLegacy.formulaflash_sets)).toThrow();

    const validImport = generateImportFile('valid');
    expect(validImport.filename.endsWith('.flashset')).toBe(true);
    expect(JSON.parse(validImport.content).version).toBe(1);
  });
});
