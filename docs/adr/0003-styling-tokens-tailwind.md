# ADR 0003: CSS Design Tokens with Tailwind CSS v4

## Status
Accepted

## Context
The legacy application suffered from inconsistent inline styles, cramped controls lacking 44px touch targets, and poor visual contrast. Tailwind CSS v4 is already installed in `apps/app`, but design tokens must be centralized, predictable, and strictly enforced.

## Decision
Create `apps/app/src/ui/tokens.css` exposing standard CSS custom properties for:
- Colors (slate surface hierarchy, indigo primary accent, emerald success, rose danger).
- Spacing scale in rem (multiples of 4px).
- Border radii, elevations (shadows), and typography scale.
- Safe-area insets for mobile and motion reduction media query overrides.

Pair tokens with Tailwind CSS v4 utilities and reusable component primitives in `apps/app/src/ui/`.
Strict rule: zero `style={{` inline styles allowed in `apps/app/src`, and zero raw hex colors outside `tokens.css`.

## Consequences
- Single source of truth for all styling tokens.
- Complete themeability and consistent mobile-first UX.
- Guarded by automated static tests in CI.
