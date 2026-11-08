import { normalizeSymbolKey } from '../model/term-utils.js';
import type { TermDefinition } from '../model/index.js';

// Standard Greek letters in LaTeX
const GREEK_COMMANDS = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon',
  'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa', 'varkappa',
  'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho',
  'sigma', 'varsigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi',
  'psi', 'omega',
  'Gamma', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma',
  'Upsilon', 'Phi', 'Psi', 'Omega',
]);

// Excluded operators, functions, brackets, and structural commands
const EXCLUDED_COMMANDS = new Set([
  // Operators & calculus
  'nabla', 'partial', 'int', 'iint', 'iiint', 'oint', 'sum', 'prod',
  'frac', 'dfrac', 'tfrac', 'sqrt', 'left', 'right',
  'cdot', 'times', 'div', 'pm', 'mp', 'le', 'leq', 'ge', 'geq',
  'approx', 'equiv', 'propto', 'sim', 'cong', 'neq', 'ne',
  'subset', 'subseteq', 'cup', 'cap', 'in', 'notin',
  // Standard functions
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'ln', 'log', 'exp', 'det', 'dim', 'ker', 'lim', 'max', 'min',
  // Sizing & spacing
  'bigl', 'bigr', 'Bigl', 'Bigr', 'biggl', 'biggr', 'Biggl', 'Biggr',
  'quad', 'qquad', ',', ';', '!', ' ',
]);

// Common dimensionless/named quantities in physics and CFD
const NAMED_QUANTITIES = new Set([
  'Re', 'Pr', 'Ma', 'Kn', 'Nu', 'Pe', 'Fr', 'Sc', 'St', 'We', 'Gr', 'Ra', 'Bi', 'Fo',
]);

/**
 * Extracts distinct terms from a mathematical LaTeX formula.
 * Deterministic, never throws on invalid/hostile input, completes in milliseconds.
 */
export function detectFormulaTerms(latex: string): string[] {
  if (!latex || typeof latex !== 'string') return [];

  const input = latex.length > 10000 ? latex.slice(0, 10000) : latex;

  const detected: string[] = [];
  const seenNormalized = new Set<string>();

  const addTerm = (raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const key = normalizeSymbolKey(trimmed);
    if (!key || seenNormalized.has(key)) return;
    seenNormalized.add(key);
    detected.push(trimmed);
  };

  // 1. Detect named quantities (e.g. \mathrm{Re}, \text{Re}, or standalone upright Re)
  const namedRegex = /\\(?:mathrm|text|operatorname)\{([A-Z][a-z]+)\}|(?:\b|^)([A-Z][a-z]+)(?:\b|$)/g;
  let match: RegExpExecArray | null;
  while ((match = namedRegex.exec(input)) !== null) {
    const name = match[1] || match[2];
    if (NAMED_QUANTITIES.has(name)) {
      addTerm(name);
    }
  }

  // 2. Tokenize styled / decorated constructs:
  // e.g. \mathbf{u}, \vec{v}, \hat{\rho}, \bar{u}, \dot{m}, etc., optionally with subscripts
  const styledRegex = /\\(mathbf|boldsymbol|vec|hat|bar|dot|ddot|tilde|widecheck|widehat|widetilde|overline)\s*\{([^}]+)\}(?:_\{?[^{}\s]+\}?)*/g;
  while ((match = styledRegex.exec(input)) !== null) {
    addTerm(match[0]);
  }

  // 3. Difference delta quantities: \Delta G, \Delta H, \Delta S
  const deltaRegex = /\\Delta\s*([a-zA-Z])/g;
  while ((match = deltaRegex.exec(input)) !== null) {
    addTerm(`\\Delta ${match[1]}`);
  }

  // 4. Greek letters with optional subscripts:
  // e.g. \nu_t, \nu_{t}, \rho
  const greekRegex = /\\([a-zA-Z]+)(?:_\{?[a-zA-Z0-9+\-*]+\}?)*(?![a-zA-Z])/g;
  while ((match = greekRegex.exec(input)) !== null) {
    const cmd = match[1];
    if (GREEK_COMMANDS.has(cmd)) {
      addTerm(match[0]);
    }
  }

  // 5. Latin letter variables with optional subscripts:
  // e.g. p, u, x, T, c_p, y^+ (ignoring powers ^2)
  const latinVarRegex = /(?<!\\|[a-zA-Z])([a-zA-Z])(?:_\{?[a-zA-Z0-9+\-*]+\}?)*(?![a-zA-Z])/g;
  while ((match = latinVarRegex.exec(input)) !== null) {
    const full = match[0].trim();
    const base = match[1];
    if (full.length > 0 && !EXCLUDED_COMMANDS.has(base)) {
      // Check if preceded by \Delta
      const idx = match.index;
      const preceding = input.slice(Math.max(0, idx - 8), idx);
      if (!/\\Delta\s*$/.test(preceding)) {
        addTerm(full);
      }
    }
  }

  return detected;
}

export interface TermDiffResult {
  current: string[];
  stale: TermDefinition[];
  missing: string[];
}

/**
 * Compares detected symbols in a formula with an existing list of term definitions.
 * Flags symbols that are no longer in the formula (stale) and detected symbols lacking definitions.
 */
export function diffTerms(formula: string, existingTerms: TermDefinition[] = []): TermDiffResult {
  const currentDetected = detectFormulaTerms(formula);
  const currentKeys = new Set(currentDetected.map(normalizeSymbolKey));

  const existingMap = new Map<string, TermDefinition>();
  for (const t of existingTerms) {
    existingMap.set(normalizeSymbolKey(t.symbol), t);
  }

  // Stale terms: defined on card, but no longer present in formula
  const stale: TermDefinition[] = [];
  for (const t of existingTerms) {
    const k = normalizeSymbolKey(t.symbol);
    if (!currentKeys.has(k)) {
      stale.push(t);
    }
  }

  // Missing terms: detected in formula, but not defined on card
  const missing: string[] = [];
  for (const sym of currentDetected) {
    const k = normalizeSymbolKey(sym);
    if (!existingMap.has(k) || !existingMap.get(k)?.definition?.trim()) {
      missing.push(sym);
    }
  }

  return {
    current: currentDetected,
    stale,
    missing,
  };
}
