export interface PreprocessOptions {
  /**
   * Whether accents/decorations (\hat, \bar, \vec, \dot, etc.) distinguish symbols.
   * If false, decorators are stripped (e.g. \hat{R} -> R).
   * Default: true.
   */
  accentsMatter?: boolean;

  /**
   * Whether Greek letter variants (\epsilon vs \varepsilon, \phi vs \varphi, \theta vs \vartheta)
   * are unified to a standard variant.
   * Default: true.
   */
  greekVariantsEqual?: boolean;

  /**
   * Known unit names or custom unit recognizer.
   * If specified or matched against default SI/common scientific units,
   * \mathrm{...} or \text{...} wrapping these units will be preserved.
   */
  preservedUnits?: string[];
}

const DEFAULT_PRESERVED_UNITS = new Set([
  // Base SI & common derived units
  'm', 's', 'kg', 'g', 'mg', 'km', 'cm', 'mm', 'nm', 'pm',
  'J', 'kJ', 'MJ', 'W', 'kW', 'MW',
  'Pa', 'kPa', 'MPa', 'bar', 'atm', 'torr', 'mmHg',
  'mV', 'kV', 'mA', 'C', 'F', 'H', 'Hz', 'kHz', 'MHz', 'GHz',
  'mol', 'kmol', 'mmol',
  'K', 'degC', 'deg', 'rad',
  'L', 'mL', 'dL',
  'cal', 'kcal', 'eV', 'keV', 'MeV', 'GeV',
  'ohm', 'Omega',
]);

/**
 * Normalizes and preprocesses a LaTeX math string before AST parsing or equality checking.
 */
export function preprocessLatex(input: string, options: PreprocessOptions = {}): string {
  const accentsMatter = options.accentsMatter ?? true;
  const greekVariantsEqual = options.greekVariantsEqual ?? true;
  const preservedUnits = new Set([
    ...DEFAULT_PRESERVED_UNITS,
    ...(options.preservedUnits ?? []),
  ]);

  if (!input) return '';

  let s = input;

  // 1. Normalize line endings and strip comments (% to end of line)
  s = s.replace(/\r\n|\r/g, '\n');
  s = s.replace(/(^|[^\\])%.*$/gm, '$1');

  // Convert LaTeX spaces like '\ ', '\;', '\,', '\!' to normal space
  s = s.replace(/\\([,;! ])/g, ' ');

  // 2. Convert \dfrac and \tfrac to \frac
  s = s.replace(/\\(?:dfrac|tfrac)(?![a-zA-Z])/g, '\\frac');

  // 3. Standardize \left and \right delimiters and sizing commands
  // Remove invisible delimiters \left. and \right.
  s = s.replace(/\\left\./g, '');
  s = s.replace(/\\right\./g, '');

  // Normalize delimiters: \left( \right) -> ( ), etc.
  s = s.replace(/\\left\s*([()[\]|]|\\[{}|])/g, '$1');
  s = s.replace(/\\right\s*([()[\]|]|\\[{}|])/g, '$1');

  // Strip sizing commands like \bigl, \bigr, \Big, \bigg, etc.
  s = s.replace(/\\(?:big|Big|bigg|Bigg)[lrm]?\s*([()[\]|]|\\[{}|])/g, '$1');

  // 4. Normalize inequalities
  s = s.replace(/\\le(?![a-zA-Z])/g, '\\leq');
  s = s.replace(/\\ge(?![a-zA-Z])/g, '\\geq');

  // 5. Greek variant unification (\epsilon vs \varepsilon, \phi vs \varphi, \theta vs \vartheta, etc.)
  if (greekVariantsEqual) {
    s = s.replace(/\\varepsilon(?![a-zA-Z])/g, '\\epsilon');
    s = s.replace(/\\varphi(?![a-zA-Z])/g, '\\phi');
    s = s.replace(/\\vartheta(?![a-zA-Z])/g, '\\theta');
    s = s.replace(/\\varpi(?![a-zA-Z])/g, '\\pi');
    s = s.replace(/\\varrho(?![a-zA-Z])/g, '\\rho');
    s = s.replace(/\\varsigma(?![a-zA-Z])/g, '\\sigma');
  }

  // 6. Transform decorated symbols into distinct identifiers:
  // \hat{R} -> R__hat, \bar{x} -> x__bar, \vec{v} -> v__vec, \dot{x} -> x__dot, etc.
  // If accentsMatter is false, strip decorators instead of preserving them.
  const decoratorMap: Record<string, string> = {
    hat: 'hat',
    widehat: 'hat',
    bar: 'bar',
    overline: 'bar',
    vec: 'vec',
    dot: 'dot',
    ddot: 'ddot',
    tilde: 'tilde',
    widetilde: 'tilde',
    check: 'check',
    widecheck: 'check',
  };

  for (const dec of Object.keys(decoratorMap)) {
    const pattern = new RegExp(`\\\\${dec}\\s*(?:\\{([^{}]+)\\}|(\\\\[a-zA-Z]+|[a-zA-Z0-9]))`, 'g');
    s = s.replace(pattern, (_, braced, single) => {
      const inner = (braced !== undefined ? braced : single).trim();
      if (!accentsMatter) {
        return inner;
      }
      const suffix = decoratorMap[dec];
      const cleanInner = inner.startsWith('\\') ? inner.slice(1) : inner;
      return `${cleanInner}__${suffix}`;
    });
  }

  // 7. Strip \mathrm and \text wrappers around variables while preserving them for unit strings
  s = s.replace(/\\(mathrm|text|operatorname|mathbf|mathit)\s*\{([^{}]+)\}/g, (match, cmd, content) => {
    const trimmed = content.trim();
    if (isUnitString(trimmed, preservedUnits)) {
      return `\\${cmd}{${trimmed}}`;
    }
    return trimmed;
  });

  // 8. Unify multiplication symbols (\cdot, \times, explicit vs implicit where safe)
  s = s.replace(/\\times(?![a-zA-Z])/g, '\\cdot');
  s = s.replace(/\s*\*\s*/g, ' \\cdot ');

  // 9. Standardize single token sub/superscript braces (e.g. ^2 -> ^{2})
  s = s.replace(/\^([a-zA-Z0-9])(?![a-zA-Z0-9])/g, '^{$1}');
  s = s.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9])/g, '_{$1}');

  // 10. Normalize spacing around common operators and symbols
  s = s.replace(/\s*([=+\-*/()[\],|])\s*/g, '$1');
  s = s.replace(/\\\{\s*/g, '\\{');
  s = s.replace(/\s*\\\}/g, '\\}');
  s = s.replace(/\s*\\leq\s*/g, '\\leq ');
  s = s.replace(/\s*\\geq\s*/g, '\\geq ');
  s = s.replace(/\s*\\cdot\s*/g, ' \\cdot ');

  // 11. Normalize general whitespace and trim outer spaces
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Checks whether a given string in \mathrm{...} or \text{...} represents a unit string.
 */
function isUnitString(str: string, preservedUnits: Set<string>): boolean {
  if (preservedUnits.has(str)) return true;

  // Compound units like 'm/s', 'kg*m/s^2', 'N*m', 'N\cdot m', 'g/mol', etc.
  const parts = str.split(/[/·*.\s^0-9+-]+|\\cdot|\\times/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0 && parts.every((p) => preservedUnits.has(p))) {
    return true;
  }

  return false;
}
