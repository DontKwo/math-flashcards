import { z } from 'zod';
import { CardSetSchema, CardSchema, CardProgressSchema } from '../model/index.js';
import type { CardSet, Card, CardProgress } from '../model/index.js';

// Bundle schema definition
export const FlashsetBundleSchema = z.object({
  version: z.literal(1),
  schemaVersion: z.string(),
  exportedAt: z.number(),
  set: CardSetSchema,
  cards: z.array(CardSchema),
  progress: z.array(CardProgressSchema).optional(),
});

export type FlashsetBundle = z.infer<typeof FlashsetBundleSchema>;

// Serializes a set, its cards, and optional progress to a .flashset JSON string
export function exportFlashset(set: CardSet, cards: Card[], progress?: CardProgress[]): string {
  const bundle: FlashsetBundle = {
    version: 1,
    schemaVersion: '1.0.0', // Standardizing on a simple version string
    exportedAt: Date.now(),
    set,
    cards,
    progress,
  };
  const validated = FlashsetBundleSchema.parse(bundle);
  return JSON.stringify(validated, null, 2);
}

// Parses and validates a .flashset JSON string, checking relational integrity
export function importFlashset(jsonString: string): FlashsetBundle {
  try {
    const raw = JSON.parse(jsonString);
    const bundle = FlashsetBundleSchema.parse(raw);

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
