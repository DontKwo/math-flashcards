import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRepository } from './in-memory-repository.js';
import type { CardSet, Card, CardProgress, StudySession } from '../model/index.js';

describe('InMemoryRepository', () => {
  let repo: InMemoryRepository;

  beforeEach(() => {
    repo = new InMemoryRepository();
  });

  it('should save and retrieve a CardSet', async () => {
    const set: CardSet = {
      id: 'set-1',
      title: 'My Set',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'basic',
      extra: {},
    };
    await repo.saveSet(set);
    const retrieved = await repo.getSet('set-1');
    expect(retrieved).toEqual(set);

    // Ensure deep copy
    if (retrieved) retrieved.title = 'Changed';
    const retrievedAgain = await repo.getSet('set-1');
    expect(retrievedAgain?.title).toBe('My Set');
  });

  it('should list all CardSets', async () => {
    const set1: CardSet = {
      id: 'set-1',
      title: 'Set 1',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'basic',
      extra: {},
    };
    const set2: CardSet = {
      id: 'set-2',
      title: 'Set 2',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'basic',
      extra: {},
    };
    await repo.saveSet(set1);
    await repo.saveSet(set2);

    const sets = await repo.listSets();
    expect(sets).toHaveLength(2);
    expect(sets).toEqual(expect.arrayContaining([set1, set2]));
  });

  it('should delete a CardSet and cascade delete cards', async () => {
    const set: CardSet = {
      id: 'set-1',
      title: 'My Set',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      settings: {},
      defaultCardType: 'basic',
      extra: {},
    };
    const card: Card = {
      id: 'card-1',
      setId: 'set-1',
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
    await repo.saveSet(set);
    await repo.saveCard(card);

    await repo.deleteSet('set-1');
    const retrievedSet = await repo.getSet('set-1');
    expect(retrievedSet).toBeUndefined();

    const retrievedCard = await repo.getCard('card-1');
    expect(retrievedCard).toBeUndefined();
  });

  it('should save and retrieve a Card', async () => {
    const card: Card = {
      id: 'card-1',
      setId: 'set-1',
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
    await repo.saveCard(card);
    const retrieved = await repo.getCard('card-1');
    expect(retrieved).toEqual(card);
  });

  it('should list cards for a specific set', async () => {
    const card1: Card = {
      id: 'card-1',
      setId: 'set-1',
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
    const card2: Card = {
      id: 'card-2',
      setId: 'set-2',
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
    await repo.saveCard(card1);
    await repo.saveCard(card2);

    const cards = await repo.getCards('set-1');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual(card1);
  });

  it('should save and retrieve CardProgress', async () => {
    const progress: CardProgress = {
      cardId: 'card-1',
      direction: 'front->back',
      learn: { level: 0, streak: 0 },
      stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
    };
    await repo.saveProgress(progress);
    const retrieved = await repo.getProgress('card-1', 'front->back');
    expect(retrieved).toEqual(progress);
  });

  it('should list CardProgresses', async () => {
    const progress1: CardProgress = {
      cardId: 'card-1',
      direction: 'front->back',
      learn: { level: 0, streak: 0 },
      stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
    };
    const progress2: CardProgress = {
      cardId: 'card-1',
      direction: 'back->front',
      learn: { level: 0, streak: 0 },
      stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
    };
    await repo.saveProgress(progress1);
    await repo.saveProgress(progress2);

    const progresses = await repo.listProgress();
    expect(progresses).toHaveLength(2);
    expect(progresses).toEqual(expect.arrayContaining([progress1, progress2]));
  });

  it('should cascade delete progress when card is deleted', async () => {
    const card: Card = {
      id: 'card-1',
      setId: 'set-1',
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
    const progress: CardProgress = {
      cardId: 'card-1',
      direction: 'front->back',
      learn: { level: 0, streak: 0 },
      stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
    };
    await repo.saveCard(card);
    await repo.saveProgress(progress);

    await repo.deleteCard('card-1');
    const retrieved = await repo.getProgress('card-1', 'front->back');
    expect(retrieved).toBeUndefined();
  });

  it('should list progress for a specific set', async () => {
    const card1: Card = {
      id: 'card-1',
      setId: 'set-1',
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
    const progress1: CardProgress = {
      cardId: 'card-1',
      direction: 'front->back',
      learn: { level: 0, streak: 0 },
      stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
    };

    const progress2: CardProgress = {
      cardId: 'card-2', // No card in set-1 for card-2
      direction: 'front->back',
      learn: { level: 0, streak: 0 },
      stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
    };
    await repo.saveCard(card1);
    await repo.saveProgress(progress1);
    await repo.saveProgress(progress2);

    const progresses = await repo.listProgress('set-1');
    expect(progresses).toHaveLength(1);
    expect(progresses[0]).toEqual(progress1);
  });

  it('should save and retrieve StudySession', async () => {
    const session: StudySession = {
      id: 'session-1',
      setIds: ['set-1'],
      mode: 'practice',
      startedAt: 0,
      config: {},
      events: [],
    };
    await repo.saveSession(session);
    const retrieved = await repo.getSession('session-1');
    expect(retrieved).toEqual(session);
  });

  it('should list StudySessions', async () => {
    const session1: StudySession = {
      id: 'session-1',
      setIds: ['set-1'],
      mode: 'practice',
      startedAt: 0,
      config: {},
      events: [],
    };
    const session2: StudySession = {
      id: 'session-2',
      setIds: ['set-2'],
      mode: 'practice',
      startedAt: 0,
      config: {},
      events: [],
    };
    await repo.saveSession(session1);
    await repo.saveSession(session2);

    const allSessions = await repo.listSessions();
    expect(allSessions).toHaveLength(2);

    const set1Sessions = await repo.listSessions('set-1');
    expect(set1Sessions).toHaveLength(1);
    expect(set1Sessions[0]).toEqual(session1);
  });
});
