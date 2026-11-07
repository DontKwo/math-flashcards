import type { Card, CardProgress, RichContent } from '../model/index.js';

export type MasteryLevel = 0 | 1 | 2 | 3;

export const MasteryLevels = {
  UNSEEN: 0 as MasteryLevel,
  FAMILIAR: 1 as MasteryLevel,
  PROFICIENT: 2 as MasteryLevel,
  MASTERED: 3 as MasteryLevel,
} as const;

export type QuestionType = 'mc' | 'write';
export type StudyDirection = 'front->back' | 'back->front' | 'both';

export interface QuestionPrompt {
  card: Card;
  progress: CardProgress;
  type: QuestionType;
  direction: 'front->back' | 'back->front';
  promptContent: RichContent;
  expectedLatexOrText: string;
  options?: string[]; // For MC options
}

export interface RoundSummary {
  roundIndex: number;
  totalAnswered: number;
  correctCount: number;
  missedCount: number;
  promotedCount: number;
}

export interface LearnEngineConfig {
  direction?: StudyDirection;
  roundSize?: number;
  retypeAfterMiss?: boolean;
}
