import { CFD_COMPLETE_DECK, CFD_TOPIC_CATEGORIES } from './index.js';
import { textChecker } from '../../checking/text-checker.js';

export interface ValidationReport {
  totalCards: number;
  categories: { name: string; count: number }[];
  errors: string[];
}

export function validateCfdDefaultDeck(): ValidationReport {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const normalizedFronts = new Map<string, string>();

  const categoryMap = new Map<string, number>();

  for (const card of CFD_COMPLETE_DECK) {
    if (!card.id || card.id.trim() === '') {
      errors.push(`Found card with empty ID: ${JSON.stringify(card)}`);
    } else if (seenIds.has(card.id)) {
      errors.push(`Duplicate card ID detected: ${card.id}`);
    } else {
      seenIds.add(card.id);
    }

    if (!card.title || card.title.trim() === '') {
      errors.push(`Card ${card.id} has empty title`);
    }
    if (!card.prompt || card.prompt.trim() === '') {
      errors.push(`Card ${card.id} has empty prompt`);
    }
    if (!card.latexAnswer || card.latexAnswer.trim() === '') {
      errors.push(`Card ${card.id} has empty latexAnswer`);
    }
    if (!card.explanation || card.explanation.trim() === '') {
      errors.push(`Card ${card.id} has empty explanation`);
    }
    if (!card.category || card.category.trim() === '') {
      errors.push(`Card ${card.id} has empty category`);
    } else {
      const count = categoryMap.get(card.category) || 0;
      categoryMap.set(card.category, count + 1);
    }

    const normalizedPrompt = card.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (normalizedFronts.has(normalizedPrompt)) {
      errors.push(
        `Near-duplicate prompt detected between card ${card.id} and ${normalizedFronts.get(
          normalizedPrompt
        )}: "${card.prompt}"`
      );
    } else {
      normalizedFronts.set(normalizedPrompt, card.id);
    }

    let braceCount = 0;
    let bracketCount = 0;
    for (const char of card.latexAnswer) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      if (braceCount < 0 || bracketCount < 0) {
        errors.push(`Unbalanced closing delimiter in card ${card.id}: ${card.latexAnswer}`);
        break;
      }
    }
    if (braceCount !== 0 || bracketCount !== 0) {
      errors.push(`Unbalanced open delimiter in card ${card.id}: ${card.latexAnswer}`);
    }

    const verdict = textChecker.check(card.latexAnswer, card.latexAnswer);
    if (!verdict.correct) {
      errors.push(`textChecker rejected canonical answer for card ${card.id}: "${card.latexAnswer}"`);
    }
  }

  if (CFD_COMPLETE_DECK.length < 1200) {
    errors.push(
      `Total card count ${CFD_COMPLETE_DECK.length} is below required minimum of 1,200 cards.`
    );
  }

  const categories: { name: string; count: number }[] = [];
  for (const cat of CFD_TOPIC_CATEGORIES) {
    const count = categoryMap.get(cat.name) || 0;
    categories.push({ name: cat.name, count });
    if (count < 100) {
      errors.push(`Category "${cat.name}" has only ${count} cards, below minimum requirement of 100.`);
    }
  }

  return {
    totalCards: CFD_COMPLETE_DECK.length,
    categories,
    errors,
  };
}
