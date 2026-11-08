import type { CfdFlashcardItem } from './types.js';
import { CFD_FOUNDATIONS_CARDS } from './01-foundations.js';
import { CFD_GOVERNING_EQUATIONS_CARDS } from './02-governing-equations.js';
import { CFD_THERMODYNAMICS_TRANSPORT_CARDS } from './03-thermodynamics-transport.js';
import { CFD_DIMENSIONLESS_NUMBERS_CARDS } from './04-dimensionless-numbers.js';
import { CFD_ANALYTICAL_SOLUTIONS_CARDS } from './05-analytical-solutions.js';
import { CFD_TURBULENCE_CARDS } from './06-turbulence.js';
import { CFD_NUMERICAL_METHODS_CARDS } from './07-numerical-methods.js';
import { CFD_COMPRESSIBLE_HIGH_SPEED_CARDS } from './08-compressible-high-speed.js';
import { CFD_HEAT_TRANSFER_CARDS } from './09-heat-transfer.js';
import { CFD_MULTIPHASE_FLOW_CARDS } from './10-multiphase-flow.js';
import { CFD_COMBUSTION_CHEMISTRY_CARDS } from './11-combustion-chemistry.js';
import { CFD_AEROACOUSTICS_AERODYNAMICS_SPECIAL_CARDS } from './12-aeroacoustics-aerodynamics-special.js';

export * from './types.js';
export { CFD_FOUNDATIONS_CARDS } from './01-foundations.js';
export { CFD_GOVERNING_EQUATIONS_CARDS } from './02-governing-equations.js';
export { CFD_THERMODYNAMICS_TRANSPORT_CARDS } from './03-thermodynamics-transport.js';
export { CFD_DIMENSIONLESS_NUMBERS_CARDS } from './04-dimensionless-numbers.js';
export { CFD_ANALYTICAL_SOLUTIONS_CARDS } from './05-analytical-solutions.js';
export { CFD_TURBULENCE_CARDS } from './06-turbulence.js';
export { CFD_NUMERICAL_METHODS_CARDS } from './07-numerical-methods.js';
export { CFD_COMPRESSIBLE_HIGH_SPEED_CARDS } from './08-compressible-high-speed.js';
export { CFD_HEAT_TRANSFER_CARDS } from './09-heat-transfer.js';
export { CFD_MULTIPHASE_FLOW_CARDS } from './10-multiphase-flow.js';
export { CFD_COMBUSTION_CHEMISTRY_CARDS } from './11-combustion-chemistry.js';
export { CFD_AEROACOUSTICS_AERODYNAMICS_SPECIAL_CARDS } from './12-aeroacoustics-aerodynamics-special.js';

export interface CfdTopicCategory {
  id: string;
  name: string;
  cards: CfdFlashcardItem[];
}

export const CFD_TOPIC_CATEGORIES: CfdTopicCategory[] = [
  { id: 'foundations', name: 'Foundations', cards: CFD_FOUNDATIONS_CARDS },
  { id: 'governing-equations', name: 'Governing Equations', cards: CFD_GOVERNING_EQUATIONS_CARDS },
  { id: 'thermodynamics-transport', name: 'Thermodynamics & Transport', cards: CFD_THERMODYNAMICS_TRANSPORT_CARDS },
  { id: 'dimensionless-numbers', name: 'Dimensionless Numbers', cards: CFD_DIMENSIONLESS_NUMBERS_CARDS },
  { id: 'analytical-solutions', name: 'Analytical Solutions', cards: CFD_ANALYTICAL_SOLUTIONS_CARDS },
  { id: 'turbulence', name: 'Turbulence', cards: CFD_TURBULENCE_CARDS },
  { id: 'numerical-methods', name: 'Numerical Methods', cards: CFD_NUMERICAL_METHODS_CARDS },
  { id: 'compressible-high-speed', name: 'Compressible & High Speed Flow', cards: CFD_COMPRESSIBLE_HIGH_SPEED_CARDS },
  { id: 'heat-transfer', name: 'Heat Transfer', cards: CFD_HEAT_TRANSFER_CARDS },
  { id: 'multiphase-flow', name: 'Multiphase Flow', cards: CFD_MULTIPHASE_FLOW_CARDS },
  { id: 'combustion-chemistry', name: 'Combustion & Chemistry', cards: CFD_COMBUSTION_CHEMISTRY_CARDS },
  { id: 'aeroacoustics-aerodynamics-special', name: 'Aeroacoustics, Aerodynamics & Special Topics', cards: CFD_AEROACOUSTICS_AERODYNAMICS_SPECIAL_CARDS },
];

let cachedDeck: CfdFlashcardItem[] | null = null;

export function getCfdCompleteDeck(): CfdFlashcardItem[] {
  if (!cachedDeck) {
    cachedDeck = [
      ...CFD_FOUNDATIONS_CARDS,
      ...CFD_GOVERNING_EQUATIONS_CARDS,
      ...CFD_THERMODYNAMICS_TRANSPORT_CARDS,
      ...CFD_DIMENSIONLESS_NUMBERS_CARDS,
      ...CFD_ANALYTICAL_SOLUTIONS_CARDS,
      ...CFD_TURBULENCE_CARDS,
      ...CFD_NUMERICAL_METHODS_CARDS,
      ...CFD_COMPRESSIBLE_HIGH_SPEED_CARDS,
      ...CFD_HEAT_TRANSFER_CARDS,
      ...CFD_MULTIPHASE_FLOW_CARDS,
      ...CFD_COMBUSTION_CHEMISTRY_CARDS,
      ...CFD_AEROACOUSTICS_AERODYNAMICS_SPECIAL_CARDS,
    ];
  }
  return cachedDeck;
}

export const CFD_COMPLETE_DECK = getCfdCompleteDeck();
