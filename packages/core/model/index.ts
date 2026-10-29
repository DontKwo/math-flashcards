import { z } from 'zod';

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
