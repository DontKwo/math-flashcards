# Google Jules Tasks & Prompts

Run each prompt below in a separate Jules task / session. Each task maps to a specific milestone deliverable in `PLAN.md` with explicit architectural constraints.

---

## Task 1: Storage Repository Interface and In-Memory Adapter in Core (Milestone 1D)

**Branch name**: `feat/storage-repository`

### Jules Prompt:
```text
Implement the storage repository interface and in-memory adapter in packages/core.

Context & Rules:
- Refer to PLAN.md Section 5 (Data model) and Section 14 (Milestone 1).
- Layering rule: packages/core must remain pure TypeScript. No DOM, React, Capacitor, or browser APIs.
- Conventional Commits for commit messages.
- Keep comments <= 2 lines. State only current behavior. Explicit TypeScript types on all function parameters and returns.

Requirements:
1. Create packages/core/storage/types.ts:
   - Define Repository interface:
     - getSet(id: string): Promise<CardSet | undefined>
     - listSets(): Promise<CardSet[]>
     - saveSet(set: CardSet): Promise<void>
     - deleteSet(id: string): Promise<void>
     - getCard(id: string): Promise<Card | undefined>
     - getCards(setId: string): Promise<Card[]>
     - saveCard(card: Card): Promise<void>
     - deleteCard(id: string): Promise<void>
     - getProgress(cardId: string, direction: 'front->back' | 'back->front'): Promise<CardProgress | undefined>
     - listProgress(setId?: string): Promise<CardProgress[]>
     - saveProgress(progress: CardProgress): Promise<void>
     - saveSession(session: StudySession): Promise<void>
     - getSession(id: string): Promise<StudySession | undefined>
     - listSessions(setId?: string): Promise<StudySession[]>

2. Create packages/core/storage/in-memory-repository.ts:
   - Implement InMemoryRepository implementing Repository using in-memory Maps.
   - Support cloning or deep copy on store/retrieve to prevent accidental reference mutation.

3. Export storage types and InMemoryRepository in packages/core/index.ts.

4. Create packages/core/storage/storage.test.ts:
   - Test CRUD for sets, cards, progress, and sessions.
   - Test deletion cascading behavior or isolated deletion.
   - Run vitest and verify all tests pass.
```

---

## Task 2: .flashset Format Serializer and Validator in Core (Milestone 1E)

**Branch name**: `feat/flashset-format`

### Jules Prompt:
```text
Implement the .flashset format serializer and validator in packages/core.

Context & Rules:
- Refer to PLAN.md Section 5 and Section 11 (Import / export / backup).
- Layering rule: packages/core must remain pure TypeScript (no DOM, React, Capacitor).
- Use Zod schemas from packages/core/model/index.ts for validation.
- Keep comments <= 2 lines. State only current behavior. Explicit types on all signatures.

Requirements:
1. Create packages/core/format/flashset.ts:
   - Define FlashsetBundleSchema using Zod:
     - version: z.literal(1)
     - schemaVersion: z.string()
     - exportedAt: z.number()
     - set: CardSetSchema
     - cards: z.array(CardSchema)
     - progress: z.array(CardProgressSchema).optional()
   - Define type FlashsetBundle = z.infer<typeof FlashsetBundleSchema>.
   - Implement exportFlashset(set: CardSet, cards: Card[], progress?: CardProgress[]): string
     - Validates and returns indented JSON string.
   - Implement importFlashset(jsonString: string): FlashsetBundle
     - Parses JSON and validates against FlashsetBundleSchema.
     - Validates relational integrity: ensures all cards reference set.id.
     - Throws descriptive Error on invalid JSON or schema validation failure.

2. Export format utilities in packages/core/index.ts.

3. Create packages/core/format/flashset.test.ts:
   - Test successful serialization and round-trip parsing of set and cards.
   - Test rejection of malformed JSON.
   - Test rejection of schema violations (e.g. missing required card fields).
   - Test rejection of cards whose setId does not match the bundle set.id.
   - Run vitest and verify all tests pass.
```

---

## Task 3: Numeric & Cloze Answer Checkers in Core (Milestone 3C)

**Branch name**: `feat/numeric-cloze-checkers`

### Jules Prompt:
```text
Implement NumericChecker and ClozeChecker in packages/core/checking.

Context & Rules:
- Refer to PLAN.md Section 6.4 (Other checkers).
- Layering rule: packages/core must remain pure TypeScript.
- Register checkers in packages/core/registry/index.ts.
- Keep comments <= 2 lines. Explicit types on all signatures.

Requirements:
1. Create packages/core/checking/numeric-checker.ts:
   - Implement AnswerChecker interface (id: 'numeric').
   - Support options:
     - tol: number (absolute tolerance, e.g. 0.01)
     - relTol: number (relative tolerance percentage, e.g. 0.05 for 5%)
     - unit: string optional (e.g. 'm/s^2')
   - Parse given and expected strings into number and unit.
   - Accept scientific notation (e.g. 1.5e-3, 1.5*10^-3).
   - If unit is specified or present, verify unit equivalence.
   - Return Verdict with via: 'numeric' or 'exact'.

2. Create packages/core/checking/cloze-checker.ts:
   - Implement AnswerChecker interface (id: 'cloze').
   - Support cards formatted with cloze deletions: {{c1::hidden text}}.
   - Given user input for blank(s), compare answers against expected cloze contents.
   - Return Verdict with via: 'exact' or 'normalized'.

3. Register numericChecker and clozeChecker in registry in packages/core/registry/index.ts.
   Re-export from packages/core/checking/index.ts.

4. Add unit tests:
   - packages/core/checking/numeric-checker.test.ts:
     - Exact number match, absolute tolerance match, relative tolerance match.
     - Out of tolerance rejection.
     - Scientific notation matches.
     - Unit preservation and mismatch rejection.
   - packages/core/checking/cloze-checker.test.ts:
     - Single blank match and rejection.
     - Multiple blanks matching.
   - Run vitest and verify all tests pass.
```

---

## Task 4: Pure Learn Mode State Machine & Round Queue in Core (Milestone 6A)

**Branch name**: `feat/learn-engine-core`

### Jules Prompt:
```text
Implement the pure Learn mode state machine and round queue in packages/core/learn.

Context & Rules:
- Refer to PLAN.md Section 7 (Learn mode) and Section 14 (Milestone 6).
- Layering rule: packages/core must stay pure TypeScript. No DOM, React, Capacitor.
- Randomness must be injectable and seedable. Never use Math.random() in core.
- Keep comments <= 2 lines. Explicit types on all signatures.

Requirements:
1. Create packages/core/learn/prng.ts:
   - Implement a simple, deterministic seedable PRNG (e.g., Mulberry32 or LCG).
   - Provide SeededRng class with nextFloat(): number, nextInt(min, max): number, shuffle<T>(array: T[]): T[].

2. Create packages/core/learn/types.ts:
   - Mastery levels: 0 (unseen), 1 (familiar / multiple choice), 2 (proficient / written typing), 3 (mastered).
   - Question types: 'mc' (multiple choice), 'write' (typed answer).
   - Question prompt: cardId, direction, qType, choices?: string[], acceptedAnswer: AnswerSpec.
   - Session state: cards in current round, missed queue for round retest, completed cards, round index.

3. Create packages/core/learn/engine.ts:
   - Implement LearnEngine:
     - constructor(cards: Card[], progress: Map<string, CardProgress>, options: LearnOptions, rng?: SeededRng)
     - getNextQuestion(): LearnQuestion | null
     - submitAnswer(cardId: string, verdict: Verdict, ms: number): { nextState: CardProgress; event: StudyEvent }
     - isRoundComplete(): boolean
     - startNextRound(): void
     - isSessionComplete(): boolean
     - getProgressSummary(): { mastered: number; familiar: number; unseen: number; total: number }
   - Card progression logic per PLAN.md Section 7.2:
     - Correct answer on Level 0 -> advances to Level 1.
     - Correct answer on Level 1 (MC) -> advances to Level 2 (write).
     - Correct answer on Level 2 (write) -> advances to Level 3 (mastered).
     - Incorrect answer on any level -> drops level or enters round retest queue until answered correctly.

4. Export learn module from packages/core/index.ts.

5. Create packages/core/learn/learn.test.ts:
   - Deterministic test using seeded PRNG.
   - Verify question progression: Level 0 -> Level 1 (MC) -> Level 2 (write) -> Level 3 (mastered).
   - Simulation test: simulate a student with p(correct) = 0.7 answering questions until session completion across 20 cards. Assert bounded steps and all cards reach Level 3.
   - Run vitest and verify all tests pass.
```

---

## Task 5: Multiple-Choice Distractor Generator in Core (Milestone 6B)

**Branch name**: `feat/learn-distractor-generator`

### Jules Prompt:
```text
Implement the multiple-choice distractor generator for Learn mode in packages/core/learn.

Context & Rules:
- Refer to PLAN.md Section 7.4 (Multiple-choice distractor generation).
- Layering rule: packages/core must stay pure TypeScript. No Math.random(); use SeededRng.
- Distractors must NEVER be equivalent to the correct answer (use mathChecker or textChecker).
- Keep comments <= 2 lines. Explicit types on all signatures.

Requirements:
1. Create packages/core/learn/distractors.ts:
   - Implement generateDistractors(targetCard: Card, allCards: Card[], count: number, rng: SeededRng): string[]
   - Distractor selection strategy:
     1. Pool candidate answers from cards in the same set or with matching tags.
     2. Apply math equation mutations where applicable (e.g. sign flip, invert fraction, substitute variables).
     3. Filter candidates: ensure distractor is NOT equivalent to targetCard's accepted answers using checker.
     4. Sample required number of unique distractors using the seeded RNG.
     5. If card pool is small (< count + 1), apply syntactic mutations to fill choices safely.

2. Export distractor utilities from packages/core/index.ts.

3. Create packages/core/learn/distractors.test.ts:
   - Test generating 3 distractors for a card in a 10-card set.
   - Test that the correct answer is never included in the distractors.
   - Test that generated distractors are unique and non-empty.
   - Test deterministic output when given the same RNG seed.
   - Run vitest and verify all tests pass.
```

