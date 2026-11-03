import type { Card, RichContent, Segment } from '../model/index';

// Extracts text and math latex from RichContent segments.
function extractContentString(content: RichContent): string {
  return content
    .map((seg: Segment): string => (seg.t === 'text' ? seg.v : seg.t === 'math' ? seg.latex : ''))
    .join(' ');
}

// Calculates Levenshtein distance between two strings.
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i: number = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j: number = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i: number = 1; i <= b.length; i++) {
    for (let j: number = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length] as number;
}

// Returns a fuzzy match score for a target against a query.
function getMatchScore(target: string, query: string): number {
  const t: string = target.toLowerCase();
  const q: string = query.toLowerCase();
  if (!t || !q) return 0;
  if (t === q) return 100;

  const words: string[] = t.split(/\s+/);
  if (words.some((w) => w === q)) return 100;

  if (t.includes(q)) return t.startsWith(q) ? 90 : 80;

  const distance: number = levenshtein(t, q);
  const similarity: number = 1 - distance / Math.max(t.length, q.length);
  if (similarity > 0.7) return similarity * 70;

  let bestWordScore: number = 0;
  for (const word of words) {
    if (word.includes(q)) {
      bestWordScore = Math.max(bestWordScore, word.startsWith(q) ? 90 : 80);
    }
    const d: number = levenshtein(word, q);
    const sim: number = 1 - d / Math.max(word.length, q.length);
    if (sim > 0.7) {
      bestWordScore = Math.max(bestWordScore, sim * 60);
    }
  }
  return bestWordScore;
}

export interface SearchResult {
  card: Card;
  score: number;
}

// Searches cards by term, definition, latex, and tags.
export function searchCards(cards: Card[], query: string): SearchResult[] {
  if (!query.trim()) return cards.map((card: Card): SearchResult => ({ card, score: 0 }));

  const results: SearchResult[] = cards.map((card: Card): SearchResult => {
    const frontText: string = extractContentString(card.front);
    const backText: string = extractContentString(card.back);
    const tagsText: string = card.tags.join(' ');

    const frontScore: number = getMatchScore(frontText, query);
    const backScore: number = getMatchScore(backText, query) * 0.9;
    const tagsScore: number = getMatchScore(tagsText, query) * 0.8;

    const maxScore: number = Math.max(frontScore, backScore, tagsScore);

    return { card, score: maxScore };
  });

  return results
    .filter((res: SearchResult): boolean => res.score > 0)
    .sort((a: SearchResult, b: SearchResult): number => b.score - a.score);
}
