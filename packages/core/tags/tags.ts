import type { Card } from '../model/index.js';

/**
 * Returns a deduplicated list of all tags present in the given cards.
 */
export function listAllTags(cards: Card[]): string[] {
  const tagSet = new Set<string>();
  for (const card of cards) {
    for (const tag of card.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet);
}

/**
 * Filters cards to only include those matching the provided tags.
 */
export function filterCardsByTags(cards: Card[], tags: string[], matchAll?: boolean): Card[] {
  if (tags.length === 0) return cards;
  return cards.filter(card => {
    if (matchAll) {
      return tags.every(t => card.tags.includes(t));
    }
    return tags.some(t => card.tags.includes(t));
  });
}

/**
 * Returns a new array of cards where occurrences of oldTag are replaced with newTag.
 */
export function renameTag(cards: Card[], oldTag: string, newTag: string): Card[] {
  return cards.map(card => {
    if (!card.tags.includes(oldTag)) return card;
    const newTags = new Set(card.tags.map(t => (t === oldTag ? newTag : t)));
    return { ...card, tags: Array.from(newTags) };
  });
}
