import type { CardSet, Card, Repository, RichContent } from '@formulaflash/core';
import { SAMPLE_DECK, type FlashcardItem } from './sample-deck.ts';

export const LEGACY_SETS_KEY = 'formulaflash_sets';
export const LEGACY_SETTINGS_KEY = 'formulaflash_settings';
export const MIGRATION_COMPLETE_KEY = 'formulaflash_migrated_v1';

export interface LegacyFlashcardSet {
  id: string;
  name: string;
  category?: string;
  cards?: FlashcardItem[];
}

// Converts a legacy FlashcardItem into a core Card model.
export function convertLegacyCardToCoreCard(item: FlashcardItem, setId: string, order: number): Card {
  const frontText = item.title ? `${item.title}: ${item.prompt}` : item.prompt;
  const front: RichContent = [{ t: 'text', v: frontText }];
  const back: RichContent = [{ t: 'math', latex: item.latexAnswer, display: true }];

  const hints: RichContent[] = item.hint ? [[{ t: 'text', v: item.hint }]] : [];
  const explanation: RichContent | undefined = item.explanation
    ? [{ t: 'text', v: item.explanation }]
    : undefined;

  const now = Date.now();

  return {
    id: item.id || crypto.randomUUID(),
    setId,
    order,
    type: 'equation',
    front,
    back,
    answer: {
      checker: 'math',
      accepted: [
        {
          content: [{ t: 'math', latex: item.latexAnswer, display: true }],
        },
      ],
      options: {},
    },
    hints,
    explanation,
    tags: item.category ? [item.category] : [],
    starred: false,
    media: [],
    extra: {
      legacyTitle: item.title,
      legacyPrompt: item.prompt,
    },
    createdAt: now,
    updatedAt: now,
  };
}

// Builds the seed sample deck as core CardSet and Card models.
export function createSampleDeckCore(): { set: CardSet; cards: Card[] } {
  const now = Date.now();
  const setId = 'sample-deck';

  const set: CardSet = {
    id: setId,
    title: 'Ideal Gas Law & friends',
    description: [{ t: 'text', v: 'Foundational thermodynamics, mechanics, and electromagnetism equations.' }],
    tags: ['Physics', 'Chemistry'],
    createdAt: now,
    updatedAt: now,
    settings: {},
    defaultCardType: 'equation',
    extra: { isSample: true },
  };

  const cards: Card[] = SAMPLE_DECK.map((item, index) =>
    convertLegacyCardToCoreCard(item, setId, index)
  );

  return { set, cards };
}

// Runs data migration from legacy localStorage to the core Repository.
export async function migrateLegacyData(repo: Repository): Promise<void> {
  const alreadyMigrated = localStorage.getItem(MIGRATION_COMPLETE_KEY);
  const existingSets = await repo.listSets();

  if (alreadyMigrated && existingSets.length > 0) {
    return;
  }

  const rawLegacySets = localStorage.getItem(LEGACY_SETS_KEY);
  let parsedSets: LegacyFlashcardSet[] = [];

  if (rawLegacySets) {
    try {
      const parsed = JSON.parse(rawLegacySets);
      if (Array.isArray(parsed)) {
        parsedSets = parsed;
      }
    } catch {
      // Corrupted JSON: fallback to empty array
      parsedSets = [];
    }
  }

  const now = Date.now();

  if (parsedSets.length > 0) {
    for (const legacySet of parsedSets) {
      if (!legacySet || typeof legacySet !== 'object') continue;
      const setId = legacySet.id || crypto.randomUUID();
      const existing = await repo.getSet(setId);
      if (existing) continue;

      const cardSet: CardSet = {
        id: setId,
        title: legacySet.name || 'Untitled Set',
        tags: legacySet.category ? [legacySet.category] : [],
        createdAt: now,
        updatedAt: now,
        settings: {},
        defaultCardType: 'equation',
        extra: { migratedFromLegacy: true },
      };

      await repo.saveSet(cardSet);

      const legacyCards = Array.isArray(legacySet.cards) ? legacySet.cards : [];
      for (let i = 0; i < legacyCards.length; i++) {
        const item = legacyCards[i];
        if (!item) continue;
        const coreCard = convertLegacyCardToCoreCard(item, setId, i);
        await repo.saveCard(coreCard);
      }
    }
  }

  // Seed sample deck if repository has no sets
  const setsAfterMigration = await repo.listSets();
  if (setsAfterMigration.length === 0) {
    const { set, cards } = createSampleDeckCore();
    await repo.saveSet(set);
    for (const card of cards) {
      await repo.saveCard(card);
    }
  }

  localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
}
