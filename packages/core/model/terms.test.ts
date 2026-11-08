import { describe, it, expect } from 'vitest';
import {
  TermDefinitionSchema,
  resolveCardTerm,
  sanitizeTermDefinition,
} from './index.js';
import { normalizeSymbolKey, sanitizePlainText } from './term-utils.js';
import { getSuggestionsForSymbol } from './suggestions.js';

describe('Term Models, Utils & Suggestions', () => {
  it('normalizes symbol keys correctly', () => {
    expect(normalizeSymbolKey('\\nu_t')).toBe('\\nu_{t}');
    expect(normalizeSymbolKey('\\nu_{t}')).toBe('\\nu_{t}');
    expect(normalizeSymbolKey('$$\\rho$$')).toBe('\\rho');
    expect(normalizeSymbolKey('\\mathbf{u}')).toBe('\\mathbf{u}');
    expect(normalizeSymbolKey('\\mathbf { u }')).toBe('\\mathbf{u}');
    expect(normalizeSymbolKey('x^2')).toBe('x^{2}');
    expect(normalizeSymbolKey('x^{2}')).toBe('x^{2}');
  });

  it('sanitizes plain text without executing or allowing raw html', () => {
    expect(sanitizePlainText('<b>Dynamic</b> viscosity')).toBe('Dynamic viscosity');
    expect(sanitizePlainText('<script>alert("xss")</script>Pressure')).toBe('alert("xss")Pressure');
    expect(sanitizePlainText('Normal definition')).toBe('Normal definition');
    expect(sanitizePlainText(undefined)).toBeUndefined();
  });

  it('validates term definitions with limits and sanitization', () => {
    const valid = TermDefinitionSchema.parse({
      symbol: '\\rho',
      name: 'Density',
      definition: 'Mass per unit volume',
      units: 'kg/m^3',
    });
    expect(valid.symbol).toBe('\\rho');
    expect(valid.name).toBe('Density');

    // Strips HTML from fields via sanitizeTermDefinition
    const sanitized = sanitizeTermDefinition({
      symbol: '\\nu',
      name: '<b>Viscosity</b>',
      definition: 'Kinematic <i>viscosity</i>',
    });
    expect(sanitized.name).toBe('Viscosity');
    expect(sanitized.definition).toBe('Kinematic viscosity');
  });

  it('resolves card terms with correct hierarchy: card -> glossary -> undefined', () => {
    const cardTerms = [
      {
        symbol: '\\nu',
        name: 'Kinematic viscosity',
        definition: 'Card override definition',
        units: 'm^2/s',
      },
    ];

    const glossary = {
      rho: {
        symbol: '\\rho',
        name: 'Density',
        definition: 'Set glossary density',
        units: 'kg/m^3',
      },
      nu: {
        symbol: '\\nu',
        name: 'Poisson ratio',
        definition: 'Set glossary Poisson ratio',
        units: 'dimensionless',
      },
    };

    // Card-level term overrides set glossary (\nu resolves to Kinematic viscosity, NOT Poisson's ratio)
    const nuResolved = resolveCardTerm('\\nu', cardTerms, glossary);
    expect(nuResolved?.name).toBe('Kinematic viscosity');
    expect(nuResolved?.definition).toBe('Card override definition');

    // Glossary fallback for symbol not defined on card
    const rhoResolved = resolveCardTerm('\\rho', cardTerms, glossary);
    expect(rhoResolved?.name).toBe('Density');
    expect(rhoResolved?.definition).toBe('Set glossary density');

    // Undefined fallback
    const unknownResolved = resolveCardTerm('\\zeta', cardTerms, glossary);
    expect(unknownResolved).toBeUndefined();
  });

  it('provides relevant suggestions from the common symbol library', () => {
    const rhoSuggestions = getSuggestionsForSymbol('\\rho');
    expect(rhoSuggestions.length).toBeGreaterThan(0);
    expect(rhoSuggestions.some((s) => s.name?.toLowerCase().includes('density'))).toBe(true);

    const nuSuggestions = getSuggestionsForSymbol('\\nu');
    expect(nuSuggestions.some((s) => s.name?.toLowerCase().includes('viscosity'))).toBe(true);
  });
});
