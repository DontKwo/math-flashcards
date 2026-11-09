import { CFD_COMPLETE_DECK, CFD_TOPIC_CATEGORIES, type CfdFlashcardItem, type CfdTopicCategory } from '@formulaflash/core';
import type { FlashcardItem } from './sample-deck.ts';

let cfdDeckCache: FlashcardItem[] | null = null;

export function loadCfdCompleteDeck(): FlashcardItem[] {
  if (!cfdDeckCache) {
    cfdDeckCache = CFD_COMPLETE_DECK.map((card: CfdFlashcardItem) => ({
      id: card.id,
      category: card.category,
      title: card.title,
      prompt: card.prompt,
      latexAnswer: card.latexAnswer,
      hint: card.hint,
      explanation: card.explanation,
      terms: card.terms,
    }));
  }
  return cfdDeckCache;
}

export function getCfdTopicCategories(): CfdTopicCategory[] {
  return CFD_TOPIC_CATEGORIES;
}
