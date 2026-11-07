import { create } from 'zustand';
import type { CardSet, Card, Repository } from '@formulaflash/core';
import { IndexedDBRepository } from './idb-repository.ts';
import { migrateLegacyData } from './migration.ts';

export interface MasteryBreakdown {
  unseen: number;
  familiar: number;
  proficient: number;
  mastered: number;
}

export interface SetWithStats extends CardSet {
  cardCount: number;
  mastery: MasteryBreakdown;
  lastStudiedAt?: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'info' | 'success' | 'error';
}

interface SoftDeletedItem {
  type: 'set' | 'card';
  set?: CardSet;
  cards?: Card[];
  card?: Card;
}

export interface LibraryStore {
  sets: SetWithStats[];
  loading: boolean;
  error: string | null;
  activeToast: ToastMessage | null;
  repository: Repository;

  init: () => Promise<void>;
  getSet: (id: string) => Promise<{ set: CardSet; cards: Card[] } | undefined>;
  createSet: (title: string, tags?: string[]) => Promise<CardSet>;
  updateSet: (id: string, updates: Partial<CardSet>) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  duplicateSet: (id: string) => Promise<CardSet>;

  createCard: (setId: string, cardData: Omit<Card, 'id' | 'setId' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reorderCards: (setId: string, orderedCardIds: string[]) => Promise<void>;
  bulkAddCards: (setId: string, newCards: Array<Omit<Card, 'id' | 'setId' | 'createdAt' | 'updatedAt' | 'order'>>) => Promise<void>;

  undoLastAction: () => Promise<void>;
  clearToast: () => void;
  setToast: (toast: ToastMessage | null) => void;
}

let defaultRepo: Repository = new IndexedDBRepository();
let undoBuffer: SoftDeletedItem | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const setCustomRepository = (repo: Repository): void => {
  defaultRepo = repo;
};

export const useLibrary = create<LibraryStore>((set, get) => ({
  sets: [],
  loading: true,
  error: null,
  activeToast: null,
  repository: defaultRepo,

  init: async (): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const repo = get().repository;
      await migrateLegacyData(repo);

      const allSets = await repo.listSets();
      const enrichedSets: SetWithStats[] = [];

      for (const s of allSets) {
        const cards = await repo.getCards(s.id);
        const progressList = await repo.listProgress(s.id);
        const sessions = await repo.listSessions(s.id);

        let lastStudiedAt: number | undefined;
        if (sessions.length > 0) {
          lastStudiedAt = Math.max(...sessions.map((sess) => sess.endedAt || sess.startedAt));
        }

        const mastery: MasteryBreakdown = {
          unseen: 0,
          familiar: 0,
          proficient: 0,
          mastered: 0,
        };

        for (const card of cards) {
          const prog = progressList.find((p) => p.cardId === card.id);
          const lvl = prog?.learn.level ?? 0;
          if (lvl === 0) mastery.unseen++;
          else if (lvl === 1) mastery.familiar++;
          else if (lvl === 2) mastery.proficient++;
          else if (lvl === 3) mastery.mastered++;
        }

        enrichedSets.push({
          ...s,
          cardCount: cards.length,
          mastery,
          lastStudiedAt,
        });
      }

      set({ sets: enrichedSets, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to initialize library', loading: false });
    }
  },

  getSet: async (id: string): Promise<{ set: CardSet; cards: Card[] } | undefined> => {
    const repo = get().repository;
    const cardSet = await repo.getSet(id);
    if (!cardSet) return undefined;
    const cards = await repo.getCards(id);
    cards.sort((a, b) => a.order - b.order);
    return { set: cardSet, cards };
  },

  createSet: async (title: string, tags: string[] = []): Promise<CardSet> => {
    const repo = get().repository;
    const now = Date.now();
    const newSet: CardSet = {
      id: crypto.randomUUID(),
      title,
      tags,
      createdAt: now,
      updatedAt: now,
      settings: {},
      defaultCardType: 'equation',
      extra: {},
    };

    await repo.saveSet(newSet);
    await get().init();
    return newSet;
  },

  updateSet: async (id: string, updates: Partial<CardSet>): Promise<void> => {
    const repo = get().repository;
    const existing = await repo.getSet(id);
    if (!existing) throw new Error(`Set not found: ${id}`);

    const updated: CardSet = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await repo.saveSet(updated);
    await get().init();
  },

  deleteSet: async (id: string): Promise<void> => {
    const repo = get().repository;
    const setToDelete = await repo.getSet(id);
    if (!setToDelete) return;

    const cardsToDelete = await repo.getCards(id);
    undoBuffer = {
      type: 'set',
      set: setToDelete,
      cards: cardsToDelete,
    };

    await repo.deleteSet(id);
    await get().init();

    if (toastTimeout) clearTimeout(toastTimeout);
    get().setToast({
      id: crypto.randomUUID(),
      message: `Set "${setToDelete.title}" deleted`,
      actionLabel: 'Undo',
      onAction: () => {
        void get().undoLastAction();
      },
    });

    toastTimeout = setTimeout(() => {
      undoBuffer = null;
      get().clearToast();
    }, 6000);
  },

  duplicateSet: async (id: string): Promise<CardSet> => {
    const repo = get().repository;
    const orig = await repo.getSet(id);
    if (!orig) throw new Error(`Set not found: ${id}`);

    const origCards = await repo.getCards(id);
    const now = Date.now();
    const newSetId = crypto.randomUUID();

    const duplicatedSet: CardSet = {
      ...orig,
      id: newSetId,
      title: `${orig.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    await repo.saveSet(duplicatedSet);
    for (const c of origCards) {
      const duplicatedCard: Card = {
        ...c,
        id: crypto.randomUUID(),
        setId: newSetId,
        createdAt: now,
        updatedAt: now,
      };
      await repo.saveCard(duplicatedCard);
    }

    await get().init();
    return duplicatedSet;
  },

  createCard: async (setId: string, cardData: Omit<Card, 'id' | 'setId' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Card> => {
    const repo = get().repository;
    const existingCards = await repo.getCards(setId);
    const now = Date.now();

    const newCard: Card = {
      ...cardData,
      id: crypto.randomUUID(),
      setId,
      order: existingCards.length,
      createdAt: now,
      updatedAt: now,
    };

    await repo.saveCard(newCard);
    await get().init();
    return newCard;
  },

  updateCard: async (id: string, updates: Partial<Card>): Promise<void> => {
    const repo = get().repository;
    const existing = await repo.getCard(id);
    if (!existing) throw new Error(`Card not found: ${id}`);

    const updated: Card = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await repo.saveCard(updated);
    await get().init();
  },

  deleteCard: async (id: string): Promise<void> => {
    const repo = get().repository;
    const cardToDelete = await repo.getCard(id);
    if (!cardToDelete) return;

    undoBuffer = {
      type: 'card',
      card: cardToDelete,
    };

    await repo.deleteCard(id);
    await get().init();

    if (toastTimeout) clearTimeout(toastTimeout);
    get().setToast({
      id: crypto.randomUUID(),
      message: 'Card deleted',
      actionLabel: 'Undo',
      onAction: () => {
        void get().undoLastAction();
      },
    });

    toastTimeout = setTimeout(() => {
      undoBuffer = null;
      get().clearToast();
    }, 6000);
  },

  reorderCards: async (setId: string, orderedCardIds: string[]): Promise<void> => {
    const repo = get().repository;
    const cards = await repo.getCards(setId);
    const cardMap = new Map(cards.map((c) => [c.id, c]));

    for (let i = 0; i < orderedCardIds.length; i++) {
      const card = cardMap.get(orderedCardIds[i]);
      if (card && card.order !== i) {
        await repo.saveCard({ ...card, order: i, updatedAt: Date.now() });
      }
    }

    await get().init();
  },

  bulkAddCards: async (setId: string, newCards: Array<Omit<Card, 'id' | 'setId' | 'createdAt' | 'updatedAt' | 'order'>>): Promise<void> => {
    const repo = get().repository;
    const existingCards = await repo.getCards(setId);
    let order = existingCards.length;
    const now = Date.now();

    for (const data of newCards) {
      const card: Card = {
        ...data,
        id: crypto.randomUUID(),
        setId,
        order: order++,
        createdAt: now,
        updatedAt: now,
      };
      await repo.saveCard(card);
    }

    await get().init();
  },

  undoLastAction: async (): Promise<void> => {
    if (!undoBuffer) return;
    const repo = get().repository;

    if (undoBuffer.type === 'set' && undoBuffer.set) {
      await repo.saveSet(undoBuffer.set);
      if (undoBuffer.cards) {
        for (const c of undoBuffer.cards) {
          await repo.saveCard(c);
        }
      }
    } else if (undoBuffer.type === 'card' && undoBuffer.card) {
      await repo.saveCard(undoBuffer.card);
    }

    undoBuffer = null;
    if (toastTimeout) clearTimeout(toastTimeout);
    get().clearToast();
    await get().init();
  },

  clearToast: (): void => {
    set({ activeToast: null });
  },

  setToast: (toast: ToastMessage | null): void => {
    set({ activeToast: toast });
  },
}));
