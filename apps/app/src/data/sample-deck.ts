import type { TermDefinition } from '@formulaflash/core';

export interface FlashcardItem {
  id: string;
  category: string;
  title: string;
  prompt: string;
  latexAnswer: string;
  hint: string;
  explanation: string;
  terms?: TermDefinition[];
}

import { CFD_GLOSSARY as CORE_CFD_GLOSSARY } from '@formulaflash/core';

export const CFD_GLOSSARY: Record<string, TermDefinition> = CORE_CFD_GLOSSARY;

export const SAMPLE_DECK: FlashcardItem[] = [
  // 1. Incompressible Navier-Stokes Momentum Equation
  {
    id: 'cfd-incompressible-momentum',
    category: 'Fluid Dynamics',
    title: 'Incompressible Momentum (Navier-Stokes)',
    prompt: 'State the incompressible Navier-Stokes momentum equation with velocity vector (\\mathbf{u}), pressure (p), density (\\rho), kinematic viscosity (\\nu), and time (t):',
    latexAnswer: '\\frac{\\partial \\mathbf{u}}{\\partial t} + (\\mathbf{u} \\cdot \\nabla)\\mathbf{u} = -\\frac{1}{\\rho}\\nabla p + \\nu \\nabla^2 \\mathbf{u}',
    hint: 'Material derivative of velocity equals pressure gradient force plus viscous diffusion.',
    explanation: 'Fundamental momentum balance for constant-density, constant-viscosity Newtonian fluid flows.',
    terms: [
      { symbol: '\\mathbf{u}', name: 'Fluid velocity vector', definition: 'Continuum vector velocity field.', units: 'm/s' },
      { symbol: 't', name: 'Time coordinate', definition: 'Temporal dimension.', units: 's' },
      { symbol: '\\rho', name: 'Fluid density', definition: 'Mass per unit volume.', units: 'kg/m^3' },
      { symbol: 'p', name: 'Static pressure', definition: 'Isotropic compressive stress field.', units: 'Pa' },
      { symbol: '\\nu', name: 'Kinematic viscosity', definition: 'Ratio of dynamic viscosity to fluid density.', units: 'm^2/s' },
    ],
  },

  // 2. Incompressible Continuity Equation
  {
    id: 'cfd-continuity',
    category: 'Fluid Dynamics',
    title: 'Incompressible Continuity Equation',
    prompt: 'State the mass continuity equation for an incompressible fluid with velocity (\\mathbf{u}):',
    latexAnswer: '\\nabla \\cdot \\mathbf{u} = 0',
    hint: 'Divergence of the velocity vector is zero.',
    explanation: 'Reflects volume conservation and constant density along fluid trajectories.',
    terms: [
      { symbol: '\\mathbf{u}', name: 'Velocity field', definition: 'Solenoidal velocity vector field.', units: 'm/s' },
    ],
  },

  // 3. Reynolds Number
  {
    id: 'cfd-reynolds-number',
    category: 'Fluid Dynamics',
    title: 'Reynolds Number Definition',
    prompt: 'State the definition of the Reynolds number (Re) in terms of density (\\rho), velocity (u), length (L), and dynamic viscosity (\\mu):',
    latexAnswer: 'Re = \\frac{\\rho u L}{\\mu}',
    hint: 'Inertial scaling divided by dynamic viscosity.',
    explanation: 'Governs laminar versus turbulent flow transitions and dynamic similitude.',
    terms: [
      { symbol: 'Re', name: 'Reynolds number', definition: 'Dimensionless ratio of inertial to viscous forces.', units: 'dimensionless' },
      { symbol: '\\rho', name: 'Fluid density', definition: 'Mass per unit volume.', units: 'kg/m^3' },
      { symbol: 'u', name: 'Characteristic velocity', definition: 'Characteristic speed of the flow.', units: 'm/s' },
      { symbol: 'L', name: 'Characteristic length', definition: 'Macroscopic geometric length scale.', units: 'm' },
      { symbol: '\\mu', name: 'Dynamic viscosity', definition: 'Dynamic shear viscosity.', units: 'Pa*s' },
    ],
  },

  // 4. Mach Number
  {
    id: 'cfd-mach-number',
    category: 'Fluid Dynamics',
    title: 'Mach Number Definition',
    prompt: 'State the definition of Mach number (Ma) using flow velocity (u) and local speed of sound (a):',
    latexAnswer: 'Ma = \\frac{u}{a}',
    hint: 'Ratio of fluid speed to acoustic wave speed.',
    explanation: 'Dimensionless metric characterizing compressibility effects.',
    terms: [
      { symbol: 'Ma', name: 'Mach number', definition: 'Compressibility metric.', units: 'dimensionless' },
      { symbol: 'u', name: 'Flow speed', definition: 'Magnitude of velocity relative to boundary.', units: 'm/s' },
      { symbol: 'a', name: 'Speed of sound', definition: 'Speed of acoustic pressure waves in the fluid.', units: 'm/s' },
    ],
  },

  // 5. Incompressible Thermal Energy Equation
  {
    id: 'cfd-thermal-energy',
    category: 'Fluid Dynamics',
    title: 'Thermal Energy Transport',
    prompt: 'State the incompressible temperature transport equation with velocity (\\mathbf{u}), temperature (T), thermal diffusivity (\\alpha), and time (t):',
    latexAnswer: '\\frac{\\partial T}{\\partial t} + \\mathbf{u} \\cdot \\nabla T = \\alpha \\nabla^2 T',
    hint: 'Advection-diffusion equation for scalar temperature.',
    explanation: 'Energy balance describing heat advection and Fourier conduction in a constant-property fluid.',
    terms: [
      { symbol: 'T', name: 'Temperature', definition: 'Thermodynamic scalar temperature field.', units: 'K' },
      { symbol: 't', name: 'Time', definition: 'Time coordinate.', units: 's' },
      { symbol: '\\mathbf{u}', name: 'Velocity vector', definition: 'Advecting velocity vector field.', units: 'm/s' },
      { symbol: '\\alpha', name: 'Thermal diffusivity', definition: 'Ratio of thermal conductivity to volumetric heat capacity (k / (rho * cp)).', units: 'm^2/s' },
    ],
  },

  // 6. Ideal Gas Law (Thermodynamics)
  {
    id: 'ideal-gas',
    category: 'Thermodynamics',
    title: 'Ideal Gas Law',
    prompt: 'State the Ideal Gas equation relating pressure (P), volume (V), amount (n), gas constant (R), and temperature (T):',
    latexAnswer: 'PV = nRT',
    hint: 'Pressure times volume equals moles times constant times temperature.',
    explanation: 'Fundamental equation of state for a hypothetical ideal gas.',
    terms: [
      { symbol: 'P', name: 'Absolute pressure', definition: 'Force per unit area exerted by gas molecules.', units: 'Pa' },
      { symbol: 'V', name: 'Volume', definition: 'Three-dimensional geometric space bounded by the gas.', units: 'm^3' },
      { symbol: 'n', name: 'Amount of substance', definition: 'Number of moles of gas particles.', units: 'mol' },
      { symbol: 'R', name: 'Universal gas constant', definition: 'Proportionality constant relating energy and temperature scales.', units: 'J/(mol*K)' },
      { symbol: 'T', name: 'Absolute temperature', definition: 'Thermodynamic temperature scale measured from absolute zero.', units: 'K' },
    ],
  },

  // 7. Kinetic Energy (Classical Mechanics)
  {
    id: 'kinetic-energy',
    category: 'Classical Mechanics',
    title: 'Kinetic Energy',
    prompt: 'What is the classical formula for kinetic energy (E) of an object with mass (m) and velocity (v)?',
    latexAnswer: 'E = \\frac{1}{2}mv^{2}',
    hint: 'One half mass times velocity squared.',
    explanation: 'Kinetic energy is the work needed to accelerate a body of given mass from rest to stated velocity.',
    terms: [
      { symbol: 'E', name: 'Kinetic energy', definition: 'Energy possessed by an object due to its motion.', units: 'J' },
      { symbol: 'm', name: 'Mass', definition: 'Quantitative measure of inertia resistance to acceleration.', units: 'kg' },
      { symbol: 'v', name: 'Velocity', definition: 'Speed of motion along the trajectory.', units: 'm/s' },
    ],
  },

  // 8. Gibbs Free Energy (Physical Chemistry)
  {
    id: 'gibbs-free-energy',
    category: 'Physical Chemistry',
    title: 'Gibbs Free Energy',
    prompt: 'Express the change in Gibbs Free Energy (\\Delta G) using enthalpy (\\Delta H), temperature (T), and entropy (\\Delta S):',
    latexAnswer: '\\Delta G = \\Delta H - T\\Delta S',
    hint: 'Change in enthalpy minus temperature times change in entropy.',
    explanation: 'Thermodynamic potential used to calculate maximum reversible work at constant temperature and pressure.',
    terms: [
      { symbol: '\\Delta G', name: 'Gibbs free energy change', definition: 'Thermodynamic potential change determining process spontaneity at constant temperature and pressure.', units: 'J' },
      { symbol: '\\Delta H', name: 'Enthalpy change', definition: 'Total heat absorbed or released under constant pressure.', units: 'J' },
      { symbol: 'T', name: 'Absolute temperature', definition: 'Thermodynamic temperature in kelvin.', units: 'K' },
      { symbol: '\\Delta S', name: 'Entropy change', definition: 'Change in microscopic thermal disorder or state multiplicity.', units: 'J/K' },
    ],
  },

  // 9. Ideal Gas with Molar Density
  {
    id: 'molar-density',
    category: 'Thermodynamics',
    title: 'Ideal Gas with Molar Density',
    prompt: 'State the Ideal Gas law formulated with molar density (\\hat{\\rho}), constant (R), and temperature (T):',
    latexAnswer: 'P = \\hat{\\rho} R T',
    hint: 'Pressure equals rho-hat times R times T.',
    explanation: 'Demonstrates decorator awareness: the hat accent on rho (\\hat{\\rho}) distinguishes molar density from mass density.',
    terms: [
      { symbol: 'P', name: 'Static pressure', definition: 'Absolute thermodynamic pressure.', units: 'Pa' },
      { symbol: '\\hat{\\rho}', name: 'Molar density', definition: 'Amount of substance per unit volume (n / V). Distinguished by hat decorator.', units: 'mol/m^3' },
      { symbol: 'R', name: 'Universal gas constant', definition: 'Molar gas constant.', units: 'J/(mol*K)' },
      { symbol: 'T', name: 'Absolute temperature', definition: 'Thermodynamic temperature.', units: 'K' },
    ],
  },

  // 10. Quadratic Formula (Algebra)
  {
    id: 'quadratic-formula',
    category: 'Algebra',
    title: 'Quadratic Formula',
    prompt: 'What is the formula for the roots of ax^{2} + bx + c = 0?',
    latexAnswer: 'x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}',
    hint: 'Negative b plus or minus square root of b squared minus 4ac, all over 2a.',
    explanation: 'Closed-form solution for the roots of any single-variable second-degree polynomial.',
    terms: [
      { symbol: 'x', name: 'Unknown variable', definition: 'Roots that satisfy the quadratic polynomial equation.' },
      { symbol: 'a', name: 'Quadratic coefficient', definition: 'Coefficient multiplying second-order term.' },
      { symbol: 'b', name: 'Linear coefficient', definition: 'Coefficient multiplying first-order term.' },
      { symbol: 'c', name: 'Constant term', definition: 'Constant zero-order term.' },
    ],
  },

  // 11. Ohm's Law (Electromagnetism)
  {
    id: 'ohms-law',
    category: 'Electromagnetism',
    title: "Ohm's Law",
    prompt: 'State Ohm\'s Law relating voltage (V), current (I), and resistance (R):',
    latexAnswer: 'V = IR',
    hint: 'Voltage equals current times resistance.',
    explanation: 'Relationship stating current through a conductor between two points is directly proportional to voltage across the points.',
    terms: [
      { symbol: 'V', name: 'Electric potential difference', definition: 'Voltage between two distinct terminals.', units: 'V' },
      { symbol: 'I', name: 'Electric current', definition: 'Net rate of electric charge flow through a cross section.', units: 'A' },
      { symbol: 'R', name: 'Electrical resistance', definition: 'Measure of opposition to electric charge flow.', units: '\\Omega' },
    ],
  },
];
