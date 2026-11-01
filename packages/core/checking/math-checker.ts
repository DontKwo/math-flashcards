import { ComputeEngine } from '@cortex-js/compute-engine';
import type { AnswerChecker, Verdict } from './types.js';
import { preprocessLatex, type PreprocessOptions } from '../math/preprocess.js';

export interface MathCheckerOptions extends PreprocessOptions {
  allowTier1?: boolean;
  allowTier2?: boolean;
  allowSideSwap?: boolean;
}

export class MathChecker implements AnswerChecker {
  readonly id = 'math';
  private ce: ComputeEngine;

  constructor(ce?: ComputeEngine) {
    this.ce = ce ?? new ComputeEngine();
  }

  check(given: string, expected: string, options?: Record<string, unknown>): Verdict {
    const opts: MathCheckerOptions = {
      allowTier1: true,
      allowTier2: true,
      allowSideSwap: true,
      accentsMatter: true,
      greekVariantsEqual: true,
      ...options,
    };

    if (given === expected) {
      return { correct: true, via: 'exact' };
    }

    const preprocessedGiven = preprocessLatex(given, opts);
    const preprocessedExpected = preprocessLatex(expected, opts);

    // Tier 1: Normalized string comparison
    if (opts.allowTier1) {
      // Remove all spaces for string comparison
      const sGiven = preprocessedGiven.replace(/\s+/g, '');
      const sExpected = preprocessedExpected.replace(/\s+/g, '');
      if (sGiven === sExpected) {
        return { correct: true, via: 'normalized' };
      }
    }

    // Tier 2: Structural AST comparison
    if (opts.allowTier2) {
      try {
        const givenExpr = this.ce.parse(preprocessedGiven).canonical;
        const expectedExpr = this.ce.parse(preprocessedExpected).canonical;

        if (givenExpr.isSame(expectedExpr)) {
          return { correct: true, via: 'structural' };
        }

        // Equation side-swap: A = B equals B = A
        if (opts.allowSideSwap) {
          const isGivenEqual = this.isEqualExpr(givenExpr);
          const isExpectedEqual = this.isEqualExpr(expectedExpr);

          if (isGivenEqual && isExpectedEqual) {
            const gOps = (givenExpr as unknown as { ops?: { isSame: (x: unknown) => boolean }[] }).ops;
            const eOps = (expectedExpr as unknown as { ops?: { isSame: (x: unknown) => boolean }[] }).ops;

            if (gOps && eOps && gOps.length === 2 && eOps.length === 2) {
              if (gOps[0].isSame(eOps[1]) && gOps[1].isSame(eOps[0])) {
                return { correct: true, via: 'structural' };
              }
            }
          }
        }
      } catch {
        // If parsing or canonicalization fails, fall through to incorrect
      }
    }

    return { correct: false, via: 'structural' };
  }

  private isEqualExpr(expr: { operator?: string; json?: unknown }): boolean {
    if (expr.operator === 'Equal') {
      return true;
    }
    if (Array.isArray(expr.json) && expr.json[0] === 'Equal') {
      return true;
    }
    return false;
  }
}

export const mathChecker = new MathChecker();
