import type { RichContent, Card } from '@formulaflash/core';

// Converts RichContent segments into searchable plain text
export function richContentToText(content?: RichContent): string {
  if (!content || !Array.isArray(content)) return '';
  return content
    .map((seg) => {
      if (seg.t === 'text') return seg.v;
      if (seg.t === 'math') return seg.latex;
      return '';
    })
    .join(' ');
}

// Converts Card search representation including front and back LaTeX
export function cardToSearchableText(card: Card): string {
  const front = richContentToText(card.front);
  const back = richContentToText(card.back);
  const tags = card.tags.join(' ');
  return `${front} ${back} ${tags}`;
}

// Fuzzy match query against text
export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = text.toLowerCase();
  if (t.includes(q)) return true;

  // Subsequence matching for typo-tolerant fuzzy matching
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
    }
  }
  return qIdx === q.length;
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

// Splits text into matching and non-matching segments for highlighting
export function splitMatches(text: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (!q || !text) {
    return [{ text, isMatch: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const segments: HighlightSegment[] = [];

  let start = 0;
  let index = lowerText.indexOf(lowerQuery, start);

  while (index !== -1) {
    if (index > start) {
      segments.push({
        text: text.slice(start, index),
        isMatch: false,
      });
    }

    segments.push({
      text: text.slice(index, index + q.length),
      isMatch: true,
    });

    start = index + q.length;
    index = lowerText.indexOf(lowerQuery, start);
  }

  if (start < text.length) {
    segments.push({
      text: text.slice(start),
      isMatch: false,
    });
  }

  return segments;
}
