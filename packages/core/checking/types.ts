import type { Verdict } from '../model/index.js';

export type { Verdict };

export interface AnswerChecker {
  id: string;
  check(given: string, expected: string, options?: Record<string, unknown>): Verdict;
}
