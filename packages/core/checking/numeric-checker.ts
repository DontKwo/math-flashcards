import type { AnswerChecker, Verdict } from './types.js';

export interface NumericCheckerOptions {
  tol?: number;
  relTol?: number;
  unit?: string;
}

interface ParsedNumber {
  value: number;
  unit?: string;
}

export class NumericChecker implements AnswerChecker {
  readonly id = 'numeric';

  check(given: string, expected: string, options?: Record<string, unknown>): Verdict {
    const opts = options as NumericCheckerOptions | undefined;
    const givenParsed = this.parseNumber(given);
    const expectedParsed = this.parseNumber(expected);

    if (Number.isNaN(givenParsed.value) || Number.isNaN(expectedParsed.value)) {
      return { correct: false, via: 'numeric' };
    }

    const expectedUnit = opts?.unit || expectedParsed.unit;
    if (expectedUnit && givenParsed.unit !== expectedUnit) {
      return { correct: false, via: 'numeric', message: 'Unit mismatch' };
    }
    if (!expectedUnit && givenParsed.unit) {
      return { correct: false, via: 'numeric', message: 'Unexpected unit' };
    }

    const vG = givenParsed.value;
    const vE = expectedParsed.value;

    if (vG === vE) {
      return { correct: true, via: 'exact' };
    }

    if (opts?.tol !== undefined) {
      if (Math.abs(vG - vE) <= opts.tol) {
        return { correct: true, via: 'numeric' };
      }
    }

    if (opts?.relTol !== undefined) {
      if (vE !== 0 && Math.abs(vG - vE) / Math.abs(vE) <= opts.relTol) {
        return { correct: true, via: 'numeric' };
      }
    }

    if (opts?.tol === undefined && opts?.relTol === undefined) {
      // Default small tolerance to account for floating point errors if no options provided
      if (Math.abs(vG - vE) < 1e-9) {
        return { correct: true, via: 'numeric' };
      }
    }

    return { correct: false, via: 'numeric' };
  }

  private parseNumber(str: string): ParsedNumber {
    // Standardize scientific notation format
    let normalized = str.trim().replace(/\s*\*\s*10\^/g, 'e');
    normalized = normalized.replace(/\s+/g, ' '); // collapse whitespace

    // Split into value and unit
    const match = normalized.match(/^([-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)\s*(.*)$/i);
    if (!match) {
      return { value: NaN };
    }

    const value = parseFloat(match[1]);
    const unit = match[2]?.trim() || undefined;

    return { value, unit };
  }
}

export const numericChecker = new NumericChecker();
