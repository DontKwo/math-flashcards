# Formula Flash User Guide

Welcome to the Formula Flash user guide! This document will walk you through how to create flashcard sets, use the math input features, study effectively, and manage your data.

## 1. Creating and Managing Sets

### Creating a New Set
1. On the home screen, click the **Plus (+)** button.
2. Give your set a descriptive title (e.g., "Calculus 101" or "Physics Kinematics").
3. You will be taken to the set editor where you can begin adding cards.

### Adding Cards
1. Inside the set editor, click **Add Card**.
2. **Front:** Type the question or prompt. You can insert inline math by wrapping it in standard LaTeX delimiters or by focusing a math field.
3. **Back (Answer):** Enter the expected answer. For math formulas, use the dedicated math field.
4. **Card Types:** You can select different card types (e.g., Text, Math, Cloze) from the card settings if needed.

## 2. Using LaTeX Math

Formula Flash has deep integration with MathLive and KaTeX to render and input mathematical formulas.

### The Virtual Math Keyboard
When you focus on a math field (indicated by the math styling), a virtual math keyboard will appear on touch devices. It provides easy access to:
- Fractions, roots, and exponents.
- Greek letters (e.g., $\alpha, \beta, \gamma$).
- Trigonometric functions and common symbols.

### Direct LaTeX Input
If you are comfortable with LaTeX, you can type it directly into a math field. For example:
- Type `\sqrt` and hit space to create a square root.
- Type `\frac` to create a fraction.
- Use `^` for superscripts (exponents) and `_` for subscripts.

The app's algebraic engine will evaluate the math you enter. This means that if the answer is $x + y$, the engine will correctly mark $y + x$ as correct!

## 3. Study Modes

Formula Flash offers multiple ways to review your cards.

### Flashcards (Standard Mode)
A traditional review mode.
- You are shown the front of the card.
- Think of the answer, then click or tap the card to flip it and reveal the back.
- Self-assess how well you knew the answer.

### Learn Mode (Spaced Repetition)
The adaptive learn mode tracks your progress and tests you interactively.
- You must actively type in the answer.
- For math answers, use the math keyboard or LaTeX.
- The computer algebra system checks your answer for true mathematical equivalence.
- Cards you get wrong will be shown more frequently until you master them.

## 4. Export & Import

You can easily share your sets with friends or backup your data.

### Exporting a Set
1. Go to the set view (click on a set from the home screen).
2. Click the **Export** button (usually in the menu or action bar).
3. The set will be downloaded as a `.flashset` file. This is a portable bundle containing your cards and metadata.

### Importing a Set
1. On the home screen, find the **Import** option.
2. Select a `.flashset` file from your device.
3. The set will be instantly imported into your library and ready to study.
