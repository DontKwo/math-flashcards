import { describe, it, expect } from 'vitest';
import { parseQuizletExport } from './quizlet.js';
import type { Segment } from '../model/index.js';

describe('quizlet export parsing', () => {
  it('should parse standard tab/newline separated exports', () => {
    const raw = "term1\tdefinition1\nterm2\tdefinition2\n\n";
    const bundle = parseQuizletExport(raw, 'My Set');

    expect(bundle.set.title).toBe('My Set');
    expect(bundle.cards).toHaveLength(2);
    expect(bundle.cards[0]?.front[0]).toEqual({ t: 'text', v: 'term1' } as Segment);
    expect(bundle.cards[0]?.back[0]).toEqual({ t: 'text', v: 'definition1' } as Segment);
    expect(bundle.cards[1]?.front[0]).toEqual({ t: 'text', v: 'term2' } as Segment);
    expect(bundle.cards[1]?.back[0]).toEqual({ t: 'text', v: 'definition2' } as Segment);
  });

  it('should parse custom separators', () => {
    const raw = "word1-def1;word2-def2";
    const bundle = parseQuizletExport(raw, 'Custom Set', '-', ';');

    expect(bundle.set.title).toBe('Custom Set');
    expect(bundle.cards).toHaveLength(2);
    expect(bundle.cards[0]?.front[0]).toEqual({ t: 'text', v: 'word1' } as Segment);
    expect(bundle.cards[0]?.back[0]).toEqual({ t: 'text', v: 'def1' } as Segment);
    expect(bundle.cards[1]?.front[0]).toEqual({ t: 'text', v: 'word2' } as Segment);
    expect(bundle.cards[1]?.back[0]).toEqual({ t: 'text', v: 'def2' } as Segment);
  });

  it('should ignore empty or whitespace-only lines', () => {
    const raw = "t1\td1\n  \n\nt2\td2\n";
    const bundle = parseQuizletExport(raw, 'Ignore Whitespace');

    expect(bundle.cards).toHaveLength(2);
  });

  it('should gracefully handle malformed lines', () => {
    const raw = "t1\td1\nmissing_separator\nt2\td2\n";
    const bundle = parseQuizletExport(raw, 'Malformed Lines');

    expect(bundle.cards).toHaveLength(2);
    expect(bundle.cards[0]?.front[0]).toEqual({ t: 'text', v: 't1' } as Segment);
    expect(bundle.cards[1]?.front[0]).toEqual({ t: 'text', v: 't2' } as Segment);
  });

  it('should assign a valid set id to cards', () => {
    const raw = "t1\td1";
    const bundle = parseQuizletExport(raw, 'Set ID test');

    const setId = bundle.set.id;
    expect(bundle.cards[0]?.setId).toBe(setId);
    expect(bundle.cards[0]?.id).toBeDefined();
  });
});
