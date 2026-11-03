import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Repository } from './types.js';
import type { CardSet, Card, CardProgress, StudySession } from '../model/index.js';

// Extend Dexie to define table properties
export class DexieRepository extends Dexie implements Repository {
  sets!: Table<CardSet, string>;
  cards!: Table<Card, string>;
  progress!: Table<CardProgress, [string, string]>;
  sessions!: Table<StudySession, string>;

  // Initialize Dexie and define schema
  constructor(databaseName: string = 'FormulaFlashDB') {
    super(databaseName);
    this.version(1).stores({
      sets: 'id',
      cards: 'id, setId',
      progress: '[cardId+direction], cardId',
      sessions: 'id, *setIds',
    });
  }

  // Set operations
  async getSet(id: string): Promise<CardSet | undefined> {
    return await this.sets.get(id);
  }

  async listSets(): Promise<CardSet[]> {
    return await this.sets.toArray();
  }

  async saveSet(set: CardSet): Promise<void> {
    await this.sets.put(set);
  }

  async deleteSet(id: string): Promise<void> {
    await this.transaction('rw', this.sets, this.cards, this.progress, async () => {
      await this.sets.delete(id);
      const cardsInSet = await this.cards.where('setId').equals(id).toArray();
      const cardIds = cardsInSet.map((c: Card) => c.id);
      await this.cards.bulkDelete(cardIds);

      const progressKeys: [string, string][] = [];
      for (const cardId of cardIds) {
        progressKeys.push([cardId, 'front->back'], [cardId, 'back->front']);
      }
      await this.progress.bulkDelete(progressKeys);
    });
  }

  // Card operations
  async getCard(id: string): Promise<Card | undefined> {
    return await this.cards.get(id);
  }

  async getCards(setId: string): Promise<Card[]> {
    return await this.cards.where('setId').equals(setId).toArray();
  }

  async saveCard(card: Card): Promise<void> {
    await this.cards.put(card);
  }

  async deleteCard(id: string): Promise<void> {
    await this.transaction('rw', this.cards, this.progress, async () => {
      await this.cards.delete(id);
      await this.progress.bulkDelete([[id, 'front->back'], [id, 'back->front']]);
    });
  }

  // Progress operations
  async getProgress(cardId: string, direction: 'front->back' | 'back->front'): Promise<CardProgress | undefined> {
    return await this.progress.get([cardId, direction]);
  }

  async listProgress(setId?: string): Promise<CardProgress[]> {
    if (setId) {
      const cards = await this.getCards(setId);
      const cardIds = new Set(cards.map((c: Card) => c.id));
      const allProgress = await this.progress.toArray();
      return allProgress.filter((p: CardProgress) => cardIds.has(p.cardId));
    }
    return await this.progress.toArray();
  }

  async saveProgress(progress: CardProgress): Promise<void> {
    await this.progress.put(progress);
  }

  // Session operations
  async saveSession(session: StudySession): Promise<void> {
    await this.sessions.put(session);
  }

  async getSession(id: string): Promise<StudySession | undefined> {
    return await this.sessions.get(id);
  }

  async listSessions(setId?: string): Promise<StudySession[]> {
    if (setId) {
      return await this.sessions.where('setIds').equals(setId).toArray();
    }
    return await this.sessions.toArray();
  }
}
