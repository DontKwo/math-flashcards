import type { TermDefinition } from './index.js';

export interface SymbolSuggestion {
  symbol: string;
  name: string;
  definition: string;
  units?: string;
  category: 'fluid-dynamics' | 'physics' | 'math' | 'thermodynamics';
}

export const COMMON_SYMBOL_SUGGESTIONS: SymbolSuggestion[] = [
  // Fluid dynamics & Transport
  {
    symbol: '\\rho',
    name: 'Fluid density',
    definition: 'Mass per unit volume of the fluid.',
    units: 'kg/m^3',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'p',
    name: 'Static pressure',
    definition: 'Normal compressive force per unit area exerted by fluid particles.',
    units: 'Pa',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\nu',
    name: 'Kinematic viscosity',
    definition: 'Ratio of dynamic viscosity to fluid density (momentum diffusivity).',
    units: 'm^2/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\nu_t',
    name: 'Turbulent eddy viscosity',
    definition: 'Apparent viscosity induced by turbulent eddy mixing.',
    units: 'm^2/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\mu',
    name: 'Dynamic viscosity',
    definition: 'Fluid resistance to gradual deformation by shear or tensile stress.',
    units: 'Pa*s',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\mathbf{u}',
    name: 'Velocity vector',
    definition: 'Vector field specifying velocity of fluid parcel at space-time point.',
    units: 'm/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'u',
    name: 'x-velocity component',
    definition: 'Component of velocity along the principal x-coordinate axis.',
    units: 'm/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'v',
    name: 'y-velocity component',
    definition: 'Component of velocity along the y-coordinate axis.',
    units: 'm/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'w',
    name: 'z-velocity component',
    definition: 'Component of velocity along the z-coordinate axis.',
    units: 'm/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'k',
    name: 'Turbulent kinetic energy',
    definition: 'Mean kinetic energy per unit mass associated with turbulent eddies.',
    units: 'm^2/s^2',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\epsilon',
    name: 'Turbulent dissipation rate',
    definition: 'Rate at which turbulent kinetic energy is converted into thermal internal energy.',
    units: 'm^2/s^3',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\omega',
    name: 'Specific dissipation rate',
    definition: 'Turbulence dissipation rate per unit turbulent kinetic energy.',
    units: '1/s',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'Re',
    name: 'Reynolds number',
    definition: 'Ratio of inertial forces to viscous forces within a fluid.',
    units: 'dimensionless',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'Pr',
    name: 'Prandtl number',
    definition: 'Ratio of momentum diffusivity to thermal diffusivity.',
    units: 'dimensionless',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'Ma',
    name: 'Mach number',
    definition: 'Ratio of flow velocity past a boundary to the local speed of sound.',
    units: 'dimensionless',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'Kn',
    name: 'Knudsen number',
    definition: 'Ratio of molecular mean free path to representative physical length scale.',
    units: 'dimensionless',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\tau',
    name: 'Shear stress',
    definition: 'Stress component coplanar with a material cross-section.',
    units: 'Pa',
    category: 'fluid-dynamics',
  },
  {
    symbol: '\\tau_{w}',
    name: 'Wall shear stress',
    definition: 'Shear stress exerted by fluid on adjacent solid boundary.',
    units: 'Pa',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'y^+',
    name: 'Non-dimensional wall distance',
    definition: 'Dimensionless distance from the wall characterizing boundary layer mesh resolution.',
    units: 'dimensionless',
    category: 'fluid-dynamics',
  },
  {
    symbol: 'u_\\tau',
    name: 'Friction velocity',
    definition: 'Characteristic velocity scale based on wall shear stress sqrt(tau_w / rho).',
    units: 'm/s',
    category: 'fluid-dynamics',
  },

  // Physics & Mechanics
  {
    symbol: 't',
    name: 'Time',
    definition: 'Continuous temporal coordinate.',
    units: 's',
    category: 'physics',
  },
  {
    symbol: 'm',
    name: 'Mass',
    definition: 'Quantitative measure of inertia and matter.',
    units: 'kg',
    category: 'physics',
  },
  {
    symbol: 'g',
    name: 'Gravitational acceleration',
    definition: 'Acceleration imparted to objects by gravitational attraction.',
    units: 'm/s^2',
    category: 'physics',
  },
  {
    symbol: 'F',
    name: 'Force',
    definition: 'Interaction that changes the motion of an object.',
    units: 'N',
    category: 'physics',
  },
  {
    symbol: 'E',
    name: 'Energy',
    definition: 'Quantitative property transferred to perform work or produce heat.',
    units: 'J',
    category: 'physics',
  },
  {
    symbol: '\\mathbf{g}',
    name: 'Gravitational acceleration vector',
    definition: 'Vector direction and magnitude of gravitational field.',
    units: 'm/s^2',
    category: 'physics',
  },

  // Thermodynamics
  {
    symbol: 'T',
    name: 'Absolute temperature',
    definition: 'Thermodynamic temperature measure of microscopic kinetic energy.',
    units: 'K',
    category: 'thermodynamics',
  },
  {
    symbol: 'V',
    name: 'Volume',
    definition: 'Three-dimensional space occupied by substance.',
    units: 'm^3',
    category: 'thermodynamics',
  },
  {
    symbol: 'n',
    name: 'Amount of substance',
    definition: 'Number of elementary entities (moles).',
    units: 'mol',
    category: 'thermodynamics',
  },
  {
    symbol: 'R',
    name: 'Universal gas constant',
    definition: 'Molar gas constant linking energy scale to temperature.',
    units: 'J/(mol*K)',
    category: 'thermodynamics',
  },
  {
    symbol: 'R_s',
    name: 'Specific gas constant',
    definition: 'Gas constant per unit mass for a specific gas R / M.',
    units: 'J/(kg*K)',
    category: 'thermodynamics',
  },
  {
    symbol: 'c_p',
    name: 'Specific heat at constant pressure',
    definition: 'Heat capacity of sample divided by mass at constant pressure.',
    units: 'J/(kg*K)',
    category: 'thermodynamics',
  },
  {
    symbol: 'c_v',
    name: 'Specific heat at constant volume',
    definition: 'Heat capacity of sample divided by mass at constant volume.',
    units: 'J/(kg*K)',
    category: 'thermodynamics',
  },
  {
    symbol: '\\gamma',
    name: 'Heat capacity ratio',
    definition: 'Ratio of specific heat at constant pressure to constant volume (cp / cv).',
    units: 'dimensionless',
    category: 'thermodynamics',
  },
  {
    symbol: 'h',
    name: 'Specific enthalpy',
    definition: 'Internal energy plus pressure-volume product per unit mass.',
    units: 'J/kg',
    category: 'thermodynamics',
  },
  {
    symbol: 's',
    name: 'Specific entropy',
    definition: 'Measure of thermal energy unavailable for mechanical work per unit mass.',
    units: 'J/(kg*K)',
    category: 'thermodynamics',
  },

  // Maths
  {
    symbol: '\\lambda',
    name: 'Thermal conductivity',
    definition: 'Property of a material to conduct heat.',
    units: 'W/(m*K)',
    category: 'thermodynamics',
  },
  {
    symbol: 'x',
    name: 'x coordinate',
    definition: 'First spatial coordinate.',
    units: 'm',
    category: 'math',
  },
  {
    symbol: 'y',
    name: 'y coordinate',
    definition: 'Second spatial coordinate.',
    units: 'm',
    category: 'math',
  },
  {
    symbol: 'z',
    name: 'z coordinate',
    definition: 'Third spatial coordinate.',
    units: 'm',
    category: 'math',
  },
];

/**
 * Finds candidate suggestions for a given symbol.
 */
export function getSuggestionsForSymbol(symbol: string): TermDefinition[] {
  const norm = symbol.trim();
  const matches = COMMON_SYMBOL_SUGGESTIONS.filter((s) => {
    return s.symbol === norm || s.symbol.replace(/[{}]/g, '') === norm.replace(/[{}]/g, '');
  });

  return matches.map((m) => ({
    symbol: m.symbol,
    name: m.name,
    definition: m.definition,
    units: m.units,
  }));
}
