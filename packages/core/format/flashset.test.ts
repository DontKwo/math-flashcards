import { describe, it, expect } from 'vitest';
import { exportFlashset, importFlashset, migrateFlashsetBundle } from './flashset.js';
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
    glossary: {
      rho: {
        symbol: '\\rho',
        name: 'Density',
        definition: 'Fluid density',
        units: 'kg/m^3',
      },
    },
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
      terms: [
        {
          symbol: '\\nu',
          name: 'Kinematic viscosity',
          definition: 'Ratio of dynamic viscosity to density',
          units: 'm^2/s',
        },
      ],
    },
  ];

  it('should successfully serialize and round-trip parsing (v2)', () => {
    const json = exportFlashset(mockSet, mockCards);
    const parsed = importFlashset(json);

    expect(parsed.version).toBe(2);
    expect(parsed.schemaVersion).toBe('2.0.0');
    expect(parsed.set).toEqual(mockSet);
    expect(parsed.cards).toEqual(mockCards);
    expect(parsed.cards[0].terms?.[0].symbol).toBe('\\nu');
    expect(parsed.progress).toBeUndefined();
  });

  it('should seamlessly migrate v1 legacy bundles without terms or glossary', () => {
    const legacyBundle = {
      version: 1,
      schemaVersion: '1.0.0',
      exportedAt: 1000,
      set: {
        id: 'legacy-set',
        title: 'Legacy Deck',
        tags: ['physics'],
        createdAt: 1000,
        updatedAt: 1000,
        settings: {},
        defaultCardType: 'basic',
        extra: {},
      },
      cards: [
        {
          id: 'legacy-card',
          setId: 'legacy-set',
          order: 0,
          type: 'basic',
          front: [{ t: 'text', v: 'Legacy Question' }],
          back: [{ t: 'text', v: 'Legacy Answer' }],
          answer: { checker: 'text', accepted: [], options: {} },
          hints: [],
          tags: [],
          starred: false,
          media: [],
          extra: {},
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
    };

    const migrated = migrateFlashsetBundle(legacyBundle);
    expect(migrated.version).toBe(2);
    expect(migrated.schemaVersion).toBe('2.0.0');
    expect(migrated.set.id).toBe('legacy-set');
    expect(migrated.cards[0].id).toBe('legacy-card');
    expect(migrated.cards[0].terms).toBeUndefined();

    // Round-trip parsing legacy json string through importFlashset
    const parsed = importFlashset(JSON.stringify(legacyBundle));
    expect(parsed.version).toBe(2);
    expect(parsed.cards[0].terms).toBeUndefined();
  });

  it('should reject malformed JSON', () => {
    expect(() => importFlashset('{ invalid_json ')).toThrow('Invalid flashset');
  });

  it('should reject schema violations', () => {
    const bundle = {
      version: 2,
      schemaVersion: '2.0.0',
      exportedAt: 1000,
      set: mockSet,
      cards: [{ ...mockCards[0], front: undefined }], // Missing required front
    };
    expect(() => importFlashset(JSON.stringify(bundle))).toThrow('Schema validation failed');
  });

  it('should reject cards whose setId does not match the bundle set.id', () => {
    const invalidCards = [{ ...mockCards[0], setId: 'otherSet' }];
    const json = exportFlashset(mockSet, invalidCards);
    expect(() => importFlashset(json)).toThrow('Integrity error: Card card1 does not belong to set set1');
  });
});
