// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRepository } from '@formulaflash/core';
import { useLibrary, setCustomRepository } from './useLibrary.ts';

describe('useLibrary store', () => {
  let repo: InMemoryRepository;

  beforeEach(() => {
    repo = new InMemoryRepository();
    setCustomRepository(repo);
    useLibrary.setState({ repository: repo, sets: [], activeToast: null, loading: false, error: null });
    localStorage.clear();
  });

  it('initializes and calculates derived card count and mastery stats', async () => {
    await useLibrary.getState().init();
    const sets = useLibrary.getState().sets;

    expect(sets.length).toBeGreaterThan(0);
    const sampleSet = sets.find((s) => s.id === 'sample-deck');
    expect(sampleSet).toBeDefined();
    expect(sampleSet?.cardCount).toBeGreaterThanOrEqual(6);
    expect(sampleSet?.mastery.unseen).toBeGreaterThanOrEqual(6);
  });

  it('creates, updates, and duplicates sets', async () => {
    await useLibrary.getState().init();

    const created = await useLibrary.getState().createSet('Calculus III', ['Math']);
    expect(created.title).toBe('Calculus III');

    await useLibrary.getState().updateSet(created.id, { title: 'Multivariable Calculus' });
    const updated = await useLibrary.getState().getSet(created.id);
    expect(updated?.set.title).toBe('Multivariable Calculus');

    const dup = await useLibrary.getState().duplicateSet(created.id);
    expect(dup.title).toBe('Multivariable Calculus (Copy)');
  });

  it('supports soft deletion of sets with undo toast', async () => {
    await useLibrary.getState().init();
    const newSet = await useLibrary.getState().createSet('Set to Delete');

    await useLibrary.getState().deleteSet(newSet.id);

    let sets = useLibrary.getState().sets;
    expect(sets.find((s) => s.id === newSet.id)).toBeUndefined();
    expect(useLibrary.getState().activeToast).toBeDefined();
    expect(useLibrary.getState().activeToast?.actionLabel).toBe('Undo');

    // Click Undo
    await useLibrary.getState().undoLastAction();

    sets = useLibrary.getState().sets;
    expect(sets.find((s) => s.id === newSet.id)).toBeDefined();
  });

  it('creates, updates, reorders, and deletes cards', async () => {
    await useLibrary.getState().init();
    const newSet = await useLibrary.getState().createSet('Card Test Set');

    const card1 = await useLibrary.getState().createCard(newSet.id, {
      type: 'equation',
      front: [{ t: 'text', v: 'Card 1' }],
      back: [{ t: 'math', latex: 'x=1' }],
      answer: { checker: 'math', accepted: [{ content: [{ t: 'math', latex: 'x=1' }] }], options: {} },
      hints: [],
      tags: [],
      starred: false,
      media: [],
      extra: {},
    });

    const card2 = await useLibrary.getState().createCard(newSet.id, {
      type: 'equation',
      front: [{ t: 'text', v: 'Card 2' }],
      back: [{ t: 'math', latex: 'x=2' }],
      answer: { checker: 'math', accepted: [{ content: [{ t: 'math', latex: 'x=2' }] }], options: {} },
      hints: [],
      tags: [],
      starred: false,
      media: [],
      extra: {},
    });

    const setDetails = await useLibrary.getState().getSet(newSet.id);
    expect(setDetails?.cards.length).toBe(2);

    // Reorder cards
    await useLibrary.getState().reorderCards(newSet.id, [card2.id, card1.id]);
    const reorderedDetails = await useLibrary.getState().getSet(newSet.id);
    expect(reorderedDetails?.cards[0].id).toBe(card2.id);
    expect(reorderedDetails?.cards[1].id).toBe(card1.id);

    // Soft delete card with undo
    await useLibrary.getState().deleteCard(card1.id);
    expect((await useLibrary.getState().getSet(newSet.id))?.cards.length).toBe(1);

    await useLibrary.getState().undoLastAction();
    expect((await useLibrary.getState().getSet(newSet.id))?.cards.length).toBe(2);
  });
});
