import { type Card, type CardProgress } from '../model/index.js';

export type MasteryLevel = 0 | 1 | 2 | 3;

export const MasteryLevels = {
  UNSEEN: 0 as MasteryLevel,
  FAMILIAR: 1 as MasteryLevel,
  PROFICIENT: 2 as MasteryLevel,
  MASTERED: 3 as MasteryLevel,
} as const;

export type QuestionType = 'mc' | 'write';

export interface QuestionPrompt {
  card: Card;
  progress: CardProgress;
  type: QuestionType;
  options?: string[]; // For MC
}

export interface LearnState {
  queue: QuestionPrompt[];
  activeRounds: number;
}
