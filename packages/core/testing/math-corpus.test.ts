import { describe, it, expect } from 'vitest';
import { mathCorpus } from './math-corpus';
import { registry } from '../registry';

describe('math-corpus and answer checkers', () => {
  const mathChecker = registry.getChecker('math');
  const textChecker = registry.getChecker('text');

  it('should have math and text checkers registered', () => {
    expect(mathChecker).toBeDefined();
    expect(textChecker).toBeDefined();
  });

  describe('math checker Tier 1 & Tier 2 corpus', () => {
    for (const testCase of mathCorpus) {
      describe(`Reference: ${testCase.reference}`, () => {
        for (const item of testCase.accept) {
          const given = typeof item === 'string' ? item : item.given;
          const options = typeof item === 'string' ? undefined : item.options;
          const optDesc = options ? ` with options ${JSON.stringify(options)}` : '';

          it(`ACCEPT: "${given}"${optDesc}`, () => {
            const verdict = mathChecker!.check(given, testCase.reference, options);
            expect(verdict.correct).toBe(true);
            expect(['exact', 'normalized', 'structural']).toContain(verdict.via);
          });
        }

        for (const item of testCase.reject) {
          const given = typeof item === 'string' ? item : item.given;
          const options = typeof item === 'string' ? undefined : item.options;
          const optDesc = options ? ` with options ${JSON.stringify(options)}` : '';

          it(`REJECT: "${given}"${optDesc}`, () => {
            const verdict = mathChecker!.check(given, testCase.reference, options);
            expect(verdict.correct).toBe(false);
          });
        }
      });
    }
  });

  describe('text checker', () => {
    it('accepts exact match', () => {
      const v = textChecker!.check('mitochondria', 'mitochondria');
      expect(v.correct).toBe(true);
      expect(v.via).toBe('exact');
    });

    it('accepts case insensitive match by default', () => {
      const v = textChecker!.check('Mitochondria', 'mitochondria');
      expect(v.correct).toBe(true);
      expect(v.via).toBe('normalized');
    });

    it('rejects case mismatch when caseSensitive is true', () => {
      const v = textChecker!.check('Mitochondria', 'mitochondria', { caseSensitive: true });
      expect(v.correct).toBe(false);
    });

    it('accepts whitespace differences with trim/normalize', () => {
      const v = textChecker!.check('  hello   world  ', 'hello world');
      expect(v.correct).toBe(true);
      expect(v.via).toBe('normalized');
    });

    it('handles ignorePunctuation and ignoreDiacritics', () => {
      const v = textChecker!.check('café!', 'cafe', {
        ignorePunctuation: true,
        ignoreDiacritics: true,
      });
      expect(v.correct).toBe(true);
      expect(v.via).toBe('normalized');
    });

    it('rejects completely different text', () => {
      const v = textChecker!.check('chloroplast', 'mitochondria');
      expect(v.correct).toBe(false);
    });
  });
});
