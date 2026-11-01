import type { CardSet, Card, CardProgress, StudySession } from '../model/index.js';
import type { Repository } from './types.js';

// In-memory repository implementing Repository
export class InMemoryRepository implements Repository {
  private sets = new Map<string, CardSet>();
  private cards = new Map<string, Card>();
  private progresses = new Map<string, CardProgress>();
  private sessions = new Map<string, StudySession>();

  async getSet(id: string): Promise<CardSet | undefined> {
    const set = this.sets.get(id);
    return set ? structuredClone(set) : undefined;
  }

  async listSets(): Promise<CardSet[]> {
    return Array.from(this.sets.values()).map((set) => structuredClone(set));
  }

  async saveSet(set: CardSet): Promise<void> {
    this.sets.set(set.id, structuredClone(set));
  }

  async deleteSet(id: string): Promise<void> {
    this.sets.delete(id);
    // Cascades delete to associated cards
    for (const [cardId, card] of this.cards.entries()) {
      if (card.setId === id) {
        await this.deleteCard(cardId);
      }
    }
  }

  async getCard(id: string): Promise<Card | undefined> {
    const card = this.cards.get(id);
    return card ? structuredClone(card) : undefined;
  }

  async getCards(setId: string): Promise<Card[]> {
    return Array.from(this.cards.values())
      .filter((card) => card.setId === setId)
      .map((card) => structuredClone(card));
  }

  async saveCard(card: Card): Promise<void> {
    this.cards.set(card.id, structuredClone(card));
  }

  async deleteCard(id: string): Promise<void> {
    this.cards.delete(id);

    // Cascade delete progress
    const progressKeysToDelete: string[] = [];
    for (const [key, progress] of this.progresses.entries()) {
      if (progress.cardId === id) {
        progressKeysToDelete.push(key);
      }
    }
    for (const key of progressKeysToDelete) {
      this.progresses.delete(key);
    }
  }

  async getProgress(cardId: string, direction: 'front->back' | 'back->front'): Promise<CardProgress | undefined> {
    const key = `${cardId}_${direction}`;
    const progress = this.progresses.get(key);
    return progress ? structuredClone(progress) : undefined;
  }

  async listProgress(setId?: string): Promise<CardProgress[]> {
    let progresses = Array.from(this.progresses.values());

    if (setId) {
      const cardIdsInSet = new Set(
        Array.from(this.cards.values())
          .filter((card) => card.setId === setId)
          .map((card) => card.id)
      );
      progresses = progresses.filter((p) => cardIdsInSet.has(p.cardId));
    }

    return progresses.map((p) => structuredClone(p));
  }

  async saveProgress(progress: CardProgress): Promise<void> {
    const key = `${progress.cardId}_${progress.direction}`;
    this.progresses.set(key, structuredClone(progress));
  }

  async saveSession(session: StudySession): Promise<void> {
    this.sessions.set(session.id, structuredClone(session));
  }

  async getSession(id: string): Promise<StudySession | undefined> {
    const session = this.sessions.get(id);
    return session ? structuredClone(session) : undefined;
  }

  async listSessions(setId?: string): Promise<StudySession[]> {
    let sessions = Array.from(this.sessions.values());

    if (setId) {
      sessions = sessions.filter((s) => s.setIds.includes(setId));
    }

    return sessions.map((s) => structuredClone(s));
  }
}
