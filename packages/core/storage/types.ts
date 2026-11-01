import type { CardSet, Card, CardProgress, StudySession } from '../model/index.js';

// The generic storage repository interface
export interface Repository {
  getSet(id: string): Promise<CardSet | undefined>;
  listSets(): Promise<CardSet[]>;
  saveSet(set: CardSet): Promise<void>;
  deleteSet(id: string): Promise<void>;

  getCard(id: string): Promise<Card | undefined>;
  getCards(setId: string): Promise<Card[]>;
  saveCard(card: Card): Promise<void>;
  deleteCard(id: string): Promise<void>;

  getProgress(cardId: string, direction: 'front->back' | 'back->front'): Promise<CardProgress | undefined>;
  listProgress(setId?: string): Promise<CardProgress[]>;
  saveProgress(progress: CardProgress): Promise<void>;

  saveSession(session: StudySession): Promise<void>;
  getSession(id: string): Promise<StudySession | undefined>;
  listSessions(setId?: string): Promise<StudySession[]>;
}
