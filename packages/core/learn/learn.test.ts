import { describe, expect, it } from 'vitest';
import { type Card } from '../model/index.js';
import { LearnEngine } from './engine.js';
import { SeededRng } from './prng.js';

describe('LearnEngine', () => {
  const mockCard: Card = {
    id: 'c1',
    setId: 's1',
    order: 0,
    type: 'basic',
    front: [],
    back: [],
    answer: { checker: 'text', accepted: [], options: {} },
    hints: [],
    tags: [],
    starred: false,
    media: [],
    extra: {},
    createdAt: 0,
    updatedAt: 0,
  };

  it('should progress through mastery levels and change question type', () => {
    const rng = new SeededRng(12345);
    const engine = new LearnEngine([mockCard], [], rng);

    // Initial state: unseen (level 0) -> mc
    let prompt = engine.getNext();
    expect(prompt).not.toBeNull();
    expect(prompt?.type).toBe('mc');
    expect(prompt?.progress.learn.level).toBe(0);

    // Correct answer -> level 1 -> write
    engine.submitAnswer('c1', { correct: true, via: 'exact' });
    let p = engine.getProgress('c1');
    expect(p?.learn.level).toBe(1);

    prompt = engine.getNext();
    expect(prompt).not.toBeNull();
    expect(prompt?.type).toBe('write');
    expect(prompt?.progress.learn.level).toBe(1);

    // Correct answer -> level 2 -> write
    engine.submitAnswer('c1', { correct: true, via: 'exact' });
    p = engine.getProgress('c1');
    expect(p?.learn.level).toBe(2);

    prompt = engine.getNext();
    expect(prompt).not.toBeNull();
    expect(prompt?.type).toBe('write');
    expect(prompt?.progress.learn.level).toBe(2);

    // Correct answer -> level 3 (mastered) -> removed from queue
    engine.submitAnswer('c1', { correct: true, via: 'exact' });
    p = engine.getProgress('c1');
    expect(p?.learn.level).toBe(3);

    prompt = engine.getNext();
    expect(prompt).toBeNull(); // No more cards in queue, all mastered
  });

  it('should downgrade level and requeue on incorrect answer', () => {
    const rng = new SeededRng(12345);
    const engine = new LearnEngine([mockCard], [], rng);

    // level 0 -> level 1
    engine.getNext();
    engine.submitAnswer('c1', { correct: true, via: 'exact' });

    // level 1 -> level 0 (incorrect)
    engine.getNext();
    engine.submitAnswer('c1', { correct: false, via: 'exact' });

    const p = engine.getProgress('c1');
    expect(p?.learn.level).toBe(0);

    // Should be requeued as 'mc'
    const prompt = engine.getNext();
    expect(prompt).not.toBeNull();
    expect(prompt?.type).toBe('mc');
  });

  it('should behave deterministically with seed', () => {
    const cards: Card[] = [
      { ...mockCard, id: 'c1' },
      { ...mockCard, id: 'c2' },
      { ...mockCard, id: 'c3' },
    ];

    const rng1 = new SeededRng(42);
    const engine1 = new LearnEngine(cards, [], rng1);

    const rng2 = new SeededRng(42);
    const engine2 = new LearnEngine(cards, [], rng2);

    expect(engine1.getNext()?.card.id).toBe(engine2.getNext()?.card.id);
    expect(engine1.getNext()?.card.id).toBe(engine2.getNext()?.card.id);
    expect(engine1.getNext()?.card.id).toBe(engine2.getNext()?.card.id);
  });
});
