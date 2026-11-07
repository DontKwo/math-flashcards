# Formula Flash

Math and science flashcard app with formula checking and Learn mode.

## Download for Android

Download the latest Android APK directly on your phone:

[![Download Android APK](https://img.shields.io/badge/Download-Android_APK-success?logo=android&logoColor=white)](https://github.com/DontKwo/math-flashcards/releases/download/latest/formulaflash-debug.apk)

- **Direct APK Download**: [formulaflash-debug.apk](https://github.com/DontKwo/math-flashcards/releases/download/latest/formulaflash-debug.apk)
- **All Releases**: [GitHub Releases](https://github.com/DontKwo/math-flashcards/releases)

On Android, tap the link above to download and install. If prompted, enable "Install unknown apps" in system settings.

## Development & Verification Commands

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run unit and store test suites (Vitest)
pnpm test

# Run multi-viewport end-to-end tests (Playwright)
pnpm test:e2e

# Run linter and typecheck
pnpm lint
pnpm typecheck

# Enforce architecture and layering constraints
pnpm exec depcruise packages apps

# Build web application
pnpm --filter app run build
```
