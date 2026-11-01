import { describe, it, expect } from 'vitest';
import { exportFlashset, importFlashset } from './flashset.js';
import type { CardSet, Card } from '../model/index.js';

describe('flashset format', () => {
  const mockSet: CardSet = {
    id: 'set1',
    title: 'Test Set',
    tags: [],
    createdAt: 1000,
    updatedAt: 1000,
    settings: {},
    defaultCardType: 'basic',
    extra: {},
  };

  const mockCards: Card[] = [
    {
      id: 'card1',
      setId: 'set1',
      order: 0,
      type: 'basic',
      front: [{ t: 'text', v: 'Question' }],
      back: [{ t: 'text', v: 'Answer' }],
      answer: { checker: 'text', accepted: [], options: {} },
      hints: [],
      tags: [],
      starred: false,
      media: [],
      extra: {},
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  it('should successfully serialize and round-trip parsing', () => {
    const json = exportFlashset(mockSet, mockCards);
    const parsed = importFlashset(json);

    expect(parsed.version).toBe(1);
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.set).toEqual(mockSet);
    expect(parsed.cards).toEqual(mockCards);
    expect(parsed.progress).toBeUndefined();
  });

  it('should reject malformed JSON', () => {
    expect(() => importFlashset('{ invalid_json ')).toThrow('Invalid flashset');
  });

  it('should reject schema violations', () => {
    const bundle = {
      version: 1,
      schemaVersion: '1.0.0',
      exportedAt: 1000,
      set: mockSet,
      cards: [{ ...mockCards[0], front: undefined }], // Missing required front
    };
    expect(() => importFlashset(JSON.stringify(bundle))).toThrow('Schema validation failed');
  });

  it('should reject cards whose setId does not match the bundle set.id', () => {
    const invalidCards = [{ ...mockCards[0], setId: 'otherSet' }];
    const json = exportFlashset(mockSet, invalidCards);
    // exportFlashset doesn't check relational integrity itself, just schema
    expect(() => importFlashset(json)).toThrow('Integrity error: Card card1 does not belong to set set1');
  });
});
