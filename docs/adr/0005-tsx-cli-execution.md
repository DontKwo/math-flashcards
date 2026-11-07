# ADR 0005: Add tsx for Running TypeScript Matrix CLI Scripts

## Status
Accepted

## Context
Running the end-to-end matrix suite CLI directly from node requires fast, modern TypeScript ESM execution with zero configuration.

## Decision
Add `tsx` as a root developer dependency (`devDependencies`) to execute `tests/matrix/runner.ts` seamlessly without pre-compiling.

## Consequences
- Fast runtime execution of TypeScript scripts without transpilation step.
- Size: ~3 packages added in devDependencies.
- License: MIT.
