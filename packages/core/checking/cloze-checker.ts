import type { AnswerChecker, Verdict } from './types.js';
import { textChecker } from './text-checker.js';

export interface ClozeCheckerOptions {
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  normalizeWhitespace?: boolean;
  ignorePunctuation?: boolean;
  ignoreDiacritics?: boolean;
}

export class ClozeChecker implements AnswerChecker {
  readonly id = 'cloze';

  check(given: string | string[], expected: string, options?: Record<string, unknown>): Verdict {
    // Parse the expected string to extract cloze deletion texts.
    // Format: {{c1::hidden text}} or {{c1::hidden text::hint}}
    const clozeRegex = /{{c\d+::(.*?)(?:::.*?)?}}/g;
    const expectedTexts: string[] = [];
    let match;
    while ((match = clozeRegex.exec(expected)) !== null) {
      expectedTexts.push(match[1]);
    }

    if (expectedTexts.length === 0) {
      // If no clozes are found in expected, fallback to normal text comparison
      return textChecker.check(typeof given === 'string' ? given : JSON.stringify(given), expected, options);
    }

    let givenArray: string[];

    if (typeof given === 'string') {
      try {
        const parsed = JSON.parse(given);
        if (Array.isArray(parsed)) {
          givenArray = parsed.map(String);
        } else {
          givenArray = [given];
        }
      } catch {
        givenArray = [given];
      }
    } else if (Array.isArray(given)) {
      givenArray = given.map(String);
    } else {
      givenArray = [String(given)];
    }

    if (givenArray.length !== expectedTexts.length) {
      return { correct: false, via: 'normalized' };
    }

    let allExact = true;
    for (let i = 0; i < expectedTexts.length; i++) {
      const g = givenArray[i];
      const e = expectedTexts[i];

      const res = textChecker.check(g, e, options);
      if (!res.correct) {
        return { correct: false, via: 'normalized' };
      }
      if (res.via !== 'exact') {
        allExact = false;
      }
    }

    return { correct: true, via: allExact ? 'exact' : 'normalized' };
  }
}

export const clozeChecker = new ClozeChecker();
