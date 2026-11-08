/**
 * Normalizes a LaTeX symbol into a canonical storage key.
 * Ensures variants like \nu_t and \nu_{t}, \mathbf{u} and \mathbf {u} match.
 */
export function normalizeSymbolKey(symbol: string): string {
  if (!symbol) return '';
  let s = symbol.trim();

  // Strip leading/trailing delimiters if any
  s = s.replace(/^[$]+|[$]+$/g, '').trim();

  // Remove unnecessary spaces around braces, underscores, carets
  s = s.replace(/\s*([_^{}()])\s*/g, '$1');

  // Normalize single-character braces: _{x} -> _x, ^{x} -> ^x
  // But keep multi-character braces: _{t} -> _t, or keep uniform braces.
  // Standardizing to uniform braces _{foo} and ^{bar} ensures \nu_t and \nu_{t} both become \nu_{t}.
  s = s.replace(/_([a-zA-Z0-9])/g, '_{$1}');
  s = s.replace(/\^([a-zA-Z0-9])/g, '^{$1}');

  // Eliminate double braces if introduced
  s = s.replace(/_\{+([^{}]+)\}+/g, '_{$1}');
  s = s.replace(/\^\{+([^{}]+)\}+/g, '^{$1}');

  // Collapse inner multiple whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Strips raw HTML tags from input text for safety.
 */
export function sanitizePlainText(text?: string): string | undefined {
  if (text === undefined || text === null) return undefined;
  return text.replace(/<[^>]*>/g, '').trim();
}
