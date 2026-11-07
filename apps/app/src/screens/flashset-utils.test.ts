import { describe, it, expect, beforeEach } from 'vitest';
import { parseFlashsetFile, commitFlashsetImport } from './flashset-utils.ts';
import { InMemoryRepository } from '@formulaflash/core';
import type { CardSet, Card } from '@formulaflash/core';

describe('flashset-utils', () => {
  let repo: InMemoryRepository;

  beforeEach(() => {
    repo = new InMemoryRepository();
  });

  const validBundle = {
    version: 1,
    schemaVersion: '1.0.0',
    exportedAt: 1700000000000,
    set: {
      id: 'test-set-1',
      title: 'Newtonian Physics',
      tags: ['Physics', 'Forces'],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      settings: {},
      defaultCardType: 'equation',
      extra: {},
    } as CardSet,
    cards: [
      {
        id: 'card-1',
        setId: 'test-set-1',
        order: 0,
        type: 'equation',
        front: [{ t: 'text', v: "Newton's Second Law" }],
        back: [{ t: 'math', latex: 'F = ma' }],
        answer: { checker: 'math', accepted: [], options: {} },
        hints: [],
        tags: ['Physics'],
        starred: false,
        media: [],
        extra: {},
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      } as Card,
    ],
  };

  it('successfully parses valid flashset JSON', () => {
    const jsonStr = JSON.stringify(validBundle);
    const result = parseFlashsetFile(jsonStr);
    expect(result.success).toBe(true);
    expect(result.bundle?.set.title).toBe('Newtonian Physics');
  });

  it('returns informative error on corrupted JSON', () => {
    const result = parseFlashsetFile('{ invalid json');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns informative error on relational integrity mismatch', () => {
    const mismatchedBundle = {
      ...validBundle,
      cards: [
        {
          ...validBundle.cards[0],
          setId: 'wrong-set-id',
        },
      ],
    };
    const result = parseFlashsetFile(JSON.stringify(mismatchedBundle));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Integrity error');
  });

  it('commits imported flashset into repository', async () => {
    const res = parseFlashsetFile(JSON.stringify(validBundle));
    expect(res.bundle).toBeDefined();

    const imported = await commitFlashsetImport(res.bundle!, repo);
    expect(imported.title).toBe('Newtonian Physics');

    const savedSet = await repo.getSet(imported.id);
    expect(savedSet).toBeDefined();

    const savedCards = await repo.getCards(imported.id);
    expect(savedCards.length).toBe(1);
    expect(savedCards[0].back[0]).toEqual({ t: 'math', latex: 'F = ma' });
  });

  it('handles duplicate set IDs by assigning fresh unique IDs', async () => {
    const res = parseFlashsetFile(JSON.stringify(validBundle));
    // First import
    await commitFlashsetImport(res.bundle!, repo);

    // Second import of same bundle
    const secondImported = await commitFlashsetImport(res.bundle!, repo);
    expect(secondImported.id).not.toBe('test-set-1');
    expect(secondImported.title).toBe('Newtonian Physics (Imported)');
  });
});
