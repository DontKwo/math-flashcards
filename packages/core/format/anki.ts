import type { FlashsetBundle } from './flashset.js';
import type { CardSet, Card, RichContent } from '../model/index.js';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseMathSegments(text: string): RichContent {
  const segments: RichContent = [];
  let currentIdx = 0;

  // Regex to match \[ ... \] or $ ... $
  // Note: we want to match \[ ... \] first because $ ... $ could be a substring? No, they don't conflict directly.
  const regex = /(\\\[.*?\\\]|\$.*?\$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;

    if (start > currentIdx) {
      const t = text.substring(currentIdx, start);
      if (t) segments.push({ t: 'text', v: t });
    }

    const m = match[0];
    if (m.startsWith('\\[') && m.endsWith('\\]')) {
      const latex = m.substring(2, m.length - 2).trim();
      segments.push({ t: 'math', latex, display: true });
    } else if (m.startsWith('$') && m.endsWith('$')) {
      const latex = m.substring(1, m.length - 1).trim();
      segments.push({ t: 'math', latex, display: false });
    }

    currentIdx = end;
  }

  if (currentIdx < text.length) {
    const t = text.substring(currentIdx);
    if (t) segments.push({ t: 'text', v: t });
  }

  if (segments.length === 0 && text) {
    segments.push({ t: 'text', v: text });
  }

  return segments;
}

function parseAnkiLine(line: string): [string, string] | null {
  // Simple CSV/TSV parser
  // First, check if it's TSV (contains tabs)
  if (line.includes('\t')) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      return [parts[0] as string, parts[1] as string];
    }
    return null;
  }

  // If no tabs, attempt basic CSV
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);

  if (parts.length >= 2) {
    return [parts[0] as string, parts[1] as string];
  }
  return null;
}

export function parseAnkiExport(content: string, setName: string): FlashsetBundle {
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

  const lines = content.split(/\r?\n/);
  const cards: Card[] = [];
  let order = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith('#')) continue; // Skip Anki comments

    const parsed = parseAnkiLine(line);
    if (!parsed) continue;

    const [frontHtml, backHtml] = parsed;
    const frontText = stripHtml(frontHtml);
    const backText = stripHtml(backHtml);

    if (!frontText && !backText) continue;

    const frontSegments = parseMathSegments(frontText);
    const backSegments = parseMathSegments(backText);

    cards.push({
      id: crypto.randomUUID(),
      setId,
      order: order++,
      type: 'basic',
      front: frontSegments,
      back: backSegments,
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
