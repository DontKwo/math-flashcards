import { describe, it, expect } from 'vitest';
import { scheduleCard } from './scheduler.js';
import { SRSItem, Rating } from './types.js';
import { State } from 'ts-fsrs';

describe('FSRS scheduler adapter', () => {
  const createNewItem = (): SRSItem => ({
    stability: 0,
    difficulty: 0,
    due: new Date('2023-01-01T00:00:00Z'),
    reps: 0,
    lapses: 0,
    state: State.New,
  });

  it('progresses intervals correctly on Good vs Easy', () => {
    const item = createNewItem();
    const now = new Date('2023-01-01T00:00:00Z');

    const goodItem = scheduleCard(item, Rating.Good, now);
    const easyItem = scheduleCard(item, Rating.Easy, now);

    expect(goodItem.stability).toBeGreaterThan(0);
    expect(easyItem.stability).toBeGreaterThan(goodItem.stability);

    // Check that due date moved forward
    expect(goodItem.due.getTime()).toBeGreaterThan(now.getTime());
    expect(easyItem.due.getTime()).toBeGreaterThan(goodItem.due.getTime());

    expect(goodItem.reps).toBe(1);
    expect(easyItem.reps).toBe(1);
  });

  it('resets / increases lapses on Again', () => {
    const item = createNewItem();
    const now = new Date('2023-01-01T00:00:00Z');

    // First let's make it a learned card
    let learnedItem = scheduleCard(item, Rating.Good, now);

    // According to ts-fsrs, the state transition when rating Good on New is Learning (1).
    // Let's force it to Review (2) to test lapse behavior, as lapsing only happens from Review state.
    learnedItem.state = State.Review;
    learnedItem = scheduleCard(learnedItem, Rating.Good, new Date(now.getTime() + 24 * 60 * 60 * 1000));

    expect(learnedItem.reps).toBe(2);
    expect(learnedItem.lapses).toBe(0);
    expect(learnedItem.state).toBe(State.Review);

    // Now fail it
    const failedItem = scheduleCard(learnedItem, Rating.Again, new Date(learnedItem.due.getTime()));

    expect(failedItem.lapses).toBe(1);
    expect(failedItem.reps).toBe(3);

    // The stability should drop significantly compared to what it would be on Good
    const goodAgainItem = scheduleCard(learnedItem, Rating.Good, new Date(learnedItem.due.getTime()));
    expect(failedItem.stability).toBeLessThan(goodAgainItem.stability);
  });
});
