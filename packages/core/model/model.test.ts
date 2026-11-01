import { describe, it, expect } from 'vitest';
import {
  SegmentSchema,
  RichContentSchema,
  CardSetSchema,
  AnswerSpecSchema,
  CardSchema,
  VerdictSchema,
  CardProgressSchema,
  StudyEventSchema,
  StudySessionSchema,
  Segment,
  RichContent,
  CardSet,
  AnswerSpec,
  Card,
  Verdict,
  CardProgress,
  StudyEvent,
  StudySession,
} from './index.js';

describe('Model Schemas & Types', () => {
  describe('SegmentSchema & RichContentSchema', () => {
    it('accepts valid segments', () => {
      const textSeg: Segment = { t: 'text', v: 'Hello world' };
      const mathSeg: Segment = { t: 'math', latex: 'x^2 + y^2 = z^2', display: true };
      const imgSeg: Segment = { t: 'image', mediaId: 'img-123', alt: 'Test image' };
      const audioSeg: Segment = { t: 'audio', mediaId: 'aud-456' };
      const extSeg: Segment = { t: 'ext', kind: 'chem', data: { formula: 'H2O' } };

      expect(SegmentSchema.safeParse(textSeg).success).toBe(true);
      expect(SegmentSchema.safeParse(mathSeg).success).toBe(true);
      expect(SegmentSchema.safeParse(imgSeg).success).toBe(true);
      expect(SegmentSchema.safeParse(audioSeg).success).toBe(true);
      expect(SegmentSchema.safeParse(extSeg).success).toBe(true);

      const rich: RichContent = [textSeg, mathSeg];
      expect(RichContentSchema.safeParse(rich).success).toBe(true);
    });

    it('rejects invalid segments', () => {
      expect(SegmentSchema.safeParse({ t: 'unknown' }).success).toBe(false);
      expect(SegmentSchema.safeParse({ t: 'text' }).success).toBe(false);
      expect(SegmentSchema.safeParse({ t: 'math' }).success).toBe(false);
      expect(SegmentSchema.safeParse({ t: 'audio' }).success).toBe(false);
      expect(RichContentSchema.safeParse('not an array').success).toBe(false);
    });
  });

  describe('CardSetSchema', () => {
    it('accepts valid minimal and complete CardSet', () => {
      const minimal: CardSet = {
        id: 'set-1',
        title: 'Physics 101',
        tags: ['physics', 'science'],
        createdAt: 1000,
        updatedAt: 2000,
        settings: {},
        defaultCardType: 'basic',
        extra: {},
      };
      expect(CardSetSchema.safeParse(minimal).success).toBe(true);

      const complete: CardSet = {
        ...minimal,
        description: [{ t: 'text', v: 'A great set' }],
        folderId: 'folder-1',
        settings: { shuffle: true },
        extra: { author: 'Alice' },
      };
      expect(CardSetSchema.safeParse(complete).success).toBe(true);
    });

    it('rejects invalid CardSet', () => {
      expect(CardSetSchema.safeParse({ id: 'set-1' }).success).toBe(false);
      expect(
        CardSetSchema.safeParse({
          id: 'set-1',
          title: 'Physics',
          tags: 'not-an-array',
          createdAt: 1000,
          updatedAt: 2000,
          settings: {},
          defaultCardType: 'basic',
          extra: {},
        }).success
      ).toBe(false);
      expect(
        CardSetSchema.safeParse({
          id: 'set-1',
          title: 'Physics',
          tags: [],
          createdAt: 'not-a-number',
          updatedAt: 2000,
          settings: {},
          defaultCardType: 'basic',
          extra: {},
        }).success
      ).toBe(false);
    });
  });

  describe('AnswerSpecSchema', () => {
    it('accepts valid AnswerSpec', () => {
      const spec: AnswerSpec = {
        checker: 'math',
        accepted: [
          { content: [{ t: 'math', latex: 'PV=nRT' }] },
          { content: [{ t: 'math', latex: 'nRT=PV' }], note: 'flipped' },
        ],
        options: { allowEquivalentForms: true },
      };
      expect(AnswerSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('rejects invalid AnswerSpec', () => {
      expect(AnswerSpecSchema.safeParse({ checker: 'math' }).success).toBe(false);
      expect(
        AnswerSpecSchema.safeParse({
          checker: 'math',
          accepted: [{ content: 'invalid' }],
          options: {},
        }).success
      ).toBe(false);
    });
  });

  describe('CardSchema', () => {
    const validCard: Card = {
      id: 'card-1',
      setId: 'set-1',
      order: 1,
      type: 'equation',
      front: [{ t: 'text', v: 'Ideal gas law' }],
      back: [{ t: 'math', latex: 'PV=nRT' }],
      answer: {
        checker: 'math',
        accepted: [{ content: [{ t: 'math', latex: 'PV=nRT' }] }],
        options: {},
      },
      hints: [[{ t: 'text', v: 'Think about pressure and volume' }]],
      explanation: [{ t: 'text', v: 'Derived from kinetic theory' }],
      tags: ['gas', 'thermo'],
      starred: true,
      media: ['media-1'],
      extra: { difficulty: 2 },
      createdAt: 1000,
      updatedAt: 2000,
    };

    it('accepts valid Card', () => {
      expect(CardSchema.safeParse(validCard).success).toBe(true);

      const minimalCard = {
        ...validCard,
        explanation: undefined,
        hints: [],
      };
      expect(CardSchema.safeParse(minimalCard).success).toBe(true);
    });

    it('rejects invalid Card', () => {
      expect(CardSchema.safeParse({ ...validCard, starred: 'yes' }).success).toBe(false);
      expect(CardSchema.safeParse({ ...validCard, front: 'string-instead-of-array' }).success).toBe(
        false
      );
      expect(CardSchema.safeParse({ ...validCard, id: undefined }).success).toBe(false);
      expect(CardSchema.safeParse({ ...validCard, order: 'one' }).success).toBe(false);
    });
  });

  describe('VerdictSchema', () => {
    it('accepts valid Verdict', () => {
      const v1: Verdict = { correct: true, via: 'exact' };
      const v2: Verdict = {
        correct: true,
        via: 'structural',
        closeness: 0.95,
        message: 'Equivalent form accepted',
      };
      expect(VerdictSchema.safeParse(v1).success).toBe(true);
      expect(VerdictSchema.safeParse(v2).success).toBe(true);

      const allVias = ['exact', 'normalized', 'structural', 'numeric', 'fuzzy', 'override'] as const;
      for (const via of allVias) {
        expect(VerdictSchema.safeParse({ correct: true, via }).success).toBe(true);
      }
    });

    it('rejects invalid Verdict', () => {
      expect(VerdictSchema.safeParse({ correct: true, via: 'magic' }).success).toBe(false);
      expect(VerdictSchema.safeParse({ correct: 'true', via: 'exact' }).success).toBe(false);
      expect(VerdictSchema.safeParse({ via: 'exact' }).success).toBe(false);
    });
  });

  describe('CardProgressSchema', () => {
    const validProgress: CardProgress = {
      cardId: 'card-1',
      direction: 'front->back',
      learn: {
        level: 2,
        streak: 3,
        lastResult: 'right',
        lastSeen: 5000,
      },
      srs: { difficulty: 0.3 },
      stats: {
        seen: 5,
        right: 4,
        wrong: 1,
        avgMs: 2300,
      },
    };

    it('accepts valid CardProgress', () => {
      expect(CardProgressSchema.safeParse(validProgress).success).toBe(true);

      const levels = [0, 1, 2, 3] as const;
      for (const level of levels) {
        expect(
          CardProgressSchema.safeParse({
            ...validProgress,
            learn: { ...validProgress.learn, level },
          }).success
        ).toBe(true);
      }
    });

    it('rejects invalid CardProgress', () => {
      // Invalid level
      expect(
        CardProgressSchema.safeParse({
          ...validProgress,
          learn: { ...validProgress.learn, level: 4 },
        }).success
      ).toBe(false);

      // Invalid direction
      expect(
        CardProgressSchema.safeParse({
          ...validProgress,
          direction: 'left->right',
        }).success
      ).toBe(false);

      // Invalid lastResult
      expect(
        CardProgressSchema.safeParse({
          ...validProgress,
          learn: { ...validProgress.learn, lastResult: 'maybe' },
        }).success
      ).toBe(false);

      // Missing stats
      expect(
        CardProgressSchema.safeParse({
          cardId: 'card-1',
          direction: 'front->back',
          learn: validProgress.learn,
        }).success
      ).toBe(false);
    });
  });

  describe('StudyEventSchema', () => {
    it('accepts valid StudyEvent', () => {
      const event: StudyEvent = {
        cardId: 'card-1',
        direction: 'front->back',
        qType: 'typed',
        given: 'PV=nRT',
        verdict: { correct: true, via: 'exact' },
        ms: 1200,
        at: 10000,
      };
      expect(StudyEventSchema.safeParse(event).success).toBe(true);
    });

    it('rejects invalid StudyEvent', () => {
      expect(
        StudyEventSchema.safeParse({
          cardId: 'card-1',
          direction: 'front->back',
          qType: 'typed',
          given: 'PV=nRT',
          verdict: { correct: true, via: 'unknown' },
          ms: '1200',
          at: 10000,
        }).success
      ).toBe(false);
    });
  });

  describe('StudySessionSchema', () => {
    it('accepts valid StudySession', () => {
      const session: StudySession = {
        id: 'session-1',
        setIds: ['set-1'],
        mode: 'learn',
        startedAt: 1000,
        endedAt: 2000,
        config: { roundSize: 7 },
        events: [
          {
            cardId: 'card-1',
            direction: 'front->back',
            qType: 'mc',
            given: 0,
            verdict: { correct: true, via: 'exact' },
            ms: 800,
            at: 1500,
          },
        ],
        snapshot: { currentRound: 1 },
      };
      expect(StudySessionSchema.safeParse(session).success).toBe(true);

      const minimalSession: StudySession = {
        id: 'session-2',
        setIds: ['set-1', 'set-2'],
        mode: 'flashcards',
        startedAt: 1000,
        config: {},
        events: [],
      };
      expect(StudySessionSchema.safeParse(minimalSession).success).toBe(true);
    });

    it('rejects invalid StudySession', () => {
      expect(
        StudySessionSchema.safeParse({
          id: 'session-1',
          setIds: 'not-array',
          mode: 'learn',
          startedAt: 'yesterday',
          config: {},
          events: [],
        }).success
      ).toBe(false);
    });
  });
});
