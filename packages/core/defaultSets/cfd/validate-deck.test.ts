import { describe, it, expect } from 'vitest';
import { validateCfdDefaultDeck } from './validate-script.js';

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
});
