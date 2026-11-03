import type { Card, CardSet } from './index.js';

// Duplicates a set and its cards with new UUIDs.
// Also updates the title if provided.
export function duplicateSet(set: CardSet, cards: Card[], newTitle?: string): { set: CardSet; cards: Card[] } {
  const newSetId: string = crypto.randomUUID();
  const now: number = Date.now();

  const duplicatedSet: CardSet = {
    ...set,
    id: newSetId,
    title: newTitle ?? `${set.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  const duplicatedCards: Card[] = cards.map((card: Card): Card => ({
    ...card,
    id: crypto.randomUUID(),
    setId: newSetId,
    createdAt: now,
    updatedAt: now,
  }));

  return { set: duplicatedSet, cards: duplicatedCards };
}

// Merges source cards into target set.
// Deduplicates cards by comparing front, back, type, and answer.
export function mergeSets(targetSet: CardSet, targetCards: Card[], sourceCards: Card[]): Card[] {
  const getSignature = (c: Card): string => JSON.stringify({ t: c.type, f: c.front, b: c.back, a: c.answer });
  const existingSigs: Set<string> = new Set(targetCards.map(getSignature));

  let maxOrder: number = targetCards.reduce((max: number, c: Card): number => Math.max(max, c.order), -1);
  const now: number = Date.now();
  const result: Card[] = [...targetCards];

  for (const src of sourceCards) {
    const sig: string = getSignature(src);
    if (!existingSigs.has(sig)) {
      existingSigs.add(sig);
      maxOrder += 1;
      result.push({
        ...src,
        id: crypto.randomUUID(),
        setId: targetSet.id,
        order: maxOrder,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return result;
}
