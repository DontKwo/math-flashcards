# ADR 0001: Zero-Dependency Hash Routing

## Status
Accepted

## Context
Formula Flash needs multi-screen navigation supporting Home (`#/`), Set details (`#/set/:id`), Set/Card Editor (`#/set/:id/edit`, `#/create`), Study (`#/study/:id/learn`, `#/study/:id/cards`), Analytics (`#/stats`), and Settings (`#/settings`).
The app must work seamlessly across web, Capacitor Android (which loads files from `https://localhost` or `file://`), and desktop. Browser back/forward navigation and deep links must be supported. External routing libraries add bundle weight and often require browser History API rewrites incompatible with Capacitor webviews.

## Decision
Implement a custom, zero-dependency hash router (`apps/app/src/router/`).
- Listens to `hashchange` events and `popstate`.
- Parses URL hash paths with parameter extraction (e.g. `#/set/:id`).
- Provides a clean React Hook `useRoute()` returning current route, params, and navigate function.
- Enables route-level code splitting via `React.lazy` and `React.Suspense`.

## Consequences
- No external routing dependency needed.
- Seamless execution in Capacitor Android and static hosting without server rewrite rules.
- Fully predictable back/forward history navigation.
