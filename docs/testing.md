# Testing Guide & Generator-Driven Harness

This document describes Formula Flash's test layers, test execution scripts, and how to replay failed regression seeds.

## Test Tiers

1. **Core Property & Invariant Layer (`packages/core/testing`)**:
   - In-process Vitest tests running property-based tests via `fast-check`.
   - Tests tens of thousands of math equivalence variants, parse/serialization round-trips, and Learn state machine invariants.
   - Run command: `pnpm test`

2. **UI Smoke Layer (`@smoke`)**:
   - Fast Playwright test suite covering core user journeys and invariant assertions.
   - Run command: `pnpm test:smoke`

3. **UI Matrix Layer (`@matrix`)**:
   - Combinatorial execution crossing the 138 registered actions from `actions.generated.json` with all classes in `tests/fixtures/corpus/corpus-generator.ts`.
   - Run command: `pnpm test:matrix`

4. **Stateful Sequence Layer & Soak Layer (`@soak`)**:
   - Model-based random testing generating action sequences (5 to 200 steps) comparing real app state against an abstract model.
   - Run command: `pnpm test:soak`

## Running Tests Locally

```bash
# Run unit & property tests
pnpm test

# Run smoke tests (Chromium)
pnpm test:smoke

# Run matrix tests
pnpm test:matrix

# Run stateful model soak sequences
pnpm test:soak

# Generate matrix report
pnpm run report:matrix
```

## Replaying a Regression Seed

When a model-based sequence finds a failure, it records the minimal reproduction seed in `tests/regressions/seeds.json`.
To replay all saved seeds:

```bash
pnpm exec playwright test tests/e2e/stateful-runner.spec.ts --project=desktop-chrome
```
Every seed in `tests/regressions/seeds.json` is replayed on every test run.
