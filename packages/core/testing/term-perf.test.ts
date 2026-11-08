import { describe, it, expect } from 'vitest';
import { detectFormulaTerms, diffTerms } from '../math/terms.js';
import { resolveCardTerm, type TermDefinition } from '../model/index.js';

describe('Term Performance Benchmark', () => {
  it('detects symbols across 2,000 cards in milliseconds', () => {
    // Generate 2,000 realistic formulas with varying complexity
    const baseFormulas = [
      '\\frac{\\partial \\mathbf{u}}{\\partial t} + (\\mathbf{u} \\cdot \\nabla)\\mathbf{u} = -\\frac{1}{\\rho}\\nabla p + \\nu \\nabla^2 \\mathbf{u}',
      'Re = \\frac{\\rho u L}{\\mu}',
      'PV = nRT',
      'E = \\frac{1}{2}mv^2',
      '\\Delta G = \\Delta H - T\\Delta S',
      'P = \\hat{\\rho} R T',
      '\\nabla \\cdot \\mathbf{u} = 0',
      'Ma = \\frac{u}{a}',
      '\\frac{\\partial T}{\\partial t} + \\mathbf{u} \\cdot \\nabla T = \\alpha \\nabla^2 T',
    ];

    const deck2000: string[] = [];
    for (let i = 0; i < 2000; i++) {
      deck2000.push(baseFormulas[i % baseFormulas.length]);
    }

    const start = performance.now();
    let totalDetected = 0;
    for (const formula of deck2000) {
      const terms = detectFormulaTerms(formula);
      totalDetected += terms.length;
    }
    const duration = performance.now() - start;

    console.log(`[Performance] Detected ${totalDetected} symbols across 2,000 cards in ${duration.toFixed(2)} ms (${(duration / 2000).toFixed(4)} ms/card).`);

    // Budget: 2,000 cards must finish well within 500 ms (typically ~30-70 ms)
    expect(duration).toBeLessThan(500);
    expect(totalDetected).toBeGreaterThan(6000);
  });

  it('measures terms diffing and resolution over complex formulas within budget', () => {
    const complexFormula = '\\frac{\\partial \\mathbf{u}}{\\partial t} + (\\mathbf{u} \\cdot \\nabla)\\mathbf{u} = -\\frac{1}{\\rho}\\nabla p + \\nu \\nabla^2 \\mathbf{u} + \\nu_t \\nabla^2 \\mathbf{u} + \\mathbf{g}';
    const existingTerms: TermDefinition[] = [
      { symbol: '\\mathbf{u}', name: 'Velocity', definition: 'Vector field', units: 'm/s' },
      { symbol: 't', name: 'Time', definition: 'Coordinate', units: 's' },
      { symbol: '\\rho', name: 'Density', definition: 'Fluid density', units: 'kg/m^3' },
      { symbol: 'p', name: 'Pressure', definition: 'Static pressure', units: 'Pa' },
      { symbol: '\\nu', name: 'Viscosity', definition: 'Kinematic viscosity', units: 'm^2/s' },
      { symbol: 'Q', name: 'Stale term', definition: 'Old term' },
    ];
    const glossary: Record<string, TermDefinition> = {
      '\\mathbf{g}': { symbol: '\\mathbf{g}', name: 'Gravity', definition: 'Gravitational acceleration', units: 'm/s^2' },
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const diff = diffTerms(complexFormula, existingTerms);
      for (const sym of diff.current) {
        resolveCardTerm(sym, existingTerms, glossary);
      }
    }
    const duration = performance.now() - start;
    console.log(`[Performance] 1,000 diff & resolution cycles on Navier-Stokes finished in ${duration.toFixed(2)} ms (${(duration / 1000).toFixed(4)} ms/op).`);

    // 1,000 cycles on complex formula should be comfortably sub-second
    expect(duration).toBeLessThan(1000);
  });
});
