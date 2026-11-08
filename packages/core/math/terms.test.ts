import { describe, it, expect } from 'vitest';
import { detectFormulaTerms, diffTerms } from './terms.js';
import { normalizeSymbolKey } from '../model/term-utils.js';

describe('detectFormulaTerms', () => {
  it('detects terms from incompressible momentum equation', () => {
    const formula = '\\frac{\\partial \\mathbf{u}}{\\partial t} + (\\mathbf{u} \\cdot \\nabla)\\mathbf{u} = -\\frac{1}{\\rho}\\nabla p + \\nu \\nabla^2 \\mathbf{u}';
    const terms = detectFormulaTerms(formula);
    const normalized = terms.map(normalizeSymbolKey);

    // Should include \mathbf{u}, t, \rho, p, \nu
    expect(normalized).toContain('\\mathbf{u}');
    expect(normalized).toContain('t');
    expect(normalized).toContain('\\rho');
    expect(normalized).toContain('p');
    expect(normalized).toContain('\\nu');

    // Operators and commands like \partial, \nabla, \frac must be excluded
    expect(normalized).not.toContain('\\partial');
    expect(normalized).not.toContain('\\nabla');
    expect(normalized).not.toContain('\\frac');
  });

  it('distinguishes styled/subscripted terms from base terms', () => {
    const formula = '\\nu_t + \\nu + \\mathbf{u} + u + \\hat{\\rho} + \\rho + c_p';
    const terms = detectFormulaTerms(formula);
    const normalized = terms.map(normalizeSymbolKey);

    expect(normalized).toContain('\\nu_{t}');
    expect(normalized).toContain('\\nu');
    expect(normalized).toContain('\\mathbf{u}');
    expect(normalized).toContain('u');
    expect(normalized).toContain('\\hat{\\rho}');
    expect(normalized).toContain('\\rho');
    expect(normalized).toContain('c_{p}');
  });

  it('detects named quantities such as Re, Pr, Ma', () => {
    const formula = 'Re = \\frac{\\rho u L}{\\mu}, \\quad Pr = \\frac{c_p \\mu}{k}, \\quad Ma = \\frac{u}{a}';
    const terms = detectFormulaTerms(formula);

    expect(terms).toContain('Re');
    expect(terms).toContain('Pr');
    expect(terms).toContain('Ma');
  });

  it('excludes trigonometric and exponential functions, brackets, and numbers', () => {
    const formula = 'y = 2 \\sin(x) + 3 \\ln(t) - \\exp(-k t)';
    const terms = detectFormulaTerms(formula);

    expect(terms).toContain('y');
    expect(terms).toContain('x');
    expect(terms).toContain('t');
    expect(terms).toContain('k');

    expect(terms).not.toContain('sin');
    expect(terms).not.toContain('ln');
    expect(terms).not.toContain('exp');
    expect(terms).not.toContain('2');
    expect(terms).not.toContain('3');
  });

  it('never throws on hostile or malformed input and finishes in milliseconds', () => {
    const hostileInputs = [
      '',
      '   ',
      '\\\\\\{{{{}}}',
      '\\frac{\\sqrt[}{',
      '<script>alert("hack")</script>',
      'مرحبا بالعالم \\alpha + \\beta',
      'x'.repeat(5000), // 5,000 character formula
      '\\nu_{' + 'x_{'.repeat(100) + '}'.repeat(100),
    ];

    for (const input of hostileInputs) {
      const start = performance.now();
      expect(() => detectFormulaTerms(input)).not.toThrow();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50); // Well within time budget
    }
  });

  it('diffs existing terms to flag stale and missing definitions', () => {
    const formula = 'P V = n R T';
    const existing = [
      { symbol: 'P', name: 'Pressure', definition: 'Force / area' },
      { symbol: 'V', name: 'Volume', definition: 'Volume' },
      { symbol: 'Q', name: 'Heat', definition: 'Old thermal heat' }, // Stale!
    ];

    const diff = diffTerms(formula, existing);

    expect(diff.stale.map((s) => s.symbol)).toEqual(['Q']);
    expect(diff.missing).toContain('n');
    expect(diff.missing).toContain('R');
    expect(diff.missing).toContain('T');
    expect(diff.missing).not.toContain('P');
    expect(diff.missing).not.toContain('V');
  });
});
