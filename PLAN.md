# PLAN.md — "Formula Flash": a math/science-first flashcard & Learn-mode app

> **Audience:** an autonomous AI coding agent (Claude Code, Codex, Cursor, etc.).
> **Owner:** a student/STEM user who wants a Quizlet/Knowt-style app that handles equations properly.
> **Working name:** `formulaflash` (rename freely; keep it in one config constant).

---

## 0. How to use this document

1. Read the whole plan once before writing code.
2. Work **milestone by milestone** (Section 14). Do not start milestone N+1 until N's acceptance criteria pass **and CI is green**.
3. Make small commits using Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
4. Anything marked **[HUMAN]** needs the owner (secrets, keystores, store accounts). Don't fake it. Write the needed instructions in `docs/HUMAN_SETUP.md` and continue with everything else.
5. Anything marked **[VERIFY]** is an API detail that may have changed. Check the current docs of the pinned library version before relying on it.
6. When a decision is ambiguous, pick the option that is **more configurable and more extensible**, write a short ADR in `docs/adr/`, and move on.
7. Keep `AGENTS.md` (Section 16) up to date. It's the persistent memory for future agent sessions.

---

## 1. Vision & non-negotiables

**One-line pitch:** Flashcards where the answer can be a real equation (`PV = nRT`, `P = \hat{\rho} R T`, `\frac{d}{dx}x^n = nx^{n-1}`), checked *intelligently*, studied with a proper adaptive Learn mode, on Android and desktop, from one codebase.

**Non-negotiables**
- **Math is a first-class citizen**, in terms, definitions, *and* answers: fractions, exponents, subscripts, Greek letters, accents (hat, bar, vec, dot, tilde), roots, sums/integrals/limits, matrices, units.
- **Answer entry is a real math editor**, not LaTeX typing. The user can type a hat above a letter, press `/` for a fraction, `^` for an exponent, etc. LaTeX is an *optional* power-user path.
- **A card can have many accepted answers**, and the checker can also accept *equivalent* forms (`nRT = PV`, `P = nRT/V`) according to configurable strictness.
- **Plain text cards work great too** (definitions, vocab). Mixed text + inline math in the same field is supported.
- **Learn mode** matches the Quizlet/Knowt model: staged questions (intro → multiple choice → typed answer), rounds, mastery tracking, switchable direction (term→def, def→term, mixed) — plus improvements.
- **Mobile-first, friendly UX.** Big touch targets, one-handed use, no clutter. Desktop gets keyboard-first shortcuts and a multi-pane layout.
- **Local-first.** Works offline, no account required. Data is the user's, exportable at any time.
- **Highly configurable and extensible** through a plugin-style registry (Section 8). Built-in features are implemented *through* that registry.
- **Automated builds:** every push builds an installable debug APK and runs the full test suite; tags produce signed releases for Android + desktop.

---

## 2. Research notes (what Learn mode actually does)

Summarized from public docs, help centers, and Quizlet's engineering blog. Treat as design inspiration, not a spec to clone byte-for-byte.

**Quizlet Learn**
- Adaptive session built from a set. Questions come in several formats: flashcard, multiple choice, written (and true/false in some versions). The user chooses which types are enabled.
- Difficulty ramps: it starts with easier recognition (multiple choice) and progresses toward harder written recall as you get cards right.
- Cards move between buckets such as *remaining* → *familiar* → mastered. A correct answer advances a card; a miss keeps it in play.
- A full session is commonly described as needing every term answered correctly twice.
- Quizlet's own write-up on question formats distinguishes *recognition* questions (true/false, MC, MC with "none of the above") from *cued recall* (typing). Guess probability differs (≈1/2 for T/F, ≈1/4 for 4-option MC, ≈1/5 with "none of the above"; typing can't be guessed), which is why recall gets weighted as stronger evidence of mastery.
- Written mode corrects spelling and asks the user to type it again.

**Knowt Learn**
- Options before starting: question types (multiple choice, true/false, written, flashcard) and *question format* (answer with the term, the definition, or both).
- If several types are enabled, each card is first introduced with an easier question (true/false or MC) before active-recall written questions.
- Immediate right/wrong feedback; tracks progress and adjusts difficulty; focuses on weak cards.
- Users have asked for (and partially received): an **"I don't know"** button on written questions, a **"mark my answer correct"** override, and **retyping the correct answer after a miss**. We build all three from day one.
- Knowt separately has a spaced-repetition mode with self-rated difficulty, which schedules harder cards sooner and introduces new cards in later rounds. We'll include a true SRS (FSRS) as a separate mode and feed Learn results into it.

**Takeaways for us**
1. A per-card mastery state machine, not a flat quiz.
2. Question *type* is chosen from card state; *direction* is chosen from user config.
3. Typed recall is the gate to "mastered".
4. Escape hatches (I don't know, override as correct, retype-after-miss) are essential, doubly so for math answers where the checker can be wrong.

---

## 3. Tech stack (decisions + rationale)

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | One language for core logic, UI, tests |
| UI | **React 18 + Vite** | Mature, fast, huge ecosystem |
| Styling | **Tailwind CSS + CSS variables for themes** + Radix primitives | Fast to build accessible, themeable UI |
| Math input/edit | **MathLive** (`<math-field>`) | WYSIWYG math editor, mobile virtual keyboards, accents/Greek/fractions/exponents, LaTeX/MathML/MathJSON output, custom keyboards & shortcuts, MIT-licensed |
| Math static render | **KaTeX** (fallback: MathLive static `math-span`) | Fast for long lists. Add a render-compat test corpus (Section 6.5) |
| Math semantics | **@cortex-js/compute-engine** (lazy-loaded) | Parse LaTeX → MathJSON, canonicalize, evaluate numerically. **Pin versions; API changes between releases [VERIFY]** |
| Android | **Capacitor** (Android platform) wrapping the web build | Mature; produces a real APK/AAB; plugins for files, share, haptics, filesystem |
| Desktop | **Tauri 2** (Windows/macOS/Linux) wrapping the *same* web build. Fallback: Electron if Tauri webview quirks block MathLive | Small binaries, same UI code |
| Web/PWA | Also deploy the web build (GitHub Pages) | Free third platform, great for quick manual testing |
| Storage | **Dexie (IndexedDB)** behind a `Repository` interface; optional SQLite adapter later | Simplest identical behavior on all shells. Mitigate eviction risk with auto-backups (Section 11) |
| Scheduling | **ts-fsrs** (FSRS algorithm) | Modern, well-tested SRS |
| CSV | **PapaParse** | Robust parsing: quotes, multiline, custom delimiters, auto-detect |
| State | **Zustand** (UI state) + repository (persistent) | Light and testable |
| i18n | **i18next** | UI strings externalized from day one |
| Tests | **Vitest** (unit/property), **Testing Library** (components), **Playwright** (web e2e), **fast-check** (property tests), **Maestro or adb smoke test** on Android emulator | See Section 13 |
| Lint/format | ESLint, Prettier, `dependency-cruiser` (enforce layering), `tsc --noEmit` | Keep architecture honest |
| CI/CD | **GitHub Actions** | Section 12 |

**Licenses:** verify every dependency is permissive (MIT/Apache/BSD). Generate `THIRD_PARTY_NOTICES.md` in CI.

---

## 4. Architecture

```
repo/
├─ AGENTS.md                     # agent memory/rules (Section 16)
├─ PLAN.md                       # this file
├─ docs/
│   ├─ adr/                      # architecture decision records
│   ├─ HUMAN_SETUP.md            # keystore, secrets, store steps
│   ├─ PLUGINS.md                # how to write a plugin
│   └─ IMPORT_FORMATS.md
├─ packages/
│   └─ core/                     # PURE TypeScript. No DOM, no React, no Capacitor.
│       ├─ model/                # types, schemas (zod), migrations
│       ├─ registry/             # plugin registry + extension points
│       ├─ content/              # rich-content parse/serialize ($...$ ↔ segments)
│       ├─ checking/             # answer checkers (text, math, numeric, list, cloze)
│       ├─ math/                 # latex normalize, accent handling, equivalence
│       ├─ learn/                # Learn-mode engine (state machine, queue, distractors)
│       ├─ srs/                  # FSRS wrapper
│       ├─ importexport/         # csv/tsv/txt/json/quizlet-paste/anki
│       ├─ settings/             # layered settings + JSON-schema
│       └─ testing/              # fixtures, corpora, helpers
├─ apps/
│   └─ app/                      # React UI + platform shells
│       ├─ src/
│       │   ├─ ui/               # screens, components
│       │   ├─ editors/          # MathField wrapper, RichField, keyboards
│       │   ├─ platform/         # adapters: storage, files, share, haptics, tts
│       │   ├─ plugins/builtin/  # built-in plugins (use the same API as 3rd party)
│       │   └─ i18n/
│       ├─ android/              # Capacitor Android project (generated, committed)
│       ├─ src-tauri/            # Tauri 2 desktop shell
│       └─ e2e/                  # Playwright tests
└─ .github/workflows/
```

**Layering rules (enforced by dependency-cruiser in CI)**
- `packages/core` imports nothing from `apps/*`, React, or any DOM/Capacitor API.
- `ui` talks to persistence only through `Repository`, and to the OS only through `platform/*` interfaces. This makes Android/desktop/web differences a handful of adapters.
- Everything user-visible that is "a kind of X" (card type, checker, importer, study mode, theme, keyboard layout, distractor generator, scheduler) is registered in the **registry** (Section 8).

---

## 5. Data model

Use `zod` schemas as the single source of truth; derive TS types; version everything with `schemaVersion` and write forward migrations.

```ts
// ---------- Rich content ----------
// A field's content is a list of segments, stored as JSON AND serializable to a
// portable string: plain text with inline math in $...$ (display math in $$...$$).
type Segment =
  | { t: "text"; v: string }                     // may support light markdown: **bold**, _italic_, newline
  | { t: "math"; latex: string; display?: boolean }
  | { t: "image"; mediaId: string; alt?: string }
  | { t: "audio"; mediaId: string }
  | { t: "ext"; kind: string; data: unknown };   // extension segments (plugins)
type RichContent = Segment[];

// ---------- Sets / cards ----------
interface CardSet {
  id: string; title: string; description?: RichContent;
  tags: string[]; folderId?: string;
  createdAt: number; updatedAt: number;
  settings: Partial<SettingsValues>;             // per-set overrides (Section 9)
  defaultCardType: string;                       // registry key
  extra: Record<string, unknown>;                // plugin data
}

interface Card {
  id: string; setId: string; order: number;
  type: string;                                  // registry key, e.g. "basic", "equation", "cloze", "numeric", "list"
  front: RichContent;                            // the "term"
  back: RichContent;                             // the "definition"/display answer
  // How the user's typed answer is graded:
  answer: AnswerSpec;
  hints: RichContent[];                          // progressive hints
  explanation?: RichContent;                     // shown after answering (derivation, notes)
  tags: string[]; starred: boolean;
  media: string[];
  extra: Record<string, unknown>;
  createdAt: number; updatedAt: number;
}

// Accepted answers: one or many; each can have its own checker.
interface AnswerSpec {
  checker: string;                               // registry key: "text" | "math" | "numeric" | "list" | "cloze" | ...
  accepted: Array<{ content: RichContent; note?: string }>;   // ANY of these is correct
  options: Record<string, unknown>;              // checker options, overrides set/app defaults
}

// ---------- Study state ----------
interface CardProgress {                         // per card, per "direction"
  cardId: string; direction: "front->back" | "back->front";
  learn: { level: 0|1|2|3; streak: number; lastResult?: "right"|"wrong"|"skipped"; lastSeen?: number };
  srs?: FsrsState;
  stats: { seen: number; right: number; wrong: number; avgMs: number };
}
interface StudySession { id: string; setIds: string[]; mode: string; startedAt: number; endedAt?: number;
  config: unknown; events: StudyEvent[]; snapshot?: unknown /* resumable state */ }
interface StudyEvent { cardId: string; direction: string; qType: string; given: unknown; verdict: Verdict; ms: number; at: number }
type Verdict = { correct: boolean; via: "exact"|"normalized"|"structural"|"numeric"|"fuzzy"|"override"; closeness?: number; message?: string };
```

**Portable file format: `.flashset`** (zip containing `set.json` + `media/`), plus plain `.json` without media. Always include `schemaVersion` and the generator version.

---

## 6. The hard part: math input, rendering, and answer checking

### 6.1 Math input component (`<MathField>` wrapper)

Wrap MathLive's `<math-field>` in a React component with: controlled `latex` value, `onChange`, `readOnly`, `placeholder`, configurable keyboard, and a "show LaTeX" toggle for power users.

**Must support (acceptance-tested):**
- Typing `/` → fraction; `^` → exponent; `_` → subscript; `sqrt` → root; typing Greek names (`alpha`, `rho`, `Delta`) → symbols; auto-conversion of common ASCII patterns.
- **Accents above letters**: hat, bar/overline, vec, dot, ddot, tilde, widehat. Provide (a) a toolbar/keyboard key "Hat" that applies to the *selected or immediately preceding* symbol, and (b) the LaTeX path `\hat{R}`. Implementation hint: MathLive's `insert()` with a template such as `\hat{#@}` where `#@` stands for the selection/previous argument **[VERIFY exact placeholder semantics in the pinned version]**. Add a custom virtual key + keyboard shortcut so "type R, tap Hat" gives R̂.
- Sums, products, integrals, limits, partial derivatives (`\partial`), `\nabla`, vectors/matrices, absolute value, binomials, `\cdot`, `\times`, `\pm`, `\approx`, `\propto`, arrows, units via `\mathrm{...}`.
- **Custom virtual keyboard layout "Science"** (tabs: *Basics*, *Greek*, *Accents & Decorations*, *Calculus*, *Chemistry/Physics* (ΔH, ⇌, →, °, units), *Logic/Sets*). Layouts are data, not code, so users/plugins can add tabs (Section 8).
- Use the MathLive virtual keyboard on Android (policy `manual` so *we* control when it appears; suppress the OS keyboard for math fields; allow switching to the OS keyboard for text fields) **[VERIFY policy attributes]**. Keyboard must never cover the field being edited or the Submit button: handle with `visualViewport` + the keyboard's `geometrychange` event.
- Physical keyboard on desktop: all of the above by typing, plus a **shortcut cheat-sheet** popover.
- Accessibility: math-to-speech for TalkBack/screen readers; large-text support.

**Mixed text + math fields (`RichField`)**: one text box where the user types normally and presses a **∑ button / `$` shortcut / `Ctrl+M`** to insert an inline math chip that edits in place with the math keyboard. Backing store is `RichContent`. Serialize to/from `plain $latex$ plain` for CSV/clipboard.

**Answer entry has three modes** (user can switch on the fly, remembered per set): *Math editor* (default for math answers), *Plain text*, *LaTeX source*.

### 6.2 Rendering
- Static display everywhere (lists, flashcard faces, MC options, results) via KaTeX; editing via MathLive.
- Auto-shrink long equations; horizontal scroll for overflow; never clip.
- Dark/light/AMOLED theming for math glyphs.

### 6.3 Checking pipeline (math answers)

All checkers implement one interface (Section 8). The **math checker** works in tiers; the first tier that matches decides. Each tier is toggleable via options so strictness is configurable per card/set/app.

```
input LaTeX ──► preprocess ──► tier 1 ──► tier 2 ──► tier 3 ──► tier 4 ──► verdict
                               exact      structural  algebraic  solution-set
                               string     AST         numeric    sampling
                               (normalized)                      (equations)
```

**Preprocess (critical).** The Compute Engine will happily "interpret" accents/subscripts and may canonicalize things we want kept distinct. So *before* parsing:
1. Normalize whitespace, `\left/\right`, `\dfrac→\frac`, `\cdot`/`\times`/implicit-mult unification, `\mathrm`/`\text` units, `^{2}` vs `^2`, braces, `\le`/`\leq`, etc.
2. **Replace decorated symbols with unique opaque symbols** before parsing: `\hat{R}` → `R__hat`, `\bar{x}` → `x__bar`, `\vec{v}` → `v__vec`, `\dot{x}` → `x__dot`, `R_{m}` → `R__sub_m`. These are then ordinary distinct variables. **Result: R and R̂ are different symbols** by default, so `P = ρ̂ R T` ≠ `P = ρ R T`. An option `accentsMatter=false` strips accents (lenient mode).
3. Greek variants (`\epsilon`/`\varepsilon`, `\phi`/`\varphi`, `\theta`/`\vartheta`) are equal iff `greekVariantsEqual=true` (default true).

**Tier 1 – normalized string equality.** After preprocess, compare strings.

**Tier 2 – structural equality.** Parse to MathJSON, canonicalize (flatten, sort commutative operands, combine like terms only if `allowSimplify`), compare ASTs. Equations: also accept swapped sides (`nRT = PV`) if `allowSideSwap` (default true).

**Tier 3 – algebraic/numeric equivalence (expressions).** If `allowEquivalentForms`: treat the two *expressions* as equal if they agree (within relative tolerance, default `1e-9`) on N random assignments (default N=24) of their free variables, drawn from configurable domains (default positive reals in [0.5, 5] to avoid singularities, with retries when a sample gives NaN/∞). Handles `\frac{1}{2}mv^2` vs `\frac{mv^2}{2}`.

**Tier 4 – equation equivalence by solution-set sampling.** Rearranged equations (`PV=nRT` vs `P=\frac{nRT}{V}` vs `PV-nRT=0`) are *not* equal as expressions, so:
1. For reference equation `A=B`, generate K sample points that satisfy it: choose random values for all variables except one *solve-for* variable, then solve for that variable (symbolically via the engine when possible, otherwise numeric root-finding). Repeat while rotating the solve-for variable.
2. Check the student's equation `C=D` holds at each sample point (`|C−D| ≤ tol·scale`).
3. Do it again swapped (reference ↔ student) so *implication in both directions* is required (student `P=nRT` fails this: it holds at no reference points).
4. Guard against degenerate matches: reject student equations that are tautologies (`0=0`, `x=x`) or that don't mention the same variable set when `requireSameVariables=true` (default true).

Report which tier matched in `Verdict.via`, so the UI can say *"Correct — equivalent to the stored answer (rearranged)"*.

**Always available escape hatches:** author-listed **alternate answers** (any one accepted — this alone covers the owner's `PV=nRT` / `P=\hat{\rho}RT` use case); the user's **"I was right" override** after a miss (which can optionally *offer to save their answer as a new accepted alternate*); and an **"I don't know"** button.

### 6.4 Other checkers (all built-in plugins)
- **text**: normalize case/whitespace/punctuation/diacritics (each toggle), optional-parenthetical syntax (`(the) mitochondria`), slash alternates (`color/colour`), Levenshtein/Damerau tolerance scaled by length (configurable; "close — retype" state like Quizlet's spelling correction), optional stemming off by default.
- **numeric**: value + tolerance (absolute/relative/sig-figs) + **units** (accept equivalent units/prefixes via a small unit table, e.g. `J = N·m`, `kJ`), scientific notation forms.
- **list**: ordered or unordered multi-part answers ("name the 4 fundamental forces"), partial credit option.
- **cloze**: `{{c1::ρ}}` style hidden parts inside text *or inside an equation* (a LaTeX placeholder `\placeholder{}` / custom macro), each blank graded individually.
- **choice-only**: card exists only for MC (no typed answer).
- **self-graded**: user flips and rates themselves (for things that can't be machine-checked).

### 6.5 Test corpus (write these FIRST — TDD)

Create `packages/core/testing/math-corpus.ts` with at least the cases below, plus 100+ more generated from a table, and run them in CI. **ACCEPT** = checker returns correct; **REJECT** = incorrect.

```
Reference: PV = nRT
ACCEPT  PV=nRT | nRT=PV | P V = n R T | P=\frac{nRT}{V} | V=\frac{nRT}{P} | PV-nRT=0 | nRT/V=P
REJECT  P=nRT | PV=nR | PV=nRT^2 | P=\frac{nR}{V} | PV=nrT (case) | PV=nRt

Reference: P = \hat{\rho} R T   (ρ-hat = a distinct symbol)
ACCEPT  P=\hat{\rho}RT | P=R T\hat{\rho} | \hat{\rho}RT=P | \frac{P}{\hat{\rho}}=RT
REJECT  P=\rho RT   (accentsMatter=true)        ACCEPT same when accentsMatter=false
REJECT  P=\hat{\rho}R | P=\bar{\rho}RT

Reference: E = \frac{1}{2} m v^{2}
ACCEPT  E=\frac12mv^2 | E=\frac{mv^2}{2} | 2E=mv^2 | E=0.5mv^2 | E=m\cdot v^{2}/2
REJECT  E=mv^2 | E=\frac12 m v | E=\frac12 m^2 v

Reference: \Delta G = \Delta H - T\Delta S
ACCEPT  \Delta G=\Delta H-T\Delta S | \Delta G=\Delta H-\Delta S T | \Delta H=\Delta G+T\Delta S
REJECT  \Delta G=\Delta H+T\Delta S | G=H-TS (Δ missing)

Reference: x = \frac{-b\pm\sqrt{b^2-4ac}}{2a}
ACCEPT  equivalent ± forms, \frac{-b\pm\sqrt{b^{2}-4ac}}{2a}
REJECT  missing 2a / sign errors

Text: "mitochondria" ACCEPT "Mitochondria", "mitochondira"(typo, fuzzy→"close"), REJECT "chloroplast"
```
Add **property-based tests** (fast-check): random expression → apply random equivalence-preserving rewrites (commute, distribute, multiply-through) → must ACCEPT; apply random meaning-changing mutations (change exponent, sign, swap variable) → must REJECT with ≥99% reliability. Track flake rate; sampling must be seeded and deterministic in tests.

**Render-compat test:** every LaTeX string MathLive can emit from the Science keyboard must render in KaTeX without error (or fall back to MathLive's renderer). Test in CI.

---

## 7. Learn mode (the centerpiece)

Implement as a **pure state machine in `packages/core/learn`** with a UI on top. The engine takes `(cards, progress, config, rng)` and yields the next `Question`; the UI only renders it and reports an answer. That makes it deterministic and fully unit-testable with seeded RNG.

### 7.1 Pre-session options (all persisted, all overridable per set)
- **Question types** (toggle each): Flashcard intro · True/False · Multiple choice · **Written/typed** (math editor or text, per card) · Cloze · Matching (mini-round).
- **Answer with:** *Definition* (given term) · *Term* (given definition) · *Both / mixed* (per-question random or alternating). Optional per-card override ("always show the equation as the answer").
- **Round size** (default 7, range 3–20) · **Shuffle** · **Starred only** · **Weak cards only** · **Tags filter** · **New cards per session**.
- **Typing strictness** preset (Lenient / Normal / Strict) mapped to checker options.
- **Retype-after-miss** (default ON): after a wrong written answer, the correct answer is shown and the user must type it before continuing.
- **"Prove it" gate** (default ON): MC success alone never reaches *Mastered*; typing the answer does. If written is disabled, mastery requires N consecutive MC successes (default 2).
- **Hints**: progressive (first symbol / structure / full hint) with a small penalty to mastery progress.
- Audio (TTS) on/off, haptics, sounds, confetti, timer (off by default), "I don't know" button, "mark my answer correct" override.

### 7.2 Per-card mastery levels (per direction)
```
Level 0  NEW         never seen this session
Level 1  INTRODUCED  seen via flashcard / T-F / easy MC
Level 2  FAMILIAR    answered a recognition question (MC) correctly
Level 3  MASTERED    answered a typed (recall) question correctly
```
**Question-type selection by level** (respecting enabled types; degrade gracefully):
| Level | Preferred question | If unavailable |
|---|---|---|
| 0 | Flashcard intro (reveal) or True/False | MC |
| 1 | Multiple choice | T/F → written |
| 2 | **Written/typed** | MC again (needs 2 in a row) |
| 3 | done (re-quiz only if it decays, Section 7.5) | — |

**Transitions:** correct → level+1 (not past 3). Wrong MC → back to level 1, re-queue soon. Wrong typed → back to level 2, show answer, retype gate, re-queue soon. "I don't know" → treated as wrong + reveal. Override-as-correct → counts as correct, logged `via:"override"`. Hints used → correct but no level gain on that attempt (configurable).

### 7.3 Rounds & queue
1. Start session → build **working set** of eligible cards (after filters). Sort: carry-over wrong cards first, then partially learned, then new.
2. A **round** takes the next *R* (round size) cards that aren't mastered. Within the round, cycle through them; a missed card is re-inserted ≥2–3 positions later (never immediately back-to-back; but may repeat within the round).
3. **Round summary screen:** how many Mastered / Familiar / Still learning, cards you missed (tap to view), streak, time. Buttons: *Continue*, *Study missed only*, *Switch direction*, *End session*.
4. **Session completes** when every card is Mastered (in every chosen direction when "Both" is selected). Final screen: stats, weak cards, "Create a set from my missed cards", "Schedule these in spaced repetition" (feeds FSRS), share.
5. Sessions are **persisted & resumable** (kill the app mid-round and resume).

### 7.4 Multiple-choice distractor generation (big UX quality lever)
Implemented as a registry of `DistractorGenerator`s, merged and ranked, then filtered through the *same checker* to guarantee no distractor is accidentally correct.
1. **Same-set neighbors:** other cards' answers, preferring same card type, same tags, and similar length/shape (similarity scoring).
2. **Math mutators** (for equation answers): flip a sign; change an exponent ±1; swap two variables; drop/duplicate a factor; invert a fraction; swap Greek variant; add/remove an accent (e.g. P=ρRT vs P=ρ̂RT); swap sub/superscript. Mutated answers are parsed and *verified non-equivalent* to every accepted answer before use.
3. **Text mutators:** near-synonyms from the set; "none of the above" variant (configurable probability, per Quizlet's finding that it lowers guess odds).
4. Option count configurable (2–6, default 4). Options are rendered with the shared KaTeX component so equations display properly. Keyboard-selectable (1–6).

### 7.5 Feeding the long-term scheduler
Each Learn answer emits a `StudyEvent`. At session end, mastery results seed **FSRS** state (first review ratings: right-typed ≈ Good, right-MC-only ≈ Hard, wrong ≈ Again), so the user can move to **Spaced Review** without starting from scratch. Learn mode also supports a "refresher" pass that re-checks mastered cards after a delay.

### 7.6 Learn-mode UX details
- One question per screen, giant tap targets, progress bar segmented by level, subtle haptic/sound (toggleable), smooth transitions.
- Immediate feedback sheet: ✓/✗, the correct answer rendered, *your answer vs correct* side-by-side with the differing part highlighted (for math, highlight at the token level), the `via` note ("equivalent form accepted"), optional explanation, and buttons **Continue**, **I was right**, **Save my answer as alternate**.
- Works one-handed in portrait; two-pane (question / history) on tablets and desktop.
- Keyboard flow on desktop: `Enter` submit, `Space`/`Enter` continue, `1–6` choose, `H` hint, `D` don't know, `O` override.

---

## 8. Extensibility: the registry & plugin API

A single typed `Registry` in `packages/core/registry`. **Every built-in is registered through it** (dogfooding). Plugins can be bundled at build time (v1) and later loaded from user-installed packs (v2, sandboxed).

```ts
interface Registry {
  cardTypes:        Map<string, CardTypeDef>;        // form fields, validation, default AnswerSpec, renderer
  checkers:         Map<string, CheckerDef>;         // (given, spec, options) => Verdict
  questionTypes:    Map<string, QuestionTypeDef>;    // flashcard, mc, tf, written, cloze, matching, ...
  studyModes:       Map<string, StudyModeDef>;       // learn, flashcards, test, match, spaced, formula-builder, ...
  importers:        Map<string, ImporterDef>;        // detect(), parse() -> ImportDraft
  exporters:        Map<string, ExporterDef>;
  distractors:      Map<string, DistractorGenDef>;
  schedulers:       Map<string, SchedulerDef>;       // fsrs, leitner, sm2
  segments:         Map<string, SegmentDef>;         // custom rich-content segments (e.g. chem formulas, molecules)
  keyboards:        Map<string, KeyboardLayoutDef>;  // MathLive layouts/tabs/shortcuts/macros
  themes:           Map<string, ThemeDef>;
  settingsSchemas:  Map<string, JSONSchema>;         // plugin settings, auto-rendered in Settings UI
  commands:         Map<string, CommandDef>;         // command palette entries / shortcuts
  hooks:            HookBus;                         // onAnswer, onSessionEnd, onImport, onCardSave, ...
}
interface Plugin { id: string; version: string; register(r: Registry): void; }
```

- **Settings are schema-driven:** each registry entry exposes a JSON Schema for its options; the Settings UI, per-set override panel, and per-card "advanced" drawer are auto-generated from it. Adding a new checker option = adding a schema field, no UI code.
- **Layered settings resolution:** `built-in defaults < app settings < set settings < session settings < card settings`. `core/settings` has a `resolve(path, ctx)` with provenance (so the UI can show "inherited from set").
- **Docs:** `docs/PLUGINS.md` with a worked example (a "chemistry formula" segment + checker using `\ce{}`-style input).
- **Example extensions that prove the API** (ship as built-in plugins): `plugin-physics-units`, `plugin-greek-latin-keyboard`, `plugin-chem-equations`, `plugin-anki-import`.

---

## 9. Configuration surface (put it in Settings, all searchable)

**Appearance:** theme (light/dark/AMOLED/system + accent color), font size, math size, card density, animations, reduced motion, left-handed layout.
**Math entry:** default input mode, keyboard layout & tab order, hat/accent shortcuts, auto-conversion rules, show LaTeX toggle, custom macros (`\R` → `\mathbb{R}`), custom shortcuts (e.g. `rho` → `ρ`).
**Checking:** strictness presets + every option from §6.3/6.4 (accentsMatter, allowSideSwap, allowEquivalentForms, sampling N/tolerance/domains, requireSameVariables, text fuzzy threshold, ignore case/punct/diacritics, units handling).
**Learn:** all of §7.1, plus default direction, MC option count, none-of-the-above rate, mastery rule, retype-after-miss, hint penalty.
**Study modes:** which modes appear; per-mode options.
**Data:** auto-backup frequency/location, export format defaults, import defaults (delimiters, headers), dedupe policy, storage usage.
**Notifications:** daily review reminder (Android notification / desktop notification), quiet hours.
**Advanced:** feature flags, plugin list, reset-to-defaults per section, export/import *settings* as JSON.

---

## 10. Screens & UX

**Principles:** friendly, calm, obvious. The most common task (study) is ≤2 taps from launch; the second most common (add a card) is ≤2 taps from anywhere. Everything has an empty state that tells you what to do next. Undo, not confirm-dialogs.

**Navigation (mobile):** bottom bar — **Library · Study · Create (+) · Stats · Settings**. Desktop: left sidebar + command palette (`Ctrl/Cmd+K`) + resizable panes.

**Key screens**
1. **Home/Library:** "Continue studying" card, due-for-review count, recent sets, folders/tags, search (fuzzy across terms/definitions/LaTeX).
2. **Set view:** header (title, counts, mastery ring), big **Study** button + mode chips, card list with rendered math, multi-select (move/tag/star/delete), drag to reorder, inline-edit.
3. **Create/Edit set:** title + description; a **fast card editor**: Term field, Definition/Answer field(s); each field has a segmented control **Text · Math · Mixed**; "+ accepted answer" adds an alternate (each with its own mini math editor); "+ hint", "+ explanation"; **Save & next** keeps the keyboard up and the cursor in Term for rapid entry; templates (Basic, Equation, Numeric, Cloze, List).
4. **Bulk add:** paste a block of text → live preview table → choose delimiter → create (Section 11).
5. **Import wizard** (Section 11) and **Export** sheet.
6. **Study mode picker** → mode-specific options sheet → session.
7. **Learn session + round summary** (Section 7.6).
8. **Flashcards mode:** flip animation, swipe left/right = still learning / know it (configurable), tap-to-flip, auto-play option, shuffle, starred-only, front/back swap.
9. **Test mode:** generate a configurable test (counts per question type, include math entry questions), timed optional, graded report, **export to printable PDF**, retake missed.
10. **Match mode:** timed drag-match of terms↔definitions/equations, best-time tracking.
11. **Spaced review:** FSRS queue; Again/Hard/Good/Easy; daily limits; heatmap.
12. **Stats:** streaks, mastery per set/tag, hardest cards, time per question, accuracy by question type, forecast of upcoming reviews.
13. **Settings** (Section 9), **Backup & restore**, **About / licenses**.
14. **First-run:** 20-second tour + sample set ("Ideal Gas Law & friends") to play with immediately, which doubles as the e2e fixture.

**Accessibility & polish:** TalkBack/VoiceOver labels everywhere, math read aloud, ≥48dp touch targets, contrast AA+, dynamic font scaling, reduced motion, full keyboard navigation on desktop, RTL-ready layout, localization-ready strings.

---

## 11. Import / export / backup

### 11.1 Import (wizard, never destructive without preview)
**Sources:** pick a file (Android document picker / desktop dialog / drag-and-drop), paste text/clipboard, open-with / share-into-app intent for `.csv`, `.tsv`, `.txt`, `.json`, `.flashset`.
**Formats:** CSV, TSV, TXT with arbitrary delimiter(s), JSON/`.flashset`, **Quizlet-style paste** (term and definition separated by a configurable delimiter — tab by default — and cards separated by a configurable delimiter, newline by default), Markdown lists (`term :: definition`), Anki text export, Anki `.apkg` (plugin, v2).
**Wizard steps:**
1. **Detect** encoding (UTF-8/UTF-16/Latin-1 with BOM sniffing), delimiter (`, ; \t | ::` or custom string/regex), header row, quote/escape rules.
2. **Separators** — separately configurable: *between columns* and *between rows/cards*, each with presets + custom + regex, with "multiline cell" support.
3. **Column mapping:** Term · Definition · Accepted alternates (split by a configurable inner delimiter, e.g. ` | `) · Hints · Explanation · Tags · Image/URL · Card type · Notes · *(ignore)*. Save mapping presets.
4. **Math handling:** treat `$...$`/`\(...\)` as math (default) · treat an entire column as LaTeX · treat an entire column as ASCIIMath/plain-math (best-effort conversion, e.g. `x^2`, `sqrt(x)`, `alpha`) · leave as text. Unconvertible cells flagged in the preview.
5. **Preview table** (first 50 rows rendered with real math), per-row warnings (empty term, duplicate, unparsable LaTeX), toggles to skip rows, edit cells inline.
6. **Destination:** new set / append to set / merge with dedupe (policy: skip, update, keep both; match on normalized term).
7. **Result report** + **Undo import**.
**Robustness:** quoted multiline fields, embedded delimiters, escaped quotes, ragged rows, 10k+ rows without freezing (stream/parse in a worker), clear error messages with row numbers. Fuzz-test the parser.

### 11.2 Export
`.flashset` (lossless, with media) · JSON · CSV/TSV/TXT with configurable delimiters (and a "Quizlet-compatible" preset) · Markdown · printable PDF (cards or test sheet) · Anki-compatible text. Android share sheet + desktop save-as. **Round-trip tests**: export → import must reproduce the set exactly.

### 11.3 Backup & restore
Automatic local backups (daily/weekly, keep last N) to app storage with one-tap "Save copy to…" (user-chosen folder via Storage Access Framework on Android). Whole-library backup/restore. **[Later]** pluggable sync target (folder sync, WebDAV, Google Drive) as a `SyncProvider` plugin with conflict resolution by `updatedAt` + per-field merge.

---

## 12. Build, test & release automation (GitHub Actions)

**Goal:** *every push produces an installable APK and a full test report; tags produce signed releases for Android and desktop.*

### 12.1 Workflows
`.github/workflows/ci.yml` — on push & PR:
1. **lint-typecheck-unit:** `pnpm i --frozen-lockfile` → `eslint` → `tsc --noEmit` → `dependency-cruiser` → `vitest run --coverage` (upload coverage; enforce thresholds, ≥90% on `packages/core/checking|learn|importexport`).
2. **web-e2e:** build web → Playwright (Chromium + WebKit + Firefox) against the built app, including the MathLive hat/fraction/exponent entry flow and a full Learn session on the sample set. Upload traces/videos on failure.
3. **android-debug-apk:** JDK 17, Android SDK, Gradle cache → `pnpm build` → `npx cap sync android` → `./gradlew assembleDebug` → **upload `app-debug.apk` as an artifact** (named with commit SHA + version) and attach to a rolling `nightly` pre-release on `main`.
4. **android-instrumented-smoke:** boot an emulator (`reactivecircus/android-emulator-runner`), install the APK, run a **Maestro** (or adb + UIAutomator) smoke flow: launch → open sample set → run 3 Learn questions including one typed math answer → backgrounding/resume. Upload screenshots + logs.
5. **desktop-build-check:** on `main` and PRs touching desktop, build Tauri for Linux (cheap) to catch breakage.
6. **pages:** deploy the web build to GitHub Pages on `main`.

`.github/workflows/release.yml` — on tag `v*.*.*`:
- **Android:** build **signed release APK + AAB** using keystore from secrets **[HUMAN]**, `apksigner verify` step, attach to GitHub Release.
- **Desktop:** `tauri-apps/tauri-action` matrix for `windows-latest`, `macos-latest`, `ubuntu-latest` → MSI/NSIS, DMG, AppImage/deb. (Code signing/notarization optional **[HUMAN]**; unsigned builds still produced.)
- **Changelog:** generated from Conventional Commits (release-please or semantic-release); version bump synced across `package.json`, Android `versionName/versionCode`, and `tauri.conf.json` via a single script.
- Provide `docs/HUMAN_SETUP.md` listing exact secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, optional Apple/Windows signing secrets, and the `keytool` command to generate a keystore. **Never commit secrets.**

Also: Dependabot/Renovate (grouped, weekly), CodeQL, `pnpm audit` (non-blocking warning), concurrency groups to cancel stale runs, cache pnpm + Gradle + Playwright browsers, branch protection recommendation (require `ci` to pass).

### 12.2 Local developer commands (all documented in README)
`pnpm dev` (web) · `pnpm test` · `pnpm test:e2e` · `pnpm android:run` (sync + run on device/emulator) · `pnpm android:apk` (debug APK to `dist/`) · `pnpm desktop:dev` · `pnpm desktop:build` · `pnpm lint` · `pnpm typecheck` · `pnpm release:dry`.

---

## 13. Testing strategy

| Layer | What | Tools |
|---|---|---|
| Unit | checkers, normalizers, distractors, learn state machine, scheduler wrapper, settings resolution, importers/exporters | Vitest |
| Property | equivalence rewrites accept / mutations reject; import↔export round-trip; Learn engine invariants (never asks mastered card, never repeats same card back-to-back, always terminates, mastery monotonic except on miss) | fast-check |
| Golden corpus | §6.5 math/text cases; CSV edge-case files in `testing/fixtures/` | Vitest |
| Component | MathField (hat/frac/exponent insertion, controlled value), RichField, MC question rendering with KaTeX | Testing Library + jsdom/Playwright CT |
| E2E (web) | create set → add equation card with hat → import CSV → Learn session to completion → export | Playwright |
| E2E (Android) | smoke flow on emulator | Maestro/adb |
| Visual regression | key screens & math rendering in light/dark | Playwright screenshots |
| Performance | 5,000-card set: library scroll, search, session start < 500 ms on mid-range device; CSV 10k rows parse < 2 s | Vitest bench / Playwright |
| Accessibility | axe checks in Playwright; manual TalkBack checklist in docs | axe-core |

**Rules:** a bug fix must ship with a regression test. The Learn engine and checkers are driven by seeded RNG so every failure is reproducible (`SEED` printed in test output).

---

## 14. Milestones (with acceptance criteria)

**M0 — Foundation & CI skeleton**
- Monorepo, TS strict, lint/format, dependency-cruiser, Vitest, Playwright wired. `AGENTS.md`, `docs/HUMAN_SETUP.md` stubs.
- CI runs unit tests; **Android debug APK builds and uploads as an artifact** (even if the app is "Hello world"); Pages deploy of web build.
- ✅ *Done when:* pushing to `main` yields a downloadable, installable APK and a green check.

**M1 — Core model, storage, registry, settings**
- zod schemas + migrations, `Repository` (Dexie), registry, layered settings with provenance, `.flashset` read/write.
- ✅ Unit tests for migrations, settings resolution, repo CRUD; round-trip export/import test.

**M2 — Math editor & rendering**
- `MathField`, `RichField`, KaTeX renderer, Science keyboard (incl. Accents tab), hat key, shortcuts, mobile keyboard/viewport handling.
- ✅ Playwright test: type `P`, tap Hat → `\hat{P}`; `/` → fraction; `^2`; `rho` → ρ. Manual APK check on emulator: keyboard never covers field.

**M3 — Checking engine**
- Preprocessor, tiers 1–4, text/numeric/list/cloze checkers, options schema, corpus + property tests, "via" reporting.
- ✅ Entire §6.5 corpus passes; property tests ≥99% reliable; deterministic with seed.

**M4 — Library & editing UI**
- Library, set view, create/edit set, fast card editor with alternates/hints/explanations, search, tags, folders, star, reorder, undo.
- ✅ E2E: create the "Ideal gas equation" card with answers `PV=nRT` and `P=\hat{\rho}RT` using only the math editor.

**M5 — Import/export wizard**
- Everything in §11 except Anki `.apkg`. Worker-based parsing, preview, mapping presets, dedupe, undo, share/open-with intents.
- ✅ Fuzzed CSV tests; round-trip tests; 10k-row import under budget.

**M6 — Flashcards mode + Learn engine (core)**
- Pure learn engine with state machine, rounds, distractor generation, seeded RNG; invariant property tests.
- ✅ Simulation test: a simulated student with p(correct)=0.7 completes sessions in bounded steps for sets of 1–500 cards.

**M7 — Learn UI + polish**
- Full Learn UX (§7.6), direction switching, retype-after-miss, override, I-don't-know, hints, round summaries, resume.
- ✅ E2E Learn session to completion on sample set, both directions, with a typed equation answer accepted via an equivalent form.

**M8 — More modes**
- Test mode (+ PDF), Match, Spaced review (FSRS) fed by Learn, Stats, notifications.
- ✅ Tests for scheduler integration; stats correctness from event log.

**M9 — Desktop shell**
- Tauri 2 packaging, native file dialogs/drag-drop, window state, keyboard shortcuts, command palette, two-pane layouts, release workflow for 3 OSes.
- ✅ Tagging `v0.1.0` produces installers for all three OSes plus signed Android APK/AAB (signing steps pending **[HUMAN]** secrets; unsigned fallback documented).

**M10 — Extensibility & hardening**
- `PLUGINS.md`, example plugins, plugin settings UI, accessibility pass, performance pass, localization scaffolding, docs, onboarding tour.
- ✅ A third-party-style plugin (e.g. chemistry) can be added without touching core code, demonstrated in a test.

**Stretch (after M10, pick by value):** see Section 15.

---

## 15. Extra features (ideas to make it awesome)

**Math/science-specific (highest value)**
1. **Formula Builder mode:** assemble the equation by dragging tiles (variables, operators, fractions) into place; partial credit by token.
2. **Variable glossary:** attach "P = pressure, V = volume, R = gas constant, ρ̂ = molar density…" to an equation card; auto-generate "what does R̂ stand for?" and "what are the units of V?" cards.
3. **Fill-the-blank equations (cloze in math):** hide one symbol/term of an equation; MC or typed.
4. **Rearrange-it drills:** "Solve for V" / "Solve for T": graded by the solution-set checker.
5. **Parameterized problem cards:** `n=\{1..5\} mol, T=\{273..400\} K` → numeric answer with units, new numbers each time; tolerance + sig-fig grading.
6. **Unit & dimensional-analysis checks:** flag dimensionally inconsistent answers and say *why* (very helpful feedback).
7. **Derivation step-ordering questions:** put the steps of a derivation in order.
8. **Constants & periodic-table packs:** built-in decks (Greek alphabet, SI units/prefixes, derivative/integral tables, physics/chem constants, trig identities).
9. **Handwriting/stylus input** (stretch): write the equation on screen → MathLive/recognition plugin; **camera import**: photograph a formula sheet → OCR to LaTeX (plugin; cloud/local model optional).
10. **Smart error feedback:** "Your answer matches the reference except `T` is missing" using AST diffs.

**General study features**
11. **Confidence rating** after each answer to refine scheduling.
12. **Leech detection:** cards failed repeatedly get flagged with suggestions (add hint/mnemonic, split card, show explanation first).
13. **Exam countdown planner:** set an exam date → the app picks Learn vs. spaced review automatically and shows a daily target.
14. **Image occlusion** cards (diagrams, circuit/graph labels) and **image/audio on any side**; TTS with per-set language.
15. **Reversible cards & multi-definition** cards (many terms ↔ many definitions) as first-class.
16. **Study widgets/shortcuts:** Android home-screen widget ("N cards due"), app shortcuts ("Quick Learn last set").
17. **Gamification (optional, off by default):** streaks, XP, daily goals, subtle confetti; no dark patterns.
18. **Collaboration/sharing without accounts:** share a set as a file, QR code, or a link to a static `.flashset` (decoded client-side).
19. **Deck "packs"/community registry** (static JSON index on GitHub) for downloading curated sets & plugins.
20. **AI assist (opt-in, bring-your-own-key, strictly off by default):** generate cards from notes/PDF, explain a wrong answer, suggest alternate accepted forms. Must be a plugin and never required for any core feature.
21. **Anki interop:** import `.apkg`, export to Anki.
22. **Per-card version history**, soft-delete trash with 30-day restore.
23. **Multiple profiles** on one device (siblings/classmates).

---

## 16. `AGENTS.md` (create this file at M0 and keep it current)

```md
# Agent rules for formulaflash
- Read PLAN.md. Work one milestone at a time. Don't skip tests.
- Layering: packages/core must stay pure TS (no DOM/React/Capacitor). CI enforces it.
- Everything pluggable goes through the registry. Don't hard-code card types/checkers/modes in UI code.
- Math correctness is the product: any change to checking/ must update/add corpus cases first (TDD).
- Randomness must be injectable + seedable. No Math.random() in core.
- Never commit secrets. Needed secrets/keystores are listed in docs/HUMAN_SETUP.md.
- Commit with Conventional Commits. Keep PRs small. Update docs and this file when conventions change.
- Pinned versions of mathlive / @cortex-js/compute-engine / katex: upgrade only with the full corpus + e2e passing.
- When unsure: choose the more configurable/extensible option, record a short ADR in docs/adr/.
- Commands: pnpm dev | test | test:e2e | lint | typecheck | android:apk | desktop:dev
```

---

## 17. Risks & mitigations

| Risk | Mitigation |
|---|---|
| MathLive accent/virtual-keyboard behavior differs inside Android WebView | Test on emulator in CI from M2; keep keyboard layout as data so fixes are small; Electron/Tauri webview fallbacks |
| Compute Engine canonicalization surprises (accents, subscripts, implicit mult) | Opaque-symbol preprocessing (§6.3); big corpus; pin versions; wrap CE behind our own `MathEngine` interface so it can be swapped |
| Numeric equivalence false positives/negatives | Multiple tiers; seeded multi-sample testing; variable-domain config; override + "save as alternate" escape hatches; show `via` so users understand decisions |
| Bundle size / startup time (CE + KaTeX + MathLive) | Lazy-load CE and the math editor; code-split study modes; measure in CI with a size budget |
| IndexedDB eviction / data loss on Android | Request persistent storage; auto-backups; export reminders; Repository interface permits a SQLite adapter |
| Tauri 2 webview differences (esp. Linux WebKitGTK) | Cross-browser Playwright (WebKit/Firefox) + Linux desktop build in CI; Electron fallback documented in an ADR |
| Scope creep | Milestones + acceptance criteria; stretch features only after M10 |
| Licensing | CI license check; `THIRD_PARTY_NOTICES.md` |

---

## 18. Definition of done (v1.0)

- Create a card "Ideal gas equation" whose accepted answers are `PV=nRT` and `P=\hat{\rho}RT`, entirely via the in-app math editor (hat above the letter, fractions, exponents, Greek letters), on Android and desktop.
- Typing `nRT=PV` or `P=nRT/V` is accepted (per default strictness) and `P=\rho RT` is rejected; every strictness option is configurable.
- Import a CSV/TSV/TXT with custom delimiters (including LaTeX in cells) via the wizard, with preview and undo; export back losslessly.
- Learn mode: staged questions (intro → MC → typed), rounds, mastery levels, direction switching (term/definition/both), retype-after-miss, "I don't know", "I was right" override, hints, resumable sessions, and a round summary.
- Also: Flashcards, Test, Match, and Spaced Review modes.
- Every push to `main` builds an APK and runs unit + e2e + Android smoke tests; tags publish signed Android artifacts and Windows/macOS/Linux installers.
- Plugin API documented with a working example; settings are schema-driven and searchable.
- Accessibility pass done; performance budgets met; docs complete.
