import type { FlashsetBundle } from './flashset.js';
import type { CardSet, Card, RichContent } from '../model/index.js';

export function parseQuizletExport(
  rawText: string,
  setName: string,
  termSeparator: string = '\t',
  rowSeparator: string = '\n'
): FlashsetBundle {
  const setId = crypto.randomUUID();
  const now = Date.now();

  const set: CardSet = {
    id: setId,
    title: setName,
    tags: [],
    createdAt: now,
    updatedAt: now,
    settings: {},
    defaultCardType: 'basic',
    extra: {},
  };

  const rows = rawText.split(rowSeparator);
  const cards: Card[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.trim() === '') continue;

    const parts = row.split(termSeparator);
    if (parts.length < 2) continue; // Skip malformed rows

    // Join extra parts into definition if there are multiple separators
    const frontText = parts[0]?.trim() || '';
    const backText = parts.slice(1).join(termSeparator).trim();

    if (!frontText && !backText) continue;

    const frontContent: RichContent = [{ t: 'text', v: frontText }];
    const backContent: RichContent = [{ t: 'text', v: backText }];

    cards.push({
      id: crypto.randomUUID(),
      setId,
      order: cards.length,
      type: 'basic',
      front: frontContent,
      back: backContent,
      answer: { checker: 'text', accepted: [], options: {} },
      hints: [],
      tags: [],
      starred: false,
      media: [],
      extra: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    version: 1,
    schemaVersion: '1.0.0',
    exportedAt: now,
    set,
    cards,
  };
}
