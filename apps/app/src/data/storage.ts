import { SAMPLE_DECK, CFD_GLOSSARY, type FlashcardItem } from './sample-deck';
import type { TermDefinition } from '@formulaflash/core';

export interface FlashcardSet {
  id: string;
  name: string;
  category: string;
  cards: FlashcardItem[];
  glossary?: Record<string, TermDefinition>;
}

const STORAGE_KEY_SETS = 'formulaflash_sets';

function getStorageSets(): FlashcardSet[] {
  const data = localStorage.getItem(STORAGE_KEY_SETS);
  if (!data) return [];
  try {
    return JSON.parse(data) as FlashcardSet[];
  } catch {
    return [];
  }
}

export function loadSets(): FlashcardSet[] {
  const sets = getStorageSets();

  // Ensure the sample deck is always available and up to date with terms
  const existingSample = sets.find((s) => s.id === 'sample-deck');
  if (!existingSample) {
    sets.unshift({
      id: 'sample-deck',
      name: 'CFD & Physics Essentials',
      category: 'Fluid Dynamics',
      cards: SAMPLE_DECK,
      glossary: CFD_GLOSSARY,
    });
  } else if (!existingSample.cards[0]?.terms || existingSample.cards.length < SAMPLE_DECK.length) {
    // Migration for existing saved sets lacking terms on sample deck
    existingSample.name = 'CFD & Physics Essentials';
    existingSample.category = 'Fluid Dynamics';
    existingSample.cards = SAMPLE_DECK;
    existingSample.glossary = { ...CFD_GLOSSARY, ...(existingSample.glossary || {}) };
    saveSet(existingSample);
  }
  return sets;
}

export function saveSet(set: FlashcardSet): void {
  const sets = loadSets();
  const index = sets.findIndex((s) => s.id === set.id);
  if (index >= 0) {
    sets[index] = set;
  } else {
    sets.push(set);
  }
  localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
}

export function deleteSet(setId: string): void {
  if (setId === 'sample-deck') return; // Cannot delete sample deck
  const sets = loadSets().filter((s) => s.id !== setId);
  localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
}

export function saveCard(setId: string, card: FlashcardItem): void {
  const sets = loadSets();
  const setIndex = sets.findIndex((s) => s.id === setId);
  if (setIndex >= 0) {
    const cardIndex = sets[setIndex].cards.findIndex((c) => c.id === card.id);
    if (cardIndex >= 0) {
      sets[setIndex].cards[cardIndex] = card;
    } else {
      sets[setIndex].cards.push(card);
    }
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
  }
}

export function deleteCard(setId: string, cardId: string): void {
  const sets = loadSets();
  const setIndex = sets.findIndex((s) => s.id === setId);
  if (setIndex >= 0) {
    sets[setIndex].cards = sets[setIndex].cards.filter((c) => c.id !== cardId);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
  }
}

export function saveSetGlossary(setId: string, glossary: Record<string, TermDefinition>): void {
  const sets = loadSets();
  const setIndex = sets.findIndex((s) => s.id === setId);
  if (setIndex >= 0) {
    sets[setIndex].glossary = glossary;
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
  }
}
