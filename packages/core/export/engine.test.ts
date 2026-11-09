import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  layoutDocument,
  layoutWithAutoFit,
  type CardSourceData,
  type SetSourceData,
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
  type PageSizeName,
  type PageOrientation,
  type FillOrder,
} from './index.js';

describe('PDF Layout Engine Property Tests', () => {
  const cardArbitrary = fc.record({
    id: fc.uuid(),
    category: fc.oneof(fc.constant('Thermodynamics'), fc.constant('Fluid Dynamics'), fc.constant('Math & Physics')),
    title: fc.string({ minLength: 1, maxLength: 80 }),
    prompt: fc.option(fc.string({ maxLength: 120 })),
    latexAnswer: fc.oneof(
      fc.constant('PV = nRT'),
      fc.constant('\\frac{\\partial T}{\\partial t} + \\mathbf{u} \\cdot \\nabla T = \\alpha \\nabla^2 T'),
      fc.constant('E = mc^2'),
      fc.constant('x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}')
    ),
    hint: fc.option(fc.string({ maxLength: 80 })),
    explanation: fc.option(fc.string({ maxLength: 150 })),
    terms: fc.constant([
      { symbol: 'P', name: 'Pressure', definition: 'Force per unit area.', units: 'Pa' },
      { symbol: 'V', name: 'Volume', definition: 'Spatial extent.', units: 'm^3' },
    ]),
  });

  const optionsArbitrary = fc.record({
    pageSize: fc.constantFrom<PageSizeName>('A4', 'Letter', 'A5', 'Legal'),
    orientation: fc.constantFrom<PageOrientation>('portrait', 'landscape'),
    columns: fc.integer({ min: 1, max: 6 }),
    columnGap: fc.constantFrom(6, 10, 14),
    rowGap: fc.constantFrom(6, 10, 14),
    fillOrder: fc.constantFrom<FillOrder>('down-columns', 'across-rows'),
    globalScale: fc.constantFrom(0.8, 1.0, 1.2),
    keepCardsTogether: fc.boolean(),
    groupByCategory: fc.boolean(),
    showPrompt: fc.boolean(),
    showFormula: fc.boolean(),
    showHint: fc.boolean(),
  });

  it('runs property tests asserting layout invariants across thousands of option permutations', () => {
    let testCount = 0;
    fc.assert(
      fc.property(
        fc.array(cardArbitrary, { minLength: 0, maxLength: 30 }),
        optionsArbitrary,
        (rawCards, partialOpts) => {
          testCount++;
          const cards: CardSourceData[] = rawCards.map((c) => ({
            id: c.id,
            category: c.category,
            title: c.title,
            prompt: c.prompt ?? undefined,
            latexAnswer: c.latexAnswer,
            hint: c.hint ?? undefined,
            explanation: c.explanation ?? undefined,
            terms: [...c.terms],
          }));

          const setData: SetSourceData = {
            id: 'test-set',
            name: 'Property Test Set',
            cards,
          };

          const fullOptions: ExportOptions = {
            ...DEFAULT_EXPORT_OPTIONS,
            ...partialOpts,
          };

          const doc = layoutDocument(setData, fullOptions);

          // Invariant 1: Never crashes and produces at least one page
          expect(doc.pages.length).toBeGreaterThanOrEqual(1);

          // Invariant 2: Every selected card appears exactly once in the layout
          const renderedCardIds = doc.pages.flatMap((p) =>
            p.boxes.filter((b) => b.type === 'card' && b.cardId).map((b) => b.cardId!)
          );

          if (cards.length > 0) {
            expect(renderedCardIds.length).toBe(cards.length);
            for (const c of cards) {
              expect(renderedCardIds).toContain(c.id);
            }
          }

          // Invariant 3: No box exceeds page margins or has negative dimensions
          for (const page of doc.pages) {
            for (const box of page.boxes) {
              expect(box.rect.width).toBeGreaterThan(0);
              expect(box.rect.height).toBeGreaterThan(0);
              expect(box.rect.x).toBeGreaterThanOrEqual(page.margins.left - 0.1);
              expect(box.rect.y).toBeGreaterThanOrEqual(page.margins.top - 0.1);
              expect(box.rect.x + box.rect.width).toBeLessThanOrEqual(page.width - page.margins.right + 0.1);
            }
          }
        }
      ),
      { numRuns: 1000 }
    );
    console.log(`[Property Tests] Completed ${testCount} randomized layout invariant runs successfully.`);
  });

  it('honors fitToPageCount auto-scaling without exceeding target page limit', () => {
    const cards: CardSourceData[] = Array.from({ length: 40 }, (_, idx) => ({
      id: `card-${idx}`,
      category: 'Thermodynamics',
      title: `Equation Title #${idx}`,
      prompt: `Explain thermodynamic relationship number ${idx}`,
      latexAnswer: 'PV = nRT',
    }));

    const setData: SetSourceData = {
      id: 'auto-fit-set',
      name: 'Auto-Fit Set',
      cards,
    };

    const targetPages = 2;
    const doc = layoutWithAutoFit(setData, {
      ...DEFAULT_EXPORT_OPTIONS,
      pageSize: 'A4',
      orientation: 'portrait',
      columns: 2,
      fitToPageCount: targetPages,
    });

    expect(doc.pages.length).toBeLessThanOrEqual(targetPages);
  });

  it('benchmarks layout engine performance on 2,000 cards under 500 ms', () => {
    const largeDeck: CardSourceData[] = Array.from({ length: 2000 }, (_, idx) => ({
      id: `perf-card-${idx}`,
      category: idx % 2 === 0 ? 'Fluid Dynamics' : 'Physical Chemistry',
      title: `Turbulent Kinetic Energy Transport Model ${idx}`,
      prompt: `State the balance of turbulent kinetic energy dissipation rate for index ${idx}:`,
      latexAnswer: '\\frac{\\partial k}{\\partial t} + U_j \\frac{\\partial k}{\\partial x_j} = \\tau_{ij} \\frac{\\partial U_i}{\\partial x_j} - \\epsilon + \\dots',
      hint: 'Inertia balance with production and dissipation.',
      terms: [
        { symbol: 'k', name: 'Turbulent kinetic energy', units: 'm^2/s^2' },
        { symbol: '\\epsilon', name: 'Dissipation rate', units: 'm^2/s^3' },
      ],
    }));

    const setData: SetSourceData = {
      id: 'perf-set-2000',
      name: 'CFD Mega Set 2,000 Cards',
      cards: largeDeck,
    };

    const start = performance.now();
    const doc = layoutDocument(setData, {
      ...DEFAULT_EXPORT_OPTIONS,
      pageSize: 'A4',
      orientation: 'portrait',
      columns: 3,
      groupByCategory: true,
      includeGlossaryAppendix: true,
    });
    const duration = performance.now() - start;

    console.log(`[Benchmark] 2,000-card layout engine completed in ${duration.toFixed(2)} ms across ${doc.pages.length} pages.`);
    expect(duration).toBeLessThan(500);
    expect(doc.pages.length).toBeGreaterThan(10);
  });
});
