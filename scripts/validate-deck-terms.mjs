import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GREEK_COMMANDS = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon',
  'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa', 'varkappa',
  'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho',
  'sigma', 'varsigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi',
  'psi', 'omega',
  'Gamma', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma',
  'Upsilon', 'Phi', 'Psi', 'Omega',
]);

const EXCLUDED_COMMANDS = new Set([
  'nabla', 'partial', 'int', 'iint', 'iiint', 'oint', 'sum', 'prod',
  'frac', 'dfrac', 'tfrac', 'sqrt', 'left', 'right',
  'cdot', 'times', 'div', 'pm', 'mp', 'le', 'leq', 'ge', 'geq',
  'approx', 'equiv', 'propto', 'sim', 'cong', 'neq', 'ne',
  'subset', 'subseteq', 'cup', 'cap', 'in', 'notin',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'ln', 'log', 'exp', 'det', 'dim', 'ker', 'lim', 'max', 'min',
  'bigl', 'bigr', 'Bigl', 'Bigr', 'biggl', 'biggr', 'Biggl', 'Biggr',
  'quad', 'qquad', ',', ';', '!', ' ',
]);

const NAMED_QUANTITIES = new Set([
  'Re', 'Pr', 'Ma', 'Kn', 'Nu', 'Pe', 'Fr', 'Sc', 'St', 'We', 'Gr', 'Ra', 'Bi', 'Fo',
]);

function normalizeSymbolKey(symbol) {
  if (!symbol) return '';
  let s = symbol.trim().replace(/^[$]+|[$]+$/g, '').trim();
  s = s.replace(/\s*([_^{}()])\s*/g, '$1');
  s = s.replace(/_([a-zA-Z0-9])/g, '_{$1}');
  s = s.replace(/\^([a-zA-Z0-9])/g, '^{$1}');
  s = s.replace(/_\{+([^{}]+)\}+/g, '_{$1}');
  s = s.replace(/\^\{+([^{}]+)\}+/g, '^{$1}');
  return s.replace(/\s+/g, ' ').trim();
}

function detectFormulaTerms(latex) {
  if (!latex) return [];
  const input = latex.length > 10000 ? latex.slice(0, 10000) : latex;
  const detected = [];
  const seen = new Set();

  const add = (sym) => {
    const trimmed = sym.trim();
    if (!trimmed) return;
    const k = normalizeSymbolKey(trimmed);
    if (!k || seen.has(k)) return;
    seen.add(k);
    detected.push(trimmed);
  };

  const namedRegex = /\\(?:mathrm|text|operatorname)\{([A-Z][a-z]+)\}|(?:\b|^)([A-Z][a-z]+)(?:\b|$)/g;
  let match;
  while ((match = namedRegex.exec(input)) !== null) {
    const name = match[1] || match[2];
    if (NAMED_QUANTITIES.has(name)) add(name);
  }

  const styledRegex = /\\(mathbf|boldsymbol|vec|hat|bar|dot|ddot|tilde|widecheck|widehat|widetilde|overline)\s*\{([^}]+)\}(?:_\{?[^{}\s]+\}?)*/g;
  while ((match = styledRegex.exec(input)) !== null) {
    add(match[0]);
  }

  const deltaRegex = /\\Delta\s*([a-zA-Z])/g;
  while ((match = deltaRegex.exec(input)) !== null) {
    add(`\\Delta ${match[1]}`);
  }

  const greekRegex = /\\([a-zA-Z]+)(?:_\{?[a-zA-Z0-9+\-*]+\}?)*(?![a-zA-Z])/g;
  while ((match = greekRegex.exec(input)) !== null) {
    if (GREEK_COMMANDS.has(match[1])) add(match[0]);
  }

  const latinRegex = /(?<!\\|[a-zA-Z])([a-zA-Z])(?:_\{?[a-zA-Z0-9+\-*]+\}?)*(?![a-zA-Z])/g;
  while ((match = latinRegex.exec(input)) !== null) {
    const base = match[1];
    if (match[0].trim().length > 0 && !EXCLUDED_COMMANDS.has(base)) {
      const idx = match.index;
      const preceding = input.slice(Math.max(0, idx - 8), idx);
      if (!/\\Delta\s*$/.test(preceding)) {
        add(match[0]);
      }
    }
  }

  return detected;
}

function resolveCardTerm(symbol, cardTerms, setGlossary) {
  if (!symbol) return undefined;
  const targetKey = normalizeSymbolKey(symbol);
  if (cardTerms && cardTerms.length > 0) {
    const found = cardTerms.find((t) => normalizeSymbolKey(t.symbol) === targetKey);
    if (found) return found;
  }
  if (setGlossary) {
    for (const [key, term] of Object.entries(setGlossary)) {
      if (normalizeSymbolKey(key) === targetKey || normalizeSymbolKey(term.symbol) === targetKey) {
        return term;
      }
    }
  }
  return undefined;
}

const sampleDeckTsPath = resolve(__dirname, '../apps/app/src/data/sample-deck.ts');
const fileContent = readFileSync(sampleDeckTsPath, 'utf-8');

const glossaryMatch = fileContent.match(/export const CFD_GLOSSARY:\s*Record<string,\s*TermDefinition>\s*=\s*(\{[\s\S]*?\n\};)/);
const deckMatch = fileContent.match(/export const SAMPLE_DECK:\s*FlashcardItem\[\]\s*=\s*(\[[\s\S]*?\n\];)/);

if (!glossaryMatch || !deckMatch) {
  console.error('Could not locate CFD_GLOSSARY or SAMPLE_DECK in sample-deck.ts');
  process.exit(1);
}

const CFD_GLOSSARY = Function(`"use strict"; return (${glossaryMatch[1].replace(/;$/, '')});`)();
const SAMPLE_DECK = Function(`"use strict"; return (${deckMatch[1].replace(/;$/, '')});`)();

function validateDeckTerms() {
  console.log('--- Validating CFD Default Deck Term Definitions ---');
  let totalCards = SAMPLE_DECK.length;
  let totalDetectedSymbols = 0;
  let totalResolvedSymbols = 0;
  const undefinedSymbolsReport = [];

  for (const card of SAMPLE_DECK) {
    const detected = detectFormulaTerms(card.latexAnswer);
    totalDetectedSymbols += detected.length;

    for (const sym of detected) {
      const resolved = resolveCardTerm(sym, card.terms, CFD_GLOSSARY);
      if (resolved && resolved.definition && resolved.definition.trim().length > 0) {
        totalResolvedSymbols += 1;
      } else {
        undefinedSymbolsReport.push({
          cardId: card.id,
          cardTitle: card.title,
          symbol: sym,
          normalizedKey: normalizeSymbolKey(sym),
        });
      }
    }
  }

  const coveragePercent = ((totalResolvedSymbols / totalDetectedSymbols) * 100).toFixed(1);

  console.log(`Cards validated: ${totalCards}`);
  console.log(`Total detected symbols: ${totalDetectedSymbols}`);
  console.log(`Total defined/resolved symbols: ${totalResolvedSymbols}`);
  console.log(`Term Coverage: ${coveragePercent}%`);

  if (undefinedSymbolsReport.length > 0) {
    console.warn('\nUndefined symbols found for review:');
    for (const u of undefinedSymbolsReport) {
      console.warn(` - Card "${u.cardTitle}" [${u.cardId}]: symbol "${u.symbol}"`);
    }
    process.exit(1);
  } else {
    console.log('\nAll detected symbols across the default CFD deck successfully resolve to comprehensive definitions! [100% coverage]');
    process.exit(0);
  }
}

validateDeckTerms();
