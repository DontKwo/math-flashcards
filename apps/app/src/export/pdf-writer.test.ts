import { describe, it, expect } from 'vitest';
import {
  layoutDocument,
  DEFAULT_EXPORT_OPTIONS,
  BUILTIN_PRESETS,
  ExportPresetSchema,
  type SetSourceData,
} from '@formulaflash/core';
import { writeDocumentToPdf } from './pdf-writer.ts';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

describe('PDF Writer & Output Validation', () => {
  const sampleSet: SetSourceData = {
    id: 'writer-test-deck',
    name: 'Fluid & Thermo Reference',
    category: 'Physics & Engineering',
    cards: [
      {
        id: 'c1',
        category: 'Fluid Dynamics',
        title: 'Navier-Stokes Equation',
        prompt: 'State the momentum conservation equation for an incompressible Newtonian fluid:',
        latexAnswer: '\\rho \\left( \\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u} \\cdot \\nabla \\mathbf{u} \\right) = -\\nabla p + \\mu \\nabla^2 \\mathbf{u} + \\mathbf{f}',
        hint: 'Inertia on the left, pressure gradient and viscosity on the right.',
        terms: [
          { symbol: '\\rho', name: 'Density', units: 'kg/m^3' },
          { symbol: '\\mathbf{u}', name: 'Velocity', units: 'm/s' },
          { symbol: 'p', name: 'Pressure', units: 'Pa' },
          { symbol: '\\mu', name: 'Dynamic viscosity', units: 'Pa*s' },
        ],
      },
      {
        id: 'c2',
        category: 'Thermodynamics',
        title: 'Ideal Gas Law',
        prompt: 'State the equation of state relating pressure, volume, moles, and temperature:',
        latexAnswer: 'PV = nRT',
        hint: 'Pressure times volume equals n R T.',
        terms: [
          { symbol: 'P', name: 'Pressure', units: 'Pa' },
          { symbol: 'V', name: 'Volume', units: 'm^3' },
          { symbol: 'n', name: 'Amount', units: 'mol' },
          { symbol: 'R', name: 'Gas constant', units: 'J/(mol*K)' },
          { symbol: 'T', name: 'Temperature', units: 'K' },
        ],
      },
    ],
  };

  it('generates a valid binary PDF and parses it back with pdfjs-dist', async () => {
    const docModel = layoutDocument(sampleSet, {
      ...DEFAULT_EXPORT_OPTIONS,
      pageSize: 'A4',
      orientation: 'portrait',
      columns: 2,
      showPrompt: true,
      showFormula: true,
      includeGlossaryAppendix: true,
    });

    const pdfBytes = await writeDocumentToPdf(docModel);
    expect(pdfBytes.byteLength).toBeGreaterThan(1000);

    // Parse the PDF back using pdfjs-dist
    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdfDoc = await loadingTask.promise;

    expect(pdfDoc.numPages).toBe(docModel.pages.length);

    // Verify text content on first page
    const firstPage = await pdfDoc.getPage(1);
    const textContent = await firstPage.getTextContent();
    const allStrings = textContent.items.map((i: unknown) => (i as { str: string }).str).join(' ');

    expect(allStrings).toContain('Navier-Stokes Equation');
    expect(allStrings).toContain('Fluid & Thermo Reference');
    expect(allStrings).toContain('Page 1 of');
  });

  it('validates all built-in presets against ExportPresetSchema', () => {
    for (const preset of BUILTIN_PRESETS) {
      const parsed = ExportPresetSchema.safeParse(preset);
      expect(parsed.success).toBe(true);
    }
  });

  it('handles corrupted and old-version preset JSON gracefully without throwing', () => {
    const corruptedPresets = [
      {},
      { id: 'bad-1', name: '' },
      { id: 'bad-2', name: 'Bad Preset', version: 99, options: { pageSize: 'NonExistentSize' } },
      { id: 'bad-3', name: 'Broken', options: { columns: -5 } },
    ];

    for (const bad of corruptedPresets) {
      const result = ExportPresetSchema.safeParse(bad);
      expect(result.success).toBe(false);
    }
  });
});
