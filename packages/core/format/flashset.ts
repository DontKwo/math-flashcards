import { z } from 'zod';
import { CardSetSchema, CardSchema, CardProgressSchema } from '../model/index.js';
import type { CardSet, Card, CardProgress } from '../model/index.js';

// Bundle schema definition supporting v1 (legacy) and v2 (terms and glossaries)
export const FlashsetBundleSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  schemaVersion: z.string(),
  exportedAt: z.number(),
  set: CardSetSchema,
  cards: z.array(CardSchema),
  progress: z.array(CardProgressSchema).optional(),
});

export type FlashsetBundle = z.infer<typeof FlashsetBundleSchema>;

// Migrates legacy bundle (v1) to modern bundle (v2)
export function migrateFlashsetBundle(raw: unknown): FlashsetBundle {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid bundle: not an object');
  }

  const obj = raw as Record<string, unknown>;
  const version = obj.version;

  if (version === 1) {
    // Migration from v1: ensure set.glossary and card.terms are handled cleanly
    const set = (obj.set ?? {}) as Record<string, unknown>;
    const cards = (Array.isArray(obj.cards) ? obj.cards : []) as Record<string, unknown>[];

    const migratedSet = {
      ...set,
      glossary: set.glossary || undefined,
    };

    const migratedCards = cards.map((c) => ({
      ...c,
      terms: c.terms || undefined,
    }));

    return FlashsetBundleSchema.parse({
      ...obj,
      version: 2,
      schemaVersion: '2.0.0',
      set: migratedSet,
      cards: migratedCards,
    });
  }

  // Current version 2
  return FlashsetBundleSchema.parse(raw);
}

// Serializes a set, its cards, and optional progress to a .flashset JSON string
export function exportFlashset(set: CardSet, cards: Card[], progress?: CardProgress[]): string {
  const bundle: FlashsetBundle = {
    version: 2,
    schemaVersion: '2.0.0',
    exportedAt: Date.now(),
    set,
    cards,
    progress,
  };
  const validated = FlashsetBundleSchema.parse(bundle);
  return JSON.stringify(validated, null, 2);
}

// Parses and validates a .flashset JSON string, checking relational integrity and migrating
export function importFlashset(jsonString: string): FlashsetBundle {
  try {
    const raw = JSON.parse(jsonString);
    const bundle = migrateFlashsetBundle(raw);

    for (const card of bundle.cards) {
      if (card.setId !== bundle.set.id) {
        throw new Error(`Integrity error: Card ${card.id} does not belong to set ${bundle.set.id}`);
      }
    }

    return bundle;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new Error(`Schema validation failed: ${error.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Invalid flashset: ${error.message}`);
    }
    throw new Error('Invalid flashset: unknown error');
  }
}
