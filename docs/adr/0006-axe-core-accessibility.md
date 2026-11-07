# ADR 0006: Add @axe-core/playwright for Automated Accessibility Audit

## Status
Accepted

## Context
Automated accessibility validation across all views and interactive controls is required by the quality oracles.

## Decision
Install `@axe-core/playwright` as developer dependency in devDependencies to run automated WCAG AA and axe rule evaluation during inventory and crawl runs.

## Consequences
- Enables automated reporting of critical/serious a11y issues.
- License: MPL-2.0.
- Dev dependency only.
