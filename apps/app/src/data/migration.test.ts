// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRepository } from '@formulaflash/core';
import {
  migrateLegacyData,
  convertLegacyCardToCoreCard,
  LEGACY_SETS_KEY,
  MIGRATION_COMPLETE_KEY,
} from './migration.ts';
import type { FlashcardItem } from './sample-deck.ts';

describe('Data Migration', () => {
  let repo: InMemoryRepository;

  beforeEach(() => {
    repo = new InMemoryRepository();
    localStorage.clear();
  });

  it('converts a legacy card item to a valid core Card model', () => {
    const legacyItem: FlashcardItem = {
      id: 'test-card-1',
      category: 'Math',
      title: 'Euler Formula',
      prompt: 'State Euler formula relating e, i, pi:',
      latexAnswer: 'e^{i\\pi} + 1 = 0',
      hint: 'Relates five fundamental constants',
      explanation: 'Often considered the most beautiful theorem in mathematics',
    };

    const coreCard = convertLegacyCardToCoreCard(legacyItem, 'set-123', 0);

    expect(coreCard.id).toBe('test-card-1');
    expect(coreCard.setId).toBe('set-123');
    expect(coreCard.order).toBe(0);
    expect(coreCard.type).toBe('equation');
    expect(coreCard.front).toEqual([
      { t: 'text', v: 'Euler Formula: State Euler formula relating e, i, pi:' },
    ]);
    expect(coreCard.back).toEqual([{ t: 'math', latex: 'e^{i\\pi} + 1 = 0', display: true }]);
    expect(coreCard.answer.checker).toBe('math');
    expect(coreCard.answer.accepted[0].content).toEqual([
      { t: 'math', latex: 'e^{i\\pi} + 1 = 0', display: true },
    ]);
    expect(coreCard.hints).toEqual([
      [{ t: 'text', v: 'Relates five fundamental constants' }],
    ]);
    expect(coreCard.explanation).toEqual([
      { t: 'text', v: 'Often considered the most beautiful theorem in mathematics' },
    ]);
  });

  it('seeds the sample deck on first run when storage is empty', async () => {
    await migrateLegacyData(repo);

    const sets = await repo.listSets();
    expect(sets.length).toBe(1);
    expect(sets[0].id).toBe('sample-deck');
    expect(sets[0].title).toBe('Ideal Gas Law & friends');

    const cards = await repo.getCards('sample-deck');
    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(localStorage.getItem(MIGRATION_COMPLETE_KEY)).toBe('true');
  });

  it('migrates legacy sets and cards losslessly while preserving IDs', async () => {
    const legacySets = [
      {
        id: 'legacy-set-1',
        name: 'Classical Mechanics',
        category: 'Physics',
        cards: [
          {
            id: 'legacy-card-1',
            category: 'Physics',
            title: "Newton's Second Law",
            prompt: 'Force formula',
            latexAnswer: 'F = ma',
            hint: 'Mass times acceleration',
            explanation: 'Fundamental law of motion',
          },
        ],
      },
    ];

    localStorage.setItem(LEGACY_SETS_KEY, JSON.stringify(legacySets));

    await migrateLegacyData(repo);

    const set = await repo.getSet('legacy-set-1');
    expect(set).toBeDefined();
    expect(set?.title).toBe('Classical Mechanics');
    expect(set?.tags).toContain('Physics');

    const cards = await repo.getCards('legacy-set-1');
    expect(cards.length).toBe(1);
    expect(cards[0].id).toBe('legacy-card-1');
    expect(cards[0].back[0]).toEqual({ t: 'math', latex: 'F = ma', display: true });
  });

  it('handles corrupted JSON in localStorage gracefully without crashing', async () => {
    localStorage.setItem(LEGACY_SETS_KEY, '{invalid json');

    await migrateLegacyData(repo);

    const sets = await repo.listSets();
    expect(sets.length).toBe(1);
    expect(sets[0].id).toBe('sample-deck');
  });

  it('handles unicode and long strings in card text', async () => {
    const unicodeItem: FlashcardItem = {
      id: 'unicode-card',
      category: '量子力学 ⚛️',
      title: 'Schrödinger equation 🌊',
      prompt: 'Ĥ|ψ⟩ = E|ψ⟩ with unicode Greek and Cyrillic 🧪'.repeat(50),
      latexAnswer: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H}\\Psi',
      hint: 'Long hint '.repeat(100),
      explanation: 'Explanation with special chars: <>&"\'',
    };

    const legacySets = [
      {
        id: 'unicode-set',
        name: 'Unicode Set 📚',
        category: 'Quantum',
        cards: [unicodeItem],
      },
    ];

    localStorage.setItem(LEGACY_SETS_KEY, JSON.stringify(legacySets));

    await migrateLegacyData(repo);

    const set = await repo.getSet('unicode-set');
    expect(set?.title).toBe('Unicode Set 📚');

    const cards = await repo.getCards('unicode-set');
    expect(cards[0].front[0]).toHaveProperty('v');
  });
});
