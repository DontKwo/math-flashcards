import type { CardSet, Card, CardProgress } from '@formulaflash/core';

// Deterministic PRNG (Mulberry32) for reproducible data generation
export class Mulberry32PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

export type ContentProfile =
  | 'plain-text'
  | 'math-only'
  | 'mixed'
  | 'multi-answer'
  | 'with-hints-explanations'
  | 'huge-latex'
  | 'invalid-latex'
  | 'emoji-rtl'
  | 'xss-html'
  | 'duplicate-names'
  | 'empty-whitespace';

export type ProgressProfile = 'none' | 'partial' | 'all-mastered' | 'corrupted';

export interface GenerateLibraryOptions {
  seed?: number;
  setCount?: number;
  cardsPerSet?: number;
  contentProfile?: ContentProfile;
  progressProfile?: ProgressProfile;
}

export interface GeneratedLibrary {
  sets: CardSet[];
  cards: Card[];
  progress: CardProgress[];
}

// Generate deterministic library given constraints
export function generateLibrary(options: GenerateLibraryOptions = {}): GeneratedLibrary {
  const seed = options.seed ?? 12345;
  const _rng = new Mulberry32PRNG(seed);
  void _rng;
  const setCount = options.setCount ?? 5;
  const cardsPerSet = options.cardsPerSet ?? 5;
  const contentProfile = options.contentProfile ?? 'mixed';
  const progressProfile = options.progressProfile ?? 'partial';

  const sets: CardSet[] = [];
  const cards: Card[] = [];
  const progress: CardProgress[] = [];

  const now = 1700000000000;

  for (let s = 0; s < setCount; s++) {
    const setId = `set-${seed}-${s}`;
    let title = `Test Set #${s + 1} (${contentProfile})`;
    let tags = ['math', 'science', `batch-${s % 3}`];

    if (contentProfile === 'emoji-rtl') {
      title = `🧮 תרגיל ریاضی 🚀 #${s + 1}`;
      tags = ['עברית', 'رياضيات', '🌟'];
    } else if (contentProfile === 'xss-html') {
      title = `<script>alert("xss-${s}")</script><b>Bold Title</b> #${s}`;
      tags = ['<img src=x onerror=alert(1)>', 'normal'];
    } else if (contentProfile === 'duplicate-names') {
      title = 'Duplicate Common Deck';
      tags = ['dup'];
    } else if (contentProfile === 'empty-whitespace') {
      title = s === 0 ? '   ' : `Whitespace Deck ${s}`;
      tags = ['   ', ''];
    }

    const set: CardSet = {
      id: setId,
      title,
      description: `Generated deck with profile ${contentProfile}`,
      tags: tags.filter(Boolean),
      createdAt: now + s * 1000,
      updatedAt: now + s * 1000,
      cardCount: cardsPerSet,
    };
    sets.push(set);

    for (let c = 0; c < cardsPerSet; c++) {
      const cardId = `card-${seed}-${s}-${c}`;
      let frontText = `Question #${c + 1} for set ${s + 1}`;
      let backLatex = 'E = mc^2';
      let hints: string[] = [];
      let explanation = 'Basic energy-mass equivalence.';

      switch (contentProfile) {
        case 'plain-text':
          frontText = `Define momentum component ${c + 1}:`;
          backLatex = `p = m v`;
          break;
        case 'math-only':
          frontText = `\\int_{0}^{${c + 1}} x^2 dx`;
          backLatex = `\\frac{${c + 1}^3}{3}`;
          break;
        case 'huge-latex':
          frontText = `Solve large expression #${c + 1}:`;
          backLatex = '\\sum_{i=1}^{1000} ' + '\\frac{x_i^2 + \\alpha_i}{\\beta_i + \\gamma_i}'.repeat(100);
          break;
        case 'invalid-latex':
          frontText = `Invalid formula prompt #${c + 1}`;
          backLatex = '\\frac{incomplete{unclosed';
          break;
        case 'emoji-rtl':
          frontText = `ما هي معادلة أينشتاين؟ 🧠 #${c + 1}`;
          backLatex = 'E = m c^2';
          break;
        case 'xss-html':
          frontText = `<svg onload=alert(${c})>Prompt ${c}`;
          backLatex = '\\frac{<script>alert(1)</script>}{2}';
          break;
        case 'multi-answer':
          frontText = `Ideal gas law or permutations #${c + 1}:`;
          backLatex = 'PV = nRT';
          break;
        case 'with-hints-explanations':
          frontText = `Kinetic energy formula #${c + 1}:`;
          backLatex = 'E_k = \\frac{1}{2} m v^2';
          hints = ['Think about mass and velocity squared', 'Half of m v^2'];
          explanation = 'Kinetic energy is directly proportional to mass and square of speed.';
          break;
        default:
          frontText = `Prompt ${c + 1}: What is formula ${c + 1}?`;
          backLatex = c % 2 === 0 ? 'F = ma' : 'a^2 + b^2 = c^2';
          break;
      }

      const card: Card = {
        id: cardId,
        setId,
        order: c,
        type: 'equation',
        front: [{ t: 'text', v: frontText }],
        back: [{ t: 'math', latex: backLatex, display: true }],
        answer: {
          checker: 'math',
          accepted: [{ content: [{ t: 'math', latex: backLatex, display: true }] }],
          options: {},
        },
        hints: hints.map((h) => [{ t: 'text', v: h }]),
        explanation: [{ t: 'text', v: explanation }],
        tags: [`card-tag-${c}`],
        starred: c % 3 === 0,
        media: [],
        extra: {},
        createdAt: now + s * 1000 + c * 10,
        updatedAt: now + s * 1000 + c * 10,
      };
      cards.push(card);

      if (progressProfile !== 'none') {
        let state: CardProgress['state'] = 'unseen';
        if (progressProfile === 'all-mastered') {
          state = 'mastered';
        } else if (progressProfile === 'partial') {
          const states: CardProgress['state'][] = ['unseen', 'learning', 'reviewing', 'mastered'];
          state = states[c % states.length];
        }

        const prog: CardProgress = {
          cardId,
          direction: 'front->back',
          state: progressProfile === 'corrupted' ? ('invalid-state' as unknown as CardProgress['state']) : state,
          difficulty: 0.3,
          stability: 2.5,
          due: now + 86400000,
          lastReviewed: now,
          reps: state === 'mastered' ? 5 : 1,
          lapses: 0,
          history: [],
        };
        progress.push(prog);
      }
    }
  }

  return { sets, cards, progress };
}

// Generate legacy data shapes
export function generateLegacyStorage(scenario: 'valid' | 'corrupted' | 'wrong-types' | 'huge'): Record<string, string> {
  if (scenario === 'corrupted') {
    return {
      formulaflash_sets: '{"corrupted json: true,',
      formulaflash_settings: '{not valid json',
    };
  }

  if (scenario === 'wrong-types') {
    return {
      formulaflash_sets: JSON.stringify([{ id: 12345, title: null, cards: 'not-an-array' }]),
      formulaflash_settings: JSON.stringify('settings-as-string'),
    };
  }

  if (scenario === 'huge') {
    const hugeCards = Array.from({ length: 1000 }).map((_, i) => ({
      id: `legacy-${i}`,
      front: `Huge card #${i}`,
      back: `x_{${i}} = \\sum_{j=1}^{10} j^2`,
    }));
    return {
      formulaflash_sets: JSON.stringify([{ id: 'huge-set', title: 'Huge Legacy Deck', cards: hugeCards }]),
      formulaflash_settings: JSON.stringify({ accentsMatter: true, allowSideSwap: true }),
    };
  }

  // valid
  return {
    formulaflash_sets: JSON.stringify([
      {
        id: 'legacy-ideal-gas',
        title: 'Legacy Thermodynamics',
        cards: [
          { id: 'c1', front: 'Ideal Gas Law', back: 'PV = nRT', hint: 'State equation' },
          { id: 'c2', front: 'First Law of Thermodynamics', back: '\\Delta U = Q - W' },
        ],
      },
    ]),
    formulaflash_settings: JSON.stringify({
      accentsMatter: false,
      greekVariantsEqual: true,
      allowSideSwap: true,
    }),
  };
}

// Generate file contents for import testing
export function generateImportFile(type: 'valid' | 'wrong-schema' | 'corrupted-json' | 'empty' | 'pasted-text'): {
  filename: string;
  content: string;
} {
  switch (type) {
    case 'valid':
      return {
        filename: 'physics.flashset',
        content: JSON.stringify({
          version: 1,
          set: {
            id: 'imp-1',
            title: 'Imported Physics Set',
            description: 'Imported bundle description',
            tags: ['physics'],
            cardCount: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          cards: [
            {
              id: 'imp-c1',
              setId: 'imp-1',
              order: 0,
              type: 'equation',
              front: [{ t: 'text', v: 'Kinetic energy' }],
              back: [{ t: 'math', latex: 'E = \\frac{1}{2}mv^2', display: true }],
              answer: {
                checker: 'math',
                accepted: [{ content: [{ t: 'math', latex: 'E = \\frac{1}{2}mv^2', display: true }] }],
                options: {},
              },
              hints: [],
              tags: [],
              starred: false,
              media: [],
              extra: {},
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        }),
      };
    case 'wrong-schema':
      return {
        filename: 'invalid.flashset',
        content: JSON.stringify({ wrongKey: 'missing-set-and-cards' }),
      };
    case 'corrupted-json':
      return {
        filename: 'broken.flashset',
        content: '{ "incompleteJson": [',
      };
    case 'empty':
      return {
        filename: 'empty.flashset',
        content: '',
      };
    case 'pasted-text':
      return {
        filename: 'bulk.txt',
        content: 'Force\tF=ma\tNewton second law\nEnergy\tE=mc^2\tEinstein\nOhm\tV=IR\tElectricity',
      };
  }
}
