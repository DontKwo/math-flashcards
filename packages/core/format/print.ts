import type { CardSet, Card, RichContent, Segment } from '../model/index.js';

// Converts RichContent to string by concatenating text and math segments
export function richContentToString(content: RichContent): string {
  return content.map((seg: Segment): string => {
    if (seg.t === 'text') {
      return seg.v;
    }
    if (seg.t === 'math') {
      return seg.latex;
    }
    return '';
  }).join('');
}

// Generates printable HTML for a set of cards
export function generatePrintableHtml(set: CardSet, cards: Card[]): string {
  const cardsPerPage: number = 3;
  let html: string = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${set.title} - Flashcards</title>
<style>
  @page { size: letter portrait; margin: 0.5in; }
  body { font-family: sans-serif; }
  .page {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, 3in);
    gap: 0.5in;
    page-break-after: always;
    width: 5in;
    margin: 0 auto;
  }
  .card {
    border: 1px solid #ccc;
    padding: 0.5in;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    box-sizing: border-box;
    font-size: 18px;
    height: 3in;
    width: 5in;
  }
  @media print {
    .page { page-break-after: always; }
  }
</style>
</head>
<body>
`;

  const totalPages: number = Math.ceil(cards.length / cardsPerPage);

  for (let p: number = 0; p < totalPages; p++) {
    const chunk: Card[] = cards.slice(p * cardsPerPage, (p + 1) * cardsPerPage);

    // Front page
    html += `  <div class="page front-page">\n`;
    for (const card of chunk) {
      const frontContent: string = richContentToString(card.front);
      html += `    <div class="card">${frontContent}</div>\n`;
    }
    html += `  </div>\n`;

    // Back page
    html += `  <div class="page back-page">\n`;
    for (const card of chunk) {
      // Check for answer/accepted and concatenate
      let backContent: string = '';
      if (card.answer && card.answer.accepted && card.answer.accepted.length > 0) {
        backContent = richContentToString(card.answer.accepted[0].content);
      } else {
        backContent = richContentToString(card.back);
      }
      html += `    <div class="card">${backContent}</div>\n`;
    }
    html += `  </div>\n`;
  }

  html += `</body>\n</html>`;
  return html;
}
