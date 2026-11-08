# Formula Flash

**Math and science flashcard app with intelligent formula checking and adaptive Learn mode.**

![Formula Flash](https://via.placeholder.com/1200x600?text=Formula+Flash+Screenshots)

Formula Flash is a powerful flashcard application designed specifically for STEM students. By utilizing an embedded math computer algebra system, it evaluates mathematical answers for true algebraic equivalence, rather than simple string matching.

## Features Overview

- **Intelligent Formula Checking:** Validates your math input against the expected answer algebraically. E.g., `x + y` is correctly evaluated as equal to `y + x` or `(2x + 2y) / 2`.
- **Advanced LaTeX Input:** Input math effortlessly using a virtual math keyboard or direct LaTeX commands.
- **Adaptive Learn Mode:** A spaced-repetition study mode that tracks your progress and targets your weaknesses.
- **Export & Import:** Easily share your flashcard sets using the portable `.flashset` bundle format.
- **Offline First:** Fully functional without an internet connection. Your data stays on your device.

## Quick Start (Development)

To get started with local development:

```bash
# Clone the repository
git clone https://github.com/DontKwo/math-flashcards.git
cd math-flashcards

# Install dependencies
pnpm install

# Start the local development server
pnpm dev
```
For comprehensive documentation on testing and building, please see `AGENTS.md`.

## Download for Android

Download the latest Android APK directly on your phone:

[![Download Android APK](https://img.shields.io/badge/Download-Android_APK-success?logo=android&logoColor=white)](https://github.com/DontKwo/math-flashcards/releases/download/latest/formulaflash-debug.apk)

- **Direct APK Download**: [formulaflash-debug.apk](https://github.com/DontKwo/math-flashcards/releases/download/latest/formulaflash-debug.apk)
- **All Releases**: [GitHub Releases](https://github.com/DontKwo/math-flashcards/releases)

On Android, tap the link above to download and install. If prompted, enable "Install unknown apps" in system settings.

## Documentation

- [User Guide](docs/USER_GUIDE.md): Complete guide to creating sets and studying.
- [FAQ](docs/FAQ.md): Frequently asked questions.
- [Developer Guide](AGENTS.md): Architecture and commands.

---

EDUCATIONAL DISCLAIMER: Formula Flash / math-flashcards is an interactive mathematics study framework. Provided AS IS without warranty of any kind.
