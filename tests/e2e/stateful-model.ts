import { SeededPRNG } from '../fixtures/corpus/corpus-generator.js';

export interface AppModel {
  mode: 'learn' | 'study' | 'analytics';
  deckCount: number;
  currentCardIndex: number;
  isFlipped: boolean;
  score: { correct: number; total: number };
  modalOpen: 'none' | 'settings' | 'decks' | 'creator';
  theme: 'dark' | 'light' | 'system';
}

export type ActionName =
  | 'SWITCH_MODE_LEARN'
  | 'SWITCH_MODE_STUDY'
  | 'SWITCH_MODE_ANALYTICS'
  | 'STUDY_FLIP'
  | 'STUDY_NEXT'
  | 'STUDY_PREV'
  | 'OPEN_SETTINGS'
  | 'CLOSE_SETTINGS'
  | 'OPEN_DECKS'
  | 'CLOSE_DECKS'
  | 'OPEN_CREATOR'
  | 'CLOSE_CREATOR'
  | 'SUBMIT_LEARN_ANSWER';

export function createInitialModel(deckSize = 5): AppModel {
  return {
    mode: 'learn',
    deckCount: deckSize,
    currentCardIndex: 0,
    isFlipped: false,
    score: { correct: 0, total: 0 },
    modalOpen: 'none',
    theme: 'dark',
  };
}

export function transitionModel(model: AppModel, action: ActionName): AppModel {
  const next = { ...model, score: { ...model.score } };

  switch (action) {
    case 'SWITCH_MODE_LEARN':
      next.mode = 'learn';
      next.isFlipped = false;
      break;
    case 'SWITCH_MODE_STUDY':
      next.mode = 'study';
      next.isFlipped = false;
      break;
    case 'SWITCH_MODE_ANALYTICS':
      next.mode = 'analytics';
      next.isFlipped = false;
      break;
    case 'STUDY_FLIP':
      if (next.mode === 'study') {
        next.isFlipped = !next.isFlipped;
      }
      break;
    case 'STUDY_NEXT':
      if (next.deckCount > 0) {
        next.currentCardIndex = (next.currentCardIndex + 1) % next.deckCount;
        next.isFlipped = false;
      }
      break;
    case 'STUDY_PREV':
      if (next.deckCount > 0) {
        next.currentCardIndex = (next.currentCardIndex - 1 + next.deckCount) % next.deckCount;
        next.isFlipped = false;
      }
      break;
    case 'OPEN_SETTINGS':
      next.modalOpen = 'settings';
      break;
    case 'CLOSE_SETTINGS':
      if (next.modalOpen === 'settings') next.modalOpen = 'none';
      break;
    case 'OPEN_DECKS':
      next.modalOpen = 'decks';
      break;
    case 'CLOSE_DECKS':
      if (next.modalOpen === 'decks') next.modalOpen = 'none';
      break;
    case 'OPEN_CREATOR':
      next.modalOpen = 'creator';
      break;
    case 'CLOSE_CREATOR':
      if (next.modalOpen === 'creator') next.modalOpen = 'none';
      break;
    case 'SUBMIT_LEARN_ANSWER':
      if (next.mode === 'learn') {
        next.score.total += 1;
      }
      break;
  }

  return next;
}

export function generateRandomSequence(length: number, prng: SeededPRNG): ActionName[] {
  const allActions: ActionName[] = [
    'SWITCH_MODE_LEARN',
    'SWITCH_MODE_STUDY',
    'SWITCH_MODE_ANALYTICS',
    'STUDY_FLIP',
    'STUDY_NEXT',
    'STUDY_PREV',
    'OPEN_SETTINGS',
    'CLOSE_SETTINGS',
    'OPEN_DECKS',
    'CLOSE_DECKS',
    'OPEN_CREATOR',
    'CLOSE_CREATOR',
  ];

  const seq: ActionName[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(prng.pick(allActions));
  }
  return seq;
}
