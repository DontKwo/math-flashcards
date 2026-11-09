import { describe, it, expect } from 'vitest';
import { validateCfdDefaultDeck } from './validate-script.js';
import { CFD_COMPLETE_DECK } from './index.js';
import { CFD_GLOSSARY } from './glossary.js';
import { detectFormulaTerms } from '../../math/terms.js';
import { resolveCardTerm } from '../../model/index.js';

describe('CFD Default Deck Automated Validation', () => {
  it('validates all schema, uniqueness, balance, and checker rules', () => {
    const report = validateCfdDefaultDeck();
    if (report.errors.length > 0) {
      console.error('Validation errors found:', report.errors);
    }
    expect(report.errors).toEqual([]);
    expect(report.totalCards).toBe(1500);
    expect(report.categories.length).toBe(12);
    for (const cat of report.categories) {
      expect(cat.count).toBe(125);
    }
  });

  it('validates that every detected term across all 1,500 CFD cards resolves to a definition', () => {
    let totalDetected = 0;
    let totalResolved = 0;
    const missing: { cardId: string; sym: string }[] = [];

    for (const card of CFD_COMPLETE_DECK) {
      const terms = detectFormulaTerms(card.latexAnswer);
      totalDetected += terms.length;
      for (const sym of terms) {
        const resolved = resolveCardTerm(sym, card.terms, CFD_GLOSSARY);
        if (resolved && resolved.definition && resolved.definition.trim().length > 0) {
          totalResolved++;
        } else {
          missing.push({ cardId: card.id, sym });
        }
      }
    }

    expect(missing).toEqual([]);
    expect(totalDetected).toBeGreaterThan(0);
    expect(totalResolved).toBe(totalDetected);
  });
});
