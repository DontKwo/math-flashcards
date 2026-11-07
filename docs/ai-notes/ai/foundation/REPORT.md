# Foundation Architecture & UI System Report

Branch: `ai/foundation`
Author: Jules (Foundations Team)

---

## 1. What Was Found (Baseline Analysis)

1. **Header & Navigation Breakdown**:
   - Header action buttons used `.header-btn` and `.header-actions` classes that did not exist in CSS, rendering as cramped browser-default buttons without proper touch targets.
   - The app had no router and no home page; it booted directly into one hardcoded deck's Learn mode without deep links, history support, or an overview.
2. **Data Layer Fragmentation**:
   - Two disjoint data models existed: the frontend app used `FlashcardItem` / `FlashcardSet` stored in synchronous `localStorage` (`formulaflash_sets`), completely bypassing `packages/core`'s pure TypeScript models (`CardSet`, `Card`, `CardProgress`, `Repository`).
   - The sample deck was forcefully re-injected on every page load and could not be permanently edited or deleted.
   - Deletion lacked safety and recovery.
3. **Design System & Styling**:
   - Pervasive inline styles (`style={{ ... }}`) throughout UI components.
   - Raw hex color codes scattered across screens instead of centralized design tokens.
   - Missing states: empty state, loading skeleton, and error banners were absent.
   - Template leftovers and unused assets (`App.css`, `react.svg`, `hero.png`, `vite.svg`).
4. **Testing Infrastructure**:
   - `apps/app` had no unit or component test runner configured.
   - Missing `pnpm test:e2e` script referenced in `AGENTS.md` and CI lacked automated Playwright e2e validation.
   - No architectural guard tests to prevent regression of styling token rules or `data-testid` conventions.

---

## 2. What Was Fixed

### Step A: Contracts & Architecture ADRs
- Created `docs/ui-contract.md` defining:
  - Zero-dependency Hash Router: `#/` (Home), `#/set/:id` (Set details), `#/set/:id/edit` & `#/create` (Editor), `#/study/:id/learn` & `#/study/:id/cards` (Study), `#/stats` (Analytics), `#/settings` (Preferences).
  - Store API: `useLibrary` with asynchronous set/card CRUD, derived mastery stats, and timed soft-delete undo toast mechanism.
  - Strict testid naming rule: `data-testid="<screen>-<element>"`.
  - UI kit component specifications.
- Recorded Architecture Decision Records in `docs/adr/`:
  - `0001-hash-routing.md`: Lightweight client-side hash router with parameter matching.
  - `0002-data-layer-indexeddb.md`: Native IndexedDB adapter implementing core `Repository` interface with lossless legacy migration.
  - `0003-styling-tokens-tailwind.md`: Dark slate + indigo design tokens in CSS custom properties.
  - `0004-test-infrastructure.md`: Vitest jsdom, Testing Library, and Playwright multi-viewport suite.

### Step B: Single Data Layer & Lossless Migration
- Implemented `IndexedDBRepository` (`apps/app/src/data/idb-repository.ts`) implementing core's `Repository` interface.
- Implemented `migrateLegacyData` (`apps/app/src/data/migration.ts`):
  - Losslessly converts legacy `formulaflash_sets` and `formulaflash_settings` into core `CardSet` and `Card` models.
  - Preserves IDs and handles corrupted JSON, unicode, and large inputs gracefully.
  - Seeds the sample deck once on initial launch; users can freely edit or delete it.
- Implemented Zustand store `useLibrary` (`apps/app/src/data/useLibrary.ts`) providing reactive state, derived mastery stats, and a 6-second soft-delete undo toast mechanism.
- Created unit tests in `apps/app/src/data/migration.test.ts` and `apps/app/src/data/useLibrary.test.ts`.

### Step C & D: Design System & Responsive Shell
- Created `apps/app/src/ui/tokens.css` with dark slate + indigo identity:
  - Surfaces, text hierarchy, indigo accent, status emerald/rose, 4px-based rem spacing scale, border radii, elevations, and motion reduction.
  - Enforced minimum 44px touch targets.
- Created accessible, reusable UI kit in `apps/app/src/ui/`: `Button`, `IconButton` (requires `aria-label`), `Input`, `Textarea`, `Field`, `Chip`, `Surface`/`Card`, `Modal`, `BottomSheet`, `ConfirmDialog`, `Menu`, `Toast`, `EmptyState`, `Skeleton`, `ProgressBar`, `MasteryRing`, `SegmentedControl`, `Tabs`, `Icon`.
- Built zero-dependency Hash Router (`apps/app/src/router/index.ts`).
- Built responsive App Shell (`apps/app/src/shell/AppShell.tsx`):
  - Desktop (>= 768px): collapsible sidebar with brand and navigation, slim top bar with search and create button.
  - Mobile (< 768px): bottom navigation tab bar honoring safe-area insets, slim top bar.
  - Study Layout: focused full-screen view (no top/bottom nav bars, prominent Exit button).
- Implemented screens:
  - `HomeScreen`: Search, set grid, mastery ring badges, create button, empty state.
  - `SetScreen`: Set header, tags, study mode selector (Learn vs. Cards), card rows with KaTeX rendering, set menu (duplicate, delete confirmation).
  - `EditorScreen`: Set title/tags editor, card creator with `<MathLiveField>` equation editor and hint, existing card management.
  - `StatsScreen`: Overall mastery breakdown, retention stats, progress bar.
  - `SettingsScreen`: Strictness controls (accents matter, Greek variants equal, side swap).
  - `StudyScreen`: Preserved study behavior inside full-screen layout.
- Cleaned up confirmed dead files (`App.css`, `react.svg`, `hero.png`, `vite.svg`) and updated `index.html` with `viewport-fit=cover`, title "Formula Flash", and theme color.

### Step E: Test Infrastructure & Static Guards
- Added `@playwright/test`, `@testing-library/react`, `@testing-library/jest-dom`, and `fake-indexeddb`.
- Created static guard tests in `apps/app/src/testing/static-guards.test.ts`:
  - Enforces ZERO raw `style={{` inline styles in `apps/app/src`.
  - Enforces ZERO raw hex color literals outside `tokens.css`.
  - Enforces `data-testid` adhering strictly to `<screen>-<element>`.
- Added `pnpm test:e2e` in `package.json` with multi-device Playwright config (`playwright.config.ts`).
- Updated CI workflow (`.github/workflows/ci.yml`) to run Playwright e2e on Chromium in CI.

### Step F: Code-Splitting & Visual Verification
- Verified code-splitting: `HomeScreen`, `SetScreen`, `EditorScreen`, `StatsScreen`, `SettingsScreen`, and `StudyScreen` are dynamically imported with `React.lazy`.
- Heavy math libraries (`MathLive`, `@cortex-js/compute-engine`, `KaTeX`) are isolated to equation editor and study screens, reducing initial bundle weight.
- Captured screenshots at 360x740, 390x844, 768x1024, 1280x800, and 1920x1080 in `docs/ai-notes/ai/foundation/screenshots/`.
- Inspected screenshots visually via media inspection tools.

---

## 3. How to Run & Verify

```bash
# 1. Monorepo linting
pnpm run lint

# 2. Typechecking
pnpm run typecheck

# 3. Layering & dependency validation
pnpm exec depcruise packages apps

# 4. Unit & store test suite (13 suites, 136 tests)
pnpm test

# 5. Multi-viewport end-to-end tests (45 tests across 5 viewports)
pnpm run test:e2e

# 6. Production build
pnpm --filter app run build
```

---

## 4. What Was Not Fixed and Logged for Downstream Teams

- **Learn Mode Staged Question Generator (ai/study lane)**: The study screen currently supports interactive math checking and flip cards using the existing logic adapter. Implementing the complete 4-tier mastery queue with distractors belongs to `ai/study`.
- **Anki / CSV Import Wizard (ai/import lane)**: `EditorScreen` supports manual set and card creation and bulk addition; the full CSV/Anki import wizard with worker parsing belongs to `ai/import`.
- **Android APK On-Device Native Testing**: Playwright verified webviews at mobile resolutions (360px to 390px with mobile emulation); on-device testing requires physical Android devices or local Android Studio emulator.
