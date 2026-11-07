import katex from 'katex';

export interface ValidationIssue {
  cardId: string;
  field: 'front' | 'back';
  message: string;
  type: 'warning' | 'error';
}

export function validateLatex(latex: string): string | null {
  if (!latex.trim()) return null;
  try {
    katex.__parse(latex, { throwOnError: true });
    return null;
  } catch (err) {
    if (err instanceof Error) {
      return err.message.replace(/^KaTeX parse error:\s*/i, '');
    }
    return 'Invalid LaTeX syntax';
  }
}

export function validateCardRows(
  rows: Array<{ id: string; frontText: string; answerText: string; answerMode: 'text' | 'math' | 'mixed' }>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenTerms = new Map<string, string>();

  rows.forEach((row, index) => {
    const trimmedFront = row.frontText.trim().toLowerCase();
    if (trimmedFront) {
      if (seenTerms.has(trimmedFront)) {
        issues.push({
          cardId: row.id,
          field: 'front',
          message: `Duplicate term with card #${seenTerms.get(trimmedFront)}`,
          type: 'warning',
        });
      } else {
        seenTerms.set(trimmedFront, String(index + 1));
      }
    }

    if (!row.answerText.trim()) {
      issues.push({
        cardId: row.id,
        field: 'back',
        message: 'Answer is required',
        type: 'warning',
      });
    }

    if (row.answerMode === 'math' && row.answerText.trim()) {
      const latexError = validateLatex(row.answerText);
      if (latexError) {
        issues.push({
          cardId: row.id,
          field: 'back',
          message: `LaTeX syntax warning: ${latexError}`,
          type: 'warning',
        });
      }
    }
  });

  return issues;
}
