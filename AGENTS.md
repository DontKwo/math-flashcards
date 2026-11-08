# Agent Rules & Operational Reference for Formula Flash

## Core Directives
- **Read PLAN.md.** Work one milestone at a time. Don't skip tests.
- **Layering Constraint:** `packages/core` must stay pure TS (no DOM/React/Capacitor). CI enforces this via dependency-cruiser.
- **Pluggability:** Everything pluggable goes through the registry. Don't hard-code card types/checkers/modes in UI code.
- **TDD for Math:** Math correctness is the product: any change to `checking/` must update/add corpus cases first.
- **Randomness:** Randomness must be injectable + seedable (e.g. `SeededRng`). No `Math.random()` in core.
- **Secrets:** Never commit secrets. Needed secrets/keystores are listed in `docs/HUMAN_SETUP.md`.
- **Commits:** Commit with Conventional Commits. Keep PRs small. Update docs and this file when conventions change.
- **Dependencies:** Pinned versions of `mathlive` / `@cortex-js/compute-engine` / `katex`: upgrade only with the full corpus + e2e passing.
- **Design Decisions:** When unsure: choose the more configurable/extensible option, record a short ADR in `docs/adr/`.

## Monorepo Architecture
Formula Flash is a dual-tier monorepo:
1. **`packages/core`**: The pure TypeScript domain model.
   - Contains all business logic: AST evaluation, checking, algorithms, schema validation (Zod).
   - Zero UI dependencies. Does not know about React, the browser DOM, or Capacitor.
   - Centralized registry for extensible entities: modes, checkers, etc.
   - *Data Contracts:* Strictly typed Zod schemas ensure relational integrity (e.g., standard `.flashset` bundles).
2. **`apps/app`**: The frontend implementation.
   - Uses React 19, Tailwind CSS, Zustand, MathLive, and KaTeX.
   - Adheres to design tokens (no inline raw px/hex values).
   - *Storage Adapters:* Interfaces with IndexedDB via Dexie for persistence.
   - Provides web, Android (Capacitor), and desktop builds.

## Developer Commands

Run these commands from the monorepo root:

- `pnpm install` — Install all workspace dependencies.
- `pnpm dev` — Start the local development server for the web app.
- `pnpm test` — Run all unit and integration tests (Vitest).
- `pnpm test:e2e` — Run Playwright end-to-end UI tests.
- `pnpm lint` — Run ESLint and Prettier checks across the monorepo.
- `pnpm typecheck` — Run TypeScript compiler in check-only mode across all packages.
- `pnpm exec depcruise packages apps` — Run dependency-cruiser to enforce architecture bounds.
- `pnpm --filter app run build` — Build the frontend web application artifacts.
- `pnpm android:apk` — Build the Android APK using Capacitor and Gradle.
- `pnpm desktop:dev` — Start the desktop wrapper application for local development.

### Required Gate Command
Before completing changes, you must run the following sequence to ensure green CI:
```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm exec depcruise packages apps && pnpm test && pnpm --filter app run build
```
