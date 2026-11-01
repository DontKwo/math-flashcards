export interface FlashcardItem {
  id: string;
  category: string;
  title: string;
  prompt: string;
  latexAnswer: string;
  hint: string;
  explanation: string;
}

export const SAMPLE_DECK: FlashcardItem[] = [
  {
    id: 'ideal-gas',
    category: 'Thermodynamics',
    title: 'Ideal Gas Law',
    prompt: 'State the Ideal Gas equation relating pressure (P), volume (V), amount (n), gas constant (R), and temperature (T):',
    latexAnswer: 'PV = nRT',
    hint: 'Pressure times volume equals moles times constant times temperature.',
    explanation: 'Fundamental equation of state for a hypothetical ideal gas. Equivalent algebraic forms such as P = \\frac{nRT}{V} or nRT = PV are recognized automatically.',
  },
  {
    id: 'kinetic-energy',
    category: 'Classical Mechanics',
    title: 'Kinetic Energy',
    prompt: 'What is the classical formula for kinetic energy (E) of an object with mass (m) and velocity (v)?',
    latexAnswer: 'E = \\frac{1}{2}mv^{2}',
    hint: 'One half mass times velocity squared.',
    explanation: 'Kinetic energy is the work needed to accelerate a body of given mass from rest to stated velocity.',
  },
  {
    id: 'gibbs-free-energy',
    category: 'Physical Chemistry',
    title: 'Gibbs Free Energy',
    prompt: 'Express the change in Gibbs Free Energy (\\Delta G) using enthalpy (\\Delta H), temperature (T), and entropy (\\Delta S):',
    latexAnswer: '\\Delta G = \\Delta H - T\\Delta S',
    hint: 'Change in enthalpy minus temperature times change in entropy.',
    explanation: 'Thermodynamic potential used to calculate maximum reversible work at constant temperature and pressure.',
  },
  {
    id: 'molar-density',
    category: 'Thermodynamics',
    title: 'Ideal Gas with Molar Density',
    prompt: 'State the Ideal Gas law formulated with molar density (\\hat{\\rho}), constant (R), and temperature (T):',
    latexAnswer: 'P = \\hat{\\rho} R T',
    hint: 'Pressure equals rho-hat times R times T.',
    explanation: 'Demonstrates decorator awareness: the hat accent on rho (\\hat{\\rho}) distinguishes molar density from mass density.',
  },
  {
    id: 'quadratic-formula',
    category: 'Algebra',
    title: 'Quadratic Formula',
    prompt: 'What is the formula for the roots of ax^{2} + bx + c = 0?',
    latexAnswer: 'x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}',
    hint: 'Negative b plus or minus square root of b squared minus 4ac, all over 2a.',
    explanation: 'Closed-form solution for the roots of any single-variable second-degree polynomial.',
  },
  {
    id: 'ohms-law',
    category: 'Electromagnetism',
    title: "Ohm's Law",
    prompt: 'State Ohm\'s Law relating voltage (V), current (I), and resistance (R):',
    latexAnswer: 'V = IR',
    hint: 'Voltage equals current times resistance.',
    explanation: 'Relationship stating current through a conductor between two points is directly proportional to voltage across the points.',
  },
];

