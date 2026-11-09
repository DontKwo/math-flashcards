# ADR 0002: PDF Cheat Sheet Generation via jsPDF and Pure Layout Engine

## Context
STEM students frequently require printable reference formula sheets and cheat sheets for exams and study sessions. To satisfy this requirement, Formula Flash provides an export studio capable of turning flashcard decks into print-quality, customizable PDF documents. Key requirements include:
- Fast live preview in the UI matching final PDF output.
- Non-blocking PDF generation capable of handling 2,000+ cards.
- Support for web browsers and Android Capacitor APK.
- Strict startup performance budgets (zero startup bundle bloat).

## Decision
1. **Separation of Layout and Output (Pure TS Layout Engine)**:
   - Built a pure TypeScript layout engine in `packages/core/export` with zero DOM and zero UI dependencies.
   - Both the React-based live preview and the PDF writer consume the identical `DocumentModel` and `PageModel`, guaranteeing pixel-accurate correspondence between preview and printed PDF.
2. **Approved Dependency - jsPDF**:
   - Selected `jspdf` (~131 kB gzipped) as the single runtime dependency for client-side PDF document serialization.
   - Code-split and lazy-loaded dynamically (`import('./pdf-writer.ts')` inside a dedicated Web Worker `pdf-worker.ts`), so the core application bundle and cold startup times are completely unaffected.
3. **Formula Rendering**:
   - Rendered using KaTeX with high-DPI rasterization and caching by `(latex, fontSize, color)`.
   - Plain text fallback on render errors ensures exports never crash.
4. **Platform File Integration**:
   - Web: Blob Object URL download with formatted filenames.
   - Android: Capacitor native share sheet with fallback to browser data downloads.

## Consequences
- Clean separation of concerns with full testability via fast-check property testing and golden PDF validation.
- Minimal bundle impact due to dynamic module imports and worker isolation.
