# Delivery Report: `ai/study` Branch

## 1. Summary of Deliverables & Enhancements

On branch `ai/study`, we made studying in Formula Flash real, responsive, and persistent:

1. **`packages/core/learn` (`LearnEngine` & `types.ts`)**:
   - Upgraded `LearnEngine` to support configurable study directions:
     - `front->back` (Term → Definition)
     - `back->front` (Definition → Term)
     - `both` (Mixed / random per-card direction using seeded PRNG)
   - Built content-aware Multiple-Choice distractor generation: pulls actual formulas/texts from other cards in the deck, with deterministic fallbacks when deck size is small (< 4 cards).
   - Added round state tracking and metrics via `RoundSummary` (`totalAnswered`, `correctCount`, `missedCount`, `promotedCount`).
   - Implemented `overrideCorrect(cardId)` escape hatch to treat mistaken answer checkers as correct, advancing level and streak.
   - Added retype-after-miss gating to require correct answer reproduction on missed typed questions.
   - Comprehensive unit tests covering 0-card sets, 1-card sets, pre-mastered sets, PRNG determinism, and override handling.

2. **Learn Mode (`apps/app/src/screens/StudyScreen.tsx` - `#/study/:id/learn`)**:
   - Integrated with `IndexedDBRepository` for real persistence: every submitted answer immediately persists `CardProgress` and logs a `StudyEvent` into an active `StudySession`.
   - Adaptive staged questions: Level 0 cards introduce recognition via Multiple Choice; Level 1+ cards test active written recall with MathLive.
   - Answer input improvements: changed label to "Your answer", Enter checks / Enter again continues, mobile-friendly virtual math toolbar.
   - Escape hatches:
     - "I don't know" button: immediately reveals correct formula and re-queues.
     - "Mark my answer correct" override button: corrects false-negative verdicts and updates stats.
     - Retype-after-miss gate: user must retype the correct formula into the field before continuing.
   - Direction switcher: quick toggles for Term → Def and Def → Term.
   - Round summary screen: displays breakdown of correct, missed/retested, and promoted cards with "Continue Next Round" or "Finish Session".

3. **Flashcards Mode (`apps/app/src/screens/StudyScreen.tsx` - `#/study/:id/cards`)**:
   - Smooth 3D flip card animation respecting `prefers-reduced-motion`.
   - Keyboard navigation: Space key flips the card, Left/Right arrow keys navigate.
   - Mobile touch swipe support: left/right gestures for card switching.
   - "Still learning" / "Know it" ratings that feed real `CardProgress` in IndexedDB.
   - Study options: Shuffle deck (seeded), Starred only filter, and Swap Sides (front/back).
   - Zero-safe progress bar preventing `NaN` or `1/0` display.

4. **Settings Page (`apps/app/src/screens/SettingsScreen.tsx` - `#/settings`)**:
   - Replaced modal with full settings page.
   - Plain-language explanations with live KaTeX interactive examples for answer checking options:
     - Accents Matter (`P = \hat{\rho}RT` vs `P = \rho RT`)
     - Greek Variants Equal (`\epsilon_0` vs `\varepsilon_0`)
     - Allow Side-Swap (`nRT = PV` vs `PV = nRT`)
   - Theme switcher (Dark Slate, Light, OLED Black) and font/math sizing.
   - Whole-library backup & restore:
     - "Export Backup (.json)" dumps all sets, cards, progress, and sessions.
     - "Restore Backup" validates and imports JSON bundle into IndexedDB.
   - Reset library with explicit confirmation dialog.

5. **Stats Page (`apps/app/src/screens/StatsScreen.tsx` - `#/stats`)**:
   - Removed all hard-coded values; displays real numbers from `IndexedDBRepository`:
     - Mastery breakdown: Mastered (L3), Proficient (L2), Familiar (L1), and Unseen (L0).
     - Midnight-crossing calendar streak calculation based on real study session timestamps.
     - Overall accuracy calculated across all session `StudyEvent` records.
     - Challenging cards leaderboard sorted by miss rate and attempt counts.
     - Honest empty state when no cards exist.

---

## 2. Verification & Test Execution

All quality gates and test suites pass cleanly:

```bash
pnpm lint && pnpm typecheck && pnpm exec depcruise packages apps && pnpm test && pnpm --filter app run build
```

- **Unit tests**: 13 test suites, 141 tests passing (0 failures, 0 skipped).
- **Static Guards**: 0 raw inline styles, 0 raw hex colors outside `tokens.css`, strict `data-testid` format (`<screen>-<element>`).
- **E2E Playwright tests**: 30 passing across all 5 responsive viewports (`360x740`, `390x844`, `768x1024`, `1280x800`, `1920x1080`).
- **Responsive screenshots captured**:
  - `home-{viewport}.png`
  - `set-{viewport}.png`
  - `cards-{viewport}.png`
  - `learn-{viewport}.png`
  - `stats-{viewport}.png`
  - `settings-{viewport}.png`

---

## 3. What Was Not Fixed / Future Opportunities

- **FSRS Long-Term Spaced Repetition**: While `StudyEvent` and `CardProgress` are fully logged and available for scheduling, full FSRS algorithm integration is slated for the Spaced Review milestone.
- **Android APK Execution in Sandbox**: Android emulator / APK execution requires physical device or KVM emulator acceleration which is unavailable in the containerized sandbox environment; web and responsive mobile viewports were verified using Chromium Playwright.
