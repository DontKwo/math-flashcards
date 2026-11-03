export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export interface SRSItem {
  stability: number;
  difficulty: number;
  due: Date;
  reps: number;
  lapses: number;
  lastReview?: Date;
  state?: number; // Optional state if we need it
}
