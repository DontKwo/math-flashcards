import { z } from 'zod';

// ---------- Rich content ----------
export const SegmentSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('text'), v: z.string() }),
  z.object({ t: z.literal('math'), latex: z.string(), display: z.boolean().optional() }),
  z.object({ t: z.literal('image'), mediaId: z.string(), alt: z.string().optional() }),
  z.object({ t: z.literal('audio'), mediaId: z.string() }),
  z.object({ t: z.literal('ext'), kind: z.string(), data: z.unknown() }),
]);

export type Segment = z.infer<typeof SegmentSchema>;

export const RichContentSchema = z.array(SegmentSchema);
export type RichContent = z.infer<typeof RichContentSchema>;

// ---------- Sets / cards ----------
export const CardSetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: RichContentSchema.optional(),
  tags: z.array(z.string()),
  folderId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  settings: z.record(z.unknown()), // per-set overrides
  defaultCardType: z.string(),
  extra: z.record(z.unknown()),
});
export type CardSet = z.infer<typeof CardSetSchema>;

export const AnswerSpecSchema = z.object({
  checker: z.string(),
  accepted: z.array(
    z.object({
      content: RichContentSchema,
      note: z.string().optional(),
    })
  ),
  options: z.record(z.unknown()),
});
export type AnswerSpec = z.infer<typeof AnswerSpecSchema>;

export const CardSchema = z.object({
  id: z.string(),
  setId: z.string(),
  order: z.number(),
  type: z.string(),
  front: RichContentSchema,
  back: RichContentSchema,
  answer: AnswerSpecSchema,
  hints: z.array(RichContentSchema),
  explanation: RichContentSchema.optional(),
  tags: z.array(z.string()),
  starred: z.boolean(),
  media: z.array(z.string()),
  extra: z.record(z.unknown()),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Card = z.infer<typeof CardSchema>;

// ---------- Study state ----------
export const VerdictSchema = z.object({
  correct: z.boolean(),
  via: z.enum(['exact', 'normalized', 'structural', 'numeric', 'fuzzy', 'override']),
  closeness: z.number().optional(),
  message: z.string().optional(),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const CardProgressSchema = z.object({
  cardId: z.string(),
  direction: z.enum(['front->back', 'back->front']),
  learn: z.object({
    level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    streak: z.number(),
    lastResult: z.enum(['right', 'wrong', 'skipped']).optional(),
    lastSeen: z.number().optional(),
  }),
  srs: z.unknown().optional(),
  stats: z.object({
    seen: z.number(),
    right: z.number(),
    wrong: z.number(),
    avgMs: z.number(),
  }),
});
export type CardProgress = z.infer<typeof CardProgressSchema>;

export const StudyEventSchema = z.object({
  cardId: z.string(),
  direction: z.string(),
  qType: z.string(),
  given: z.unknown(),
  verdict: VerdictSchema,
  ms: z.number(),
  at: z.number(),
});
export type StudyEvent = z.infer<typeof StudyEventSchema>;

export const StudySessionSchema = z.object({
  id: z.string(),
  setIds: z.array(z.string()),
  mode: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  config: z.unknown(),
  events: z.array(StudyEventSchema),
  snapshot: z.unknown().optional(),
});
export type StudySession = z.infer<typeof StudySessionSchema>;
