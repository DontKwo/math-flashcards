import type { AnswerChecker, Verdict } from './types';

export interface TextCheckerOptions {
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  normalizeWhitespace?: boolean;
  ignorePunctuation?: boolean;
  ignoreDiacritics?: boolean;
}

export class TextChecker implements AnswerChecker {
  readonly id = 'text';

  check(given: string, expected: string, options?: Record<string, unknown>): Verdict {
    const opts: TextCheckerOptions = {
      caseSensitive: false,
      trimWhitespace: true,
      normalizeWhitespace: true,
      ignorePunctuation: false,
      ignoreDiacritics: false,
      ...options,
    };

    if (given === expected) {
      return { correct: true, via: 'exact' };
    }

    const normGiven = this.normalize(given, opts);
    const normExpected = this.normalize(expected, opts);

    if (normGiven === normExpected) {
      return { correct: true, via: 'normalized' };
    }

    return { correct: false, via: 'normalized' };
  }

  private normalize(text: string, opts: TextCheckerOptions): string {
    let result = text;

    if (opts.trimWhitespace) {
      result = result.trim();
    }

    if (opts.normalizeWhitespace) {
      result = result.replace(/\s+/g, ' ');
    }

    if (!opts.caseSensitive) {
      result = result.toLowerCase();
    }

    if (opts.ignoreDiacritics) {
      result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    if (opts.ignorePunctuation) {
      result = result.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
      if (opts.normalizeWhitespace) {
        result = result.replace(/\s+/g, ' ').trim();
      }
    }

    return result;
  }
}

export const textChecker = new TextChecker();
