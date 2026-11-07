import { describe, it, expect } from 'vitest';
import { validateLatex, validateCardRows } from './editor-validation.ts';

describe('editor-validation', () => {
  it('validates correct LaTeX strings', () => {
    expect(validateLatex('x^2 + y^2 = r^2')).toBeNull();
    expect(validateLatex('\\frac{1}{2}')).toBeNull();
  });

  it('detects invalid LaTeX syntax', () => {
    const error = validateLatex('\\frac{1}');
    expect(error).toBeTruthy();
  });

  it('flags duplicate front terms across cards', () => {
    const rows = [
      { id: '1', frontText: 'Gravity', answerText: '9.8', answerMode: 'text' as const },
      { id: '2', frontText: 'gravity', answerText: '9.81', answerMode: 'text' as const },
    ];
    const issues = validateCardRows(rows);
    expect(issues.some((i) => i.message.includes('Duplicate term with card #1'))).toBe(true);
  });

  it('flags empty answers', () => {
    const rows = [
      { id: '1', frontText: 'Ohm', answerText: '', answerMode: 'text' as const },
    ];
    const issues = validateCardRows(rows);
    expect(issues.some((i) => i.message === 'Answer is required')).toBe(true);
  });

  it('flags syntax warnings in math mode', () => {
    const rows = [
      { id: '1', frontText: 'Broken Math', answerText: '\\sqrt{', answerMode: 'math' as const },
    ];
    const issues = validateCardRows(rows);
    expect(issues.some((i) => i.message.includes('LaTeX syntax warning'))).toBe(true);
  });
});
