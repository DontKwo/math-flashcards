import type { VirtualKeyboardLayout } from 'mathlive';

/**
 * Calculus keyboard layout for limits, derivatives, and integrals.
 */
export const calculusKeyboard: VirtualKeyboardLayout = {
  label: 'Calculus',
  tooltip: 'Calculus Keyboard',
  rows: [
    [
      { latex: '\\lim_{x\\to\\infty}', label: 'lim' },
      { latex: '\\frac{d}{dx}', label: 'd/dx' },
      { latex: '\\int', label: '∫' },
      { latex: '\\int_{a}^{b}', label: 'def ∫' },
      { latex: '\\infty', label: '∞' },
    ],
    [
      { latex: '\\sum', label: '∑' },
      { latex: '\\prod', label: '∏' },
      { latex: '\\partial', label: '∂' },
      { latex: '\\nabla', label: '∇' },
      '[backspace]',
    ],
  ],
};

/**
 * Greek letters keyboard layout.
 */
export const greekKeyboard: VirtualKeyboardLayout = {
  label: 'Greek',
  tooltip: 'Greek Keyboard',
  rows: [
    [
      { latex: '\\alpha', label: 'α' },
      { latex: '\\beta', label: 'β' },
      { latex: '\\gamma', label: 'γ' },
      { latex: '\\delta', label: 'δ' },
      { latex: '\\epsilon', label: 'ε' },
      { latex: '\\zeta', label: 'ζ' },
      { latex: '\\eta', label: 'η' },
      { latex: '\\theta', label: 'θ' },
      { latex: '\\iota', label: 'ι' },
      { latex: '\\kappa', label: 'κ' },
    ],
    [
      { latex: '\\lambda', label: 'λ' },
      { latex: '\\mu', label: 'μ' },
      { latex: '\\nu', label: 'ν' },
      { latex: '\\xi', label: 'ξ' },
      { latex: '\\pi', label: 'π' },
      { latex: '\\rho', label: 'ρ' },
      { latex: '\\sigma', label: 'σ' },
      { latex: '\\tau', label: 'τ' },
      { latex: '\\upsilon', label: 'υ' },
      '[backspace]',
    ],
    [
      { latex: '\\phi', label: 'φ' },
      { latex: '\\chi', label: 'χ' },
      { latex: '\\psi', label: 'ψ' },
      { latex: '\\omega', label: 'ω' },
      '[left]',
      '[right]',
      '[up]',
      '[down]',
      '[return]',
    ],
  ],
};

/**
 * Algebra keyboard layout for powers, roots, and fractions.
 */
export const algebraKeyboard: VirtualKeyboardLayout = {
  label: 'Algebra',
  tooltip: 'Algebra Keyboard',
  rows: [
    [
      { latex: 'x', label: 'x' },
      { latex: 'y', label: 'y' },
      { latex: 'z', label: 'z' },
      { latex: 'a', label: 'a' },
      { latex: 'b', label: 'b' },
      { latex: 'c', label: 'c' },
    ],
    [
      { latex: '\\frac{#@}{#?}', label: 'frac' },
      { latex: '#@^{#?}', label: 'x^y' },
      { latex: '#@_{#?}', label: 'x_y' },
      { latex: '\\sqrt{#@}', label: '√' },
      { latex: '\\sqrt[#?]{#@}', label: 'n√' },
      '[backspace]',
    ],
    [
      { latex: '\\approx', label: '≈' },
      { latex: '\\neq', label: '≠' },
      { latex: '\\le', label: '≤' },
      { latex: '\\ge', label: '≥' },
      { latex: '\\pm', label: '±' },
      '[return]',
    ],
  ],
};

/**
 * Combined preset layouts for MathLive virtual keyboard.
 */
export const customKeyboardLayouts: VirtualKeyboardLayout[] = [
  calculusKeyboard,
  greekKeyboard,
  algebraKeyboard,
];
