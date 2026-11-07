# ADR 0002: IndexedDB Storage Adapter for Core Repository

## Status
Accepted

## Context
Formula Flash previously stored cards and sets in `localStorage` under `formulaflash_sets`.
`localStorage` has severe limitations:
1. Hard storage quota of ~5 MB across browsers/webviews, inadequate for sets with hundreds of cards, LaTeX, and future media/audio.
2. Synchronous I/O blocks the UI thread during serialization and parsing.
3. Lack of atomic transactions and indexed querying.

Core defines a pure asynchronous `Repository` interface (`packages/core/storage/types.ts`) with methods for sets, cards, progress, and study sessions.

## Decision
Implement `IndexedDBRepository` (`apps/app/src/data/idb-repository.ts`) in the app layer implementing core's `Repository` interface using the browser's native IndexedDB API (zero new runtime dependencies).
- Stores: `sets`, `cards` (indexed by `setId`), `progress` (indexed by `cardId` and `direction`), and `sessions` (indexed by `setId`).
- Provides automated migration (`apps/app/src/data/migration.ts`) from legacy `formulaflash_sets` and `formulaflash_settings` to core models on first initialization, retaining the original keys as backups.
- Automatically seeds the sample deck on first run, allowing full editing and deletion.

## Consequences
- No external runtime dependencies added (keeping bundle lightweight).
- High capacity storage (hundreds of MBs) and non-blocking asynchronous operations.
- Pure separation of concerns: `packages/core` stays pure TS; platform storage lives in `apps/app`.
