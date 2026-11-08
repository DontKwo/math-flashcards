import { describe, it, expect, beforeEach } from 'vitest';

const mockStorage = new Map<string, string>();
const fakeLocalStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => {
    mockStorage.set(key, val);
  },
  removeItem: (key: string) => {
    mockStorage.delete(key);
  },
  clear: () => {
    mockStorage.clear();
  },
};

(globalThis as unknown as { localStorage: typeof fakeLocalStorage }).localStorage = fakeLocalStorage;

import { loadSets, CFD_DEFAULT_SET_ID } from './storage';

describe('Storage and Versioned Seeding', () => {
  beforeEach(() => {
    fakeLocalStorage.clear();
  });

  it('seeds CFD: Complete Reference for brand new installs with current seed version', () => {
    const sets = loadSets();
    expect(sets.length).toBe(1);
    expect(sets[0].id).toBe(CFD_DEFAULT_SET_ID);
    expect(sets[0].name).toBe('CFD: Complete Reference');
    expect(sets[0].cards.length).toBe(1500);
    expect(fakeLocalStorage.getItem('formulaflash_seed_version')).toBe('2');
  });

  it('preserves existing custom user sets and non-destructively adds CFD deck', () => {
    const userCustomSet = {
      id: 'my-custom-deck',
      name: 'Aerospace Propulsion 101',
      category: 'Aerospace',
      cards: [
        {
          id: 'custom-01',
          category: 'Aerospace',
          title: 'Thrust Equation',
          prompt: 'Thrust formula:',
          latexAnswer: 'F = \\dot{m} v_e + (p_e - p_0) A_e',
          explanation: 'Standard rocket thrust equation.',
        },
      ],
    };
    fakeLocalStorage.setItem('formulaflash_sets', JSON.stringify([userCustomSet]));
    fakeLocalStorage.setItem('formulaflash_seed_version', '1');

    const sets = loadSets();
    expect(sets.length).toBe(2);
    const foundUserSet = sets.find((s) => s.id === 'my-custom-deck');
    expect(foundUserSet).toBeDefined();
    expect(foundUserSet?.cards.length).toBe(1);
    expect(foundUserSet?.cards[0].title).toBe('Thrust Equation');

    const foundCfd = sets.find((s) => s.id === CFD_DEFAULT_SET_ID);
    expect(foundCfd).toBeDefined();
    expect(foundCfd?.cards.length).toBe(1500);

    expect(fakeLocalStorage.getItem('formulaflash_seed_version')).toBe('2');
  });

  it('does not duplicate CFD deck on subsequent loads', () => {
    loadSets();
    const secondLoad = loadSets();
    const cfdDecks = secondLoad.filter((s) => s.id === CFD_DEFAULT_SET_ID);
    expect(cfdDecks.length).toBe(1);
  });
});
