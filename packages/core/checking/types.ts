export interface Verdict {
  correct: boolean;
  via: 'exact' | 'normalized' | 'structural' | 'numeric' | 'fuzzy' | 'override';
  closeness?: number;
  message?: string;
}

export interface AnswerChecker {
  id: string;
  check(given: string, expected: string, options?: Record<string, unknown>): Verdict;
}
