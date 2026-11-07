# Shared Requests from `ai/home-library`

This document tracks UI or data layer additions requested or introduced during work on the Home and Set library screens.

1. **Hidden File Input**: Added `.home-hidden-file-input { display: none; }` to `screens.css` to allow accessible file input triggering via UI buttons without violating the inline style architectural guard.
2. **Flashset Utils**: Added `apps/app/src/screens/flashset-utils.ts` and `apps/app/src/screens/search-utils.ts` cleanly isolated under `apps/app/src/screens/`. No existing exports in `packages/core` or `apps/app/src/ui` were renamed or modified.
