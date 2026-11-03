import type { FlashsetBundle } from './flashset.js';
import type { Card, CardSet, RichContent, Segment } from '../model/index.js';

// Helper to generate a unique string ID
function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
}

// Basic markdown segmenter that extracts math
export function parseRichContent(text: string): RichContent {
  const segments: Segment[] = [];

  // A simple regex to catch $$...$$ (block) and $...$ (inline)
  // Be careful with escaped \$ if we supported it, but standard requirement is basic extraction.
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ t: 'text', v: text.substring(lastIndex, match.index) });
    }

    const mathStr = match[0];
    if (mathStr.startsWith('$$') && mathStr.endsWith('$$')) {
      segments.push({ t: 'math', latex: mathStr.slice(2, -2).trim(), display: true });
    } else {
      segments.push({ t: 'math', latex: mathStr.slice(1, -1).trim(), display: false });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ t: 'text', v: text.substring(lastIndex) });
  }

  // Optimize away empty text segments
  return segments.filter(seg => !(seg.t === 'text' && seg.v === ''));
}

// Parses the markdown content into a FlashsetBundle
export function parseMarkdownDeck(content: string, defaultTitle?: string): FlashsetBundle {
  const lines = content.split(/\r?\n/);

  let title = defaultTitle || 'Untitled';
  const cards: Card[] = [];

  const setId = generateId();

  let currentTerm: string | null = null;
  let currentDefinition: string[] = [];

  const addCard = (term: string, definition: string) => {
    const front = parseRichContent(term.trim());
    const back = parseRichContent(definition.trim());

    cards.push({
      id: generateId(),
      setId,
      order: cards.length,
      type: 'basic',
      front,
      back,
      answer: {
        checker: 'text',
        accepted: [{ content: back }],
        options: {}
      },
      hints: [],
      tags: [],
      starred: false,
      media: [],
      extra: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  // State machine for parsing
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Parse title (first # Heading)
    if (line.startsWith('# ') && cards.length === 0 && !currentTerm) {
      title = line.substring(2).trim();
      i++;
      continue;
    }

    // Parse heading-based cards: `## Term` followed by definition
    if (line.startsWith('## ')) {
      if (currentTerm !== null) {
        addCard(currentTerm, currentDefinition.join('\n'));
      }
      currentTerm = line.substring(3).trim();
      currentDefinition = [];
      i++;
      continue;
    }

    // Parse list-based cards: `- **Term**: Definition` or `- Term: Definition`
    const listMatch = line.match(/^-\s*(?:\*\*(.*?)\*\*|(.*?))\s*:\s*(.*)$/);
    if (listMatch) {
      if (currentTerm !== null) {
        addCard(currentTerm, currentDefinition.join('\n'));
        currentTerm = null;
        currentDefinition = [];
      }

      const term = listMatch[1] || listMatch[2];
      const definition = listMatch[3];
      addCard(term, definition);
      i++;
      continue;
    }

    if (currentTerm !== null) {
      currentDefinition.push(line);
    }

    i++;
  }

  if (currentTerm !== null) {
    addCard(currentTerm, currentDefinition.join('\n'));
  }

  const set: CardSet = {
    id: setId,
    title,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: {},
    defaultCardType: 'basic',
    extra: {},
  };

  return {
    version: 1,
    schemaVersion: '1.0.0',
    exportedAt: Date.now(),
    set,
    cards,
  };
}
