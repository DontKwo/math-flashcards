import type { CardSet, Card, RichContent } from '../model/index.js';

/**
 * Converts RichContent into a string, wrapping math segments in Anki tags.
 */
function richContentToAnkiString(content: RichContent): string {
  return content
    .map((seg) => {
      if (seg.t === 'text') {
        return seg.v;
      }
      if (seg.t === 'math') {
        return `[$]${seg.latex}[/$]`;
      }
      return '';
    })
    .join('');
}

/**
 * Exports a set of cards to an Anki-compatible tab-delimited text format.
 */
export function exportToAnkiText(set: CardSet, cards: Card[]): string {
  const lines = cards.map((card) => {
    const frontText = richContentToAnkiString(card.front);
    const backText = richContentToAnkiString(card.back);
    return `${frontText}\t${backText}`;
  });

  return lines.join('\n');
}
