# ADR 0004: Comprehensive Test Infrastructure (Vitest, Testing Library, Playwright)

## Status
Accepted

## Context
`PLAN.md` and `AGENTS.md` mandate high code quality with multi-level testing:
- Logic & store unit tests (Vitest).
- Component & screen rendering tests (Testing Library + jsdom).
- Static guard tests preventing regression of design token usage and testid naming rules.
- Multi-viewport end-to-end tests (Playwright) running in CI.

## Decision
1. Add `@testing-library/react`, `@testing-library/jest-dom`, and `fake-indexeddb` as development dependencies in `apps/app`.
2. Configure Vitest for `apps/app` to run alongside core tests.
3. Add `@playwright/test` to root devDependencies and create `playwright.config.ts` running tests across responsive viewports:
   - Mobile: 360x740, 390x844
   - Tablet: 768x1024
   - Desktop: 1280x800, 1920x1080
4. Add `pnpm test:e2e` to `package.json` and integrate with `.github/workflows/ci.yml`.

## Consequences
- Guarantees zero regressions in data migration, navigation, component accessibility, and visual layouts.
- Verifies responsive design and user workflows across all supported screen sizes.
