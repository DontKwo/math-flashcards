export interface PreprocessOptions {
  accentsMatter?: boolean;
  greekVariantsEqual?: boolean;
}

export function preprocessLatex(latex: string, options?: PreprocessOptions): string {
  const accentsMatter = options?.accentsMatter ?? true;
  const greekVariantsEqual = options?.greekVariantsEqual ?? true;

  let s = latex.trim();

  // Normalize left / right delimiters
  s = s.replace(/\\left\s*/g, '').replace(/\\right\s*/g, '');

  // Normalize \dfrac, \tfrac -> \frac
  s = s.replace(/\\(dfrac|tfrac)\b/g, '\\frac');

  // Normalize single digit/char braces in fractions: \frac12 -> \frac{1}{2}
  s = s.replace(/\\frac\s*([0-9a-zA-Z])\s*([0-9a-zA-Z])/g, '\\frac{$1}{$2}');

  // Normalize \cdot, \times, \ast
  s = s.replace(/\\(cdot|times|ast)\b/g, ' ');

  // Normalize \mathrm{...}, \text{...}, \operatorname{...}
  s = s.replace(/\\(mathrm|text|operatorname)\{([^}]+)\}/g, '$2');

  // Normalize \le -> \leq, \ge -> \geq
  s = s.replace(/\\le\b/g, '\\leq');
  s = s.replace(/\\ge\b/g, '\\geq');

  // Normalize Greek variants if enabled
  if (greekVariantsEqual) {
    s = s.replace(/\\varepsilon\b/g, '\\epsilon');
    s = s.replace(/\\vartheta\b/g, '\\theta');
    s = s.replace(/\\varphi\b/g, '\\phi');
    s = s.replace(/\\varpi\b/g, '\\pi');
    s = s.replace(/\\varrho\b/g, '\\rho');
  }

  // Handle accents
  if (!accentsMatter) {
    // Strip accents: \hat{x} -> x, \hat x -> x
    s = s.replace(/\\(hat|widehat|bar|vec|dot|ddot|tilde|widecheck|check)\{([^}]+)\}/g, '$2');
    s = s.replace(/\\(hat|widehat|bar|vec|dot|ddot|tilde|widecheck|check)\s*([a-zA-Z\\][a-zA-Z]*)/g, '$2');
  } else {
    // Normalize accent syntax: e.g. ensure \hat x -> \hat{x}
    s = s.replace(/\\(hat|widehat|bar|vec|dot|ddot|tilde|widecheck|check)\s+([a-zA-Z\\][a-zA-Z]*)/g, '\\$1{$2}');
  }

  // Normalize redundant single-character braces: ^{2} -> ^2, _{m} -> _m
  s = s.replace(/\^\{([0-9a-zA-Z])\}/g, '^$1');
  s = s.replace(/_\{([0-9a-zA-Z])\}/g, '_$1');

  // Normalize multiple spaces to single space
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}
