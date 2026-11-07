import type { CardSet, Card, CardProgress, StudySession, Repository } from '@formulaflash/core';

const DB_NAME = 'formulaflash_db';
const DB_VERSION = 1;

// IndexedDB repository adapter for Formula Flash
export class IndexedDBRepository implements Repository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private customIndexedDB: IDBFactory | undefined;

  constructor(customIndexedDB?: IDBFactory) {
    this.customIndexedDB = customIndexedDB;
  }

  private getIDB(): IDBFactory {
    if (this.customIndexedDB) return this.customIndexedDB;
    if (typeof indexedDB !== 'undefined') return indexedDB;
    throw new Error('IndexedDB is not supported in this environment');
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const idb = this.getIDB();
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('sets')) {
          db.createObjectStore('sets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('setId', 'setId', { unique: false });
        }
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: ['cardId', 'direction'] });
          progressStore.createIndex('cardId', 'cardId', { unique: false });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('setIds', 'setIds', { multiEntry: true });
        }
      };

      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void => reject(request.error);
    });

    return this.dbPromise;
  }

  async getSet(id: string): Promise<CardSet | undefined> {
    const db = await this.getDB();
    return new Promise<CardSet | undefined>((resolve, reject) => {
      const tx = db.transaction('sets', 'readonly');
      const store = tx.objectStore('sets');
      const req = store.get(id);
      req.onsuccess = (): void => resolve(req.result || undefined);
      req.onerror = (): void => reject(req.error);
    });
  }

  async listSets(): Promise<CardSet[]> {
    const db = await this.getDB();
    return new Promise<CardSet[]>((resolve, reject) => {
      const tx = db.transaction('sets', 'readonly');
      const store = tx.objectStore('sets');
      const req = store.getAll();
      req.onsuccess = (): void => resolve(req.result || []);
      req.onerror = (): void => reject(req.error);
    });
  }

  async saveSet(set: CardSet): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sets', 'readwrite');
      const store = tx.objectStore('sets');
      const req = store.put(structuredClone(set));
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => reject(req.error);
    });
  }

  async deleteSet(id: string): Promise<void> {
    const db = await this.getDB();
    const cards = await this.getCards(id);
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sets', 'cards'], 'readwrite');
      const setStore = tx.objectStore('sets');
      const cardStore = tx.objectStore('cards');

      setStore.delete(id);
      for (const card of cards) {
        cardStore.delete(card.id);
      }

      tx.oncomplete = (): void => resolve();
      tx.onerror = (): void => reject(tx.error);
    });
  }

  async getCard(id: string): Promise<Card | undefined> {
    const db = await this.getDB();
    return new Promise<Card | undefined>((resolve, reject) => {
      const tx = db.transaction('cards', 'readonly');
      const store = tx.objectStore('cards');
      const req = store.get(id);
      req.onsuccess = (): void => resolve(req.result || undefined);
      req.onerror = (): void => reject(req.error);
    });
  }

  async getCards(setId: string): Promise<Card[]> {
    const db = await this.getDB();
    return new Promise<Card[]>((resolve, reject) => {
      const tx = db.transaction('cards', 'readonly');
      const store = tx.objectStore('cards');
      const index = store.index('setId');
      const req = index.getAll(setId);
      req.onsuccess = (): void => {
        const cards = (req.result || []) as Card[];
        cards.sort((a, b) => a.order - b.order);
        resolve(cards);
      };
      req.onerror = (): void => reject(req.error);
    });
  }

  async saveCard(card: Card): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('cards', 'readwrite');
      const store = tx.objectStore('cards');
      const req = store.put(structuredClone(card));
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => reject(req.error);
    });
  }

  async deleteCard(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('cards', 'readwrite');
      const store = tx.objectStore('cards');
      const req = store.delete(id);
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => reject(req.error);
    });
  }

  async getProgress(cardId: string, direction: 'front->back' | 'back->front'): Promise<CardProgress | undefined> {
    const db = await this.getDB();
    return new Promise<CardProgress | undefined>((resolve, reject) => {
      const tx = db.transaction('progress', 'readonly');
      const store = tx.objectStore('progress');
      const req = store.get([cardId, direction]);
      req.onsuccess = (): void => resolve(req.result || undefined);
      req.onerror = (): void => reject(req.error);
    });
  }

  async listProgress(setId?: string): Promise<CardProgress[]> {
    const db = await this.getDB();
    if (!setId) {
      return new Promise<CardProgress[]>((resolve, reject) => {
        const tx = db.transaction('progress', 'readonly');
        const store = tx.objectStore('progress');
        const req = store.getAll();
        req.onsuccess = (): void => resolve(req.result || []);
        req.onerror = (): void => reject(req.error);
      });
    }

    const cards = await this.getCards(setId);
    const cardIdSet = new Set(cards.map((c) => c.id));
    const allProgress = await this.listProgress();
    return allProgress.filter((p) => cardIdSet.has(p.cardId));
  }

  async saveProgress(progress: CardProgress): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      const req = store.put(structuredClone(progress));
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => reject(req.error);
    });
  }

  async saveSession(session: StudySession): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.put(structuredClone(session));
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => reject(req.error);
    });
  }

  async getSession(id: string): Promise<StudySession | undefined> {
    const db = await this.getDB();
    return new Promise<StudySession | undefined>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const req = store.get(id);
      req.onsuccess = (): void => resolve(req.result || undefined);
      req.onerror = (): void => reject(req.error);
    });
  }

  async listSessions(setId?: string): Promise<StudySession[]> {
    const db = await this.getDB();
    return new Promise<StudySession[]>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const req = store.getAll();
      req.onsuccess = (): void => {
        const list = (req.result || []) as StudySession[];
        if (!setId) {
          resolve(list);
        } else {
          resolve(list.filter((s) => s.setIds.includes(setId)));
        }
      };
      req.onerror = (): void => reject(req.error);
    });
  }
}
