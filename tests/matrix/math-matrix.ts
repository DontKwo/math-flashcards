import { mathCorpus } from '../../packages/core/testing/math-corpus.ts';

export interface MathMatrixEvaluationCase {
  id: string;
  reference: string;
  given: string;
  expectedCorrect: boolean;
  options?: Record<string, unknown>;
  inputMode: 'typed-latex' | 'virtual-toolbar' | 'keystroke-sequence';
}

// Generate all math matrix cases from math-corpus
export function buildMathMatrixCases(): MathMatrixEvaluationCase[] {
  const cases: MathMatrixEvaluationCase[] = [];
  let index = 0;

  for (const item of mathCorpus) {
    // Accept cases
    for (const acc of item.accept) {
      const given = typeof acc === 'string' ? acc : acc.given;
      const options = typeof acc === 'string' ? undefined : acc.options;

      cases.push({
        id: `corpus-acc-${index++}`,
        reference: item.reference,
        given,
        expectedCorrect: true,
        options,
        inputMode: 'typed-latex',
      });
    }

    // Reject cases
    for (const rej of item.reject) {
      const given = typeof rej === 'string' ? rej : rej.given;
      const options = typeof rej === 'string' ? undefined : rej.options;

      cases.push({
        id: `corpus-rej-${index++}`,
        reference: item.reference,
        given,
        expectedCorrect: false,
        options,
        inputMode: 'typed-latex',
      });
    }
  }

  // Also add virtual toolbar keystroke cases
  cases.push({
    id: 'toolbar-fraction',
    reference: 'E = \\frac{1}{2} m v^{2}',
    given: 'E=\\frac{1}{2}mv^2',
    expectedCorrect: true,
    inputMode: 'virtual-toolbar',
  });

  cases.push({
    id: 'keystroke-power',
    reference: 'PV = nRT',
    given: 'PV=nRT',
    expectedCorrect: true,
    inputMode: 'keystroke-sequence',
  });

  return cases;
}
