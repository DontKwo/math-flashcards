import type { AnswerChecker } from '../checking/types';
import { textChecker } from '../checking/text-checker';
import { mathChecker } from '../checking/math-checker';

export interface Registry {
  checkers: Map<string, AnswerChecker>;
}

export class CoreRegistry implements Registry {
  checkers = new Map<string, AnswerChecker>();

  registerChecker(checker: AnswerChecker): void {
    this.checkers.set(checker.id, checker);
  }

  getChecker(id: string): AnswerChecker | undefined {
    return this.checkers.get(id);
  }
}

export const registry = new CoreRegistry();

// Register built-in checkers
registry.registerChecker(textChecker);
registry.registerChecker(mathChecker);
