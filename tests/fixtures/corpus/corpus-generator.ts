/**
 * Seeded Mulberry32 PRNG for deterministic fixture and corpus generation.
 */
export class SeededPRNG {
  private s: number;

  constructor(seed: number = 133742) {
    this.s = seed >>> 0;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    return items[this.nextInt(0, items.length - 1)];
  }
}

export interface CorpusData {
  textCorpus: string[];
  formulaCorpus: {
    trivial: string[];
    nestedFractions: string[];
    deepNesting: string[];
    powersAndIndices: string[];
    greekLetters: string[];
    calculus: string[];
    matrices: string[];
    syntaxEdgeCases: string[];
    equivalentRewrites: Array<{ reference: string; equivalents: string[]; distractors: string[] }>;
  };
  numbersCorpus: Array<number | string>;
  setsCorpus: Array<{ cardCount: number; name: string; category: string; description: string }>;
  filesCorpus: Array<{ format: string; name: string; content: string; valid: boolean }>;
  appStateCorpus: Array<{ name: string; storageData: Record<string, string> | null; corrupted?: boolean }>;
}

export function generateCorpus(seed: number = 42): CorpusData {
  const prng = new SeededPRNG(seed);

  // 1. TEXT CORPUS
  const textCorpus: string[] = [
    '', // empty
    'a', // one char
    '   ', // whitespace only
    '  leading and trailing  ',
    'Line 1\nLine 2\nLine 3\n\nDouble newline',
    'Hello 世界 🌍 🚀 ñ, é, ü, ç, Å', // unicode, accents, emoji
    'مرحبا بالعالم! שלום עליכם', // RTL
    'Zero\u200BWidth\u200CChars\uFEFFTest', // zero-width
    'Combining: e\u0301, a\u0300, n\u0303', // combining chars
    '<script>alert("XSS")</script>', // script tag
    '<img src="x" onerror="window.__xss=true">', // html injection
    '"><svg onload=alert(1)>',
    '# Markdown **bold** _italic_ `code` [link](https://example.com)',
    '\\ { } $ % ^ _ # & ~', // LaTeX special characters
    "' OR '1'='1' --", // SQL injection
    '{"key": "value", "arr": [1, 2, null, true]}', // JSON string
    'NaN',
    'undefined',
    'null',
    '[object Object]',
    'Infinity',
    '-Infinity',
    '0',
    '1e9',
    'A'.repeat(10005), // very long text (10k+)
  ];

  // 2. FORMULAS CORPUS
  const formulaCorpus = {
    trivial: ['x', 'y = mx + b', 'E = mc^2', 'F = ma', 'a^2 + b^2 = c^2'],
    nestedFractions: [
      '\\frac{1}{\\frac{2}{3}}',
      '\\frac{\\frac{a}{b}}{\\frac{c}{d}}',
      '1 + \\frac{1}{1 + \\frac{1}{1 + \\frac{1}{x}}}',
    ],
    deepNesting: [
      '\\sqrt{\\sqrt{\\sqrt{x + 1}}}',
      '((((a + b) \\cdot c) - d) / e)',
      'x^{y^{z^{w}}}',
    ],
    powersAndIndices: [
      'x_{1}^{2} + x_{2}^{2} = r^{2}',
      'T_{\\mu\\nu} g^{\\mu\\nu}',
      'R_{jkl}^{i}',
      '\\hat{\\rho}_{0}',
      '\\bar{x}_{\\mathrm{mean}}',
      '\\vec{v}_{\\mathrm{init}}',
      'x^{\\prime\\prime} + \\omega^2 x = 0',
    ],
    greekLetters: [
      '\\alpha + \\beta = \\gamma',
      '\\Delta G = \\Delta H - T\\Delta S',
      '\\theta + \\phi + \\psi + \\omega + \\lambda + \\sigma',
      '\\epsilon = \\varepsilon',
      '\\phi = \\varphi',
    ],
    calculus: [
      '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
      '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
      '\\prod_{k=1}^{n} (1 + x_k)',
      '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
      '\\frac{\\partial f}{\\partial x} + \\frac{\\partial f}{\\partial y} = 0',
      '\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}',
    ],
    matrices: [
      '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
      '\\det(A - \\lambda I) = 0',
    ],
    syntaxEdgeCases: [
      '(x + y', // unbalanced paren
      '\\frac{1}{', // incomplete fraction
      '\\sqrt', // missing arg
      'x^^2', // double caret
      '\\\\\\\\\\', // just slashes
      '\\invalidmacro{xyz}',
      '1234567890'.repeat(100), // huge formula
    ],
    equivalentRewrites: [
      {
        reference: 'PV = nRT',
        equivalents: ['nRT = PV', 'P V = n R T', 'n R T = P V'],
        distractors: ['P = nRT', 'PV = nR', 'PV = nRT^2', 'PV = nrT', 'P V = n R t'],
      },
      {
        reference: 'P = \\hat{\\rho} R T',
        equivalents: ['P = R T \\hat{\\rho}', '\\hat{\\rho} R T = P'],
        distractors: ['P = \\rho R T', 'P = \\bar{\\rho} R T', 'P = \\hat{\\rho} R'],
      },
      {
        reference: 'E = \\frac{1}{2} m v^{2}',
        equivalents: ['E = \\frac12 mv^2', 'E = \\frac{mv^2}{2}'],
        distractors: ['E = mv^2', 'E = \\frac12 m v', 'E = \\frac12 m^2 v'],
      },
      {
        reference: '\\Delta G = \\Delta H - T\\Delta S',
        equivalents: ['\\Delta G = \\Delta H - \\Delta S T', '\\Delta H - T\\Delta S = \\Delta G'],
        distractors: ['\\Delta G = \\Delta H + T\\Delta S', 'G = H - TS'],
      },
    ],
  };

  // 3. NUMBERS CORPUS
  const numbersCorpus: Array<number | string> = [
    0,
    -0,
    1,
    -1,
    0.0000001,
    -0.9999999,
    123456789012345,
    -987654321098765,
    1e-15,
    1e20,
    -1e20,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.EPSILON,
    Infinity,
    -Infinity,
    NaN,
    '1,5', // French/German decimal comma
    '1.500,25', // European thousand/decimal
    '000123', // leading zeros
    '3.141592653589793',
  ];

  // 4. SETS CORPUS
  const setCounts = [0, 1, 2, 10, 100, 1000, 10000];
  const setsCorpus = setCounts.map((count) => ({
    cardCount: count,
    name: `Deck with ${count} cards (${prng.nextInt(100, 999)})`,
    category: prng.pick(['Physics', 'Chemistry', 'Calculus', 'Biology', 'General']),
    description: `Deterministic dataset containing ${count} items.`,
  }));

  // Add duplicate name and invalid card cases
  setsCorpus.push(
    { cardCount: 5, name: 'Duplicate Name Deck', category: 'Physics', description: 'Instance 1' },
    { cardCount: 5, name: 'Duplicate Name Deck', category: 'General', description: 'Instance 2' },
  );

  // 5. FILES CORPUS
  const filesCorpus = [
    {
      format: 'csv',
      name: 'valid_simple.csv',
      content: 'Term,Definition,Hint,Explanation\nForce,F = ma,Newton\'s 2nd,Mass times acceleration\nWork,W = F d,Energy transfer,Force times distance\n',
      valid: true,
    },
    {
      format: 'tsv',
      name: 'quizlet_paste.tsv',
      content: 'Ideal Gas Law\tPV = nRT\tGas relation\nOhm\'s Law\tV = IR\tResistance relation\n',
      valid: true,
    },
    {
      format: 'flashset',
      name: 'valid_set.json',
      content: JSON.stringify({
        schemaVersion: 1,
        id: 'test-set-1',
        title: 'Flashset Corpus Test',
        cards: [
          {
            id: 'c1',
            setId: 'test-set-1',
            order: 0,
            type: 'equation',
            front: [{ t: 'text', v: 'Kinetic energy' }],
            back: [{ t: 'math', latex: 'E = \\frac{1}{2}mv^2' }],
            answer: { checker: 'math', accepted: [{ content: [{ t: 'math', latex: 'E = \\frac{1}{2}mv^2' }] }], options: {} },
            hints: [],
            tags: ['physics'],
            starred: false,
            media: [],
            extra: {},
            createdAt: 1700000000,
            updatedAt: 1700000000,
          },
        ],
        tags: ['physics'],
        createdAt: 1700000000,
        updatedAt: 1700000000,
        defaultCardType: 'equation',
        settings: {},
        extra: {},
      }, null, 2),
      valid: true,
    },
    {
      format: 'csv',
      name: 'empty.csv',
      content: '',
      valid: false,
    },
    {
      format: 'csv',
      name: 'truncated.csv',
      content: 'Term,Definition\nIncomplete Row,',
      valid: false,
    },
    {
      format: 'json',
      name: 'corrupted_json.json',
      content: '{ "schemaVersion": 1, "cards": [ {"id": "bad", ',
      valid: false,
    },
    {
      format: 'json',
      name: 'unknown_version.json',
      content: JSON.stringify({ schemaVersion: 999, title: 'Future Schema', cards: [] }),
      valid: false,
    },
  ];

  // 6. APP STATE CORPUS
  const appStateCorpus = [
    {
      name: 'clean_first_launch',
      storageData: null,
    },
    {
      name: 'mid_session',
      storageData: {
        formulaflash_settings: JSON.stringify({ accentsMatter: true, greekVariantsEqual: true, allowSideSwap: true, theme: 'dark' }),
        formulaflash_sets: JSON.stringify([
          {
            id: 'mid-session-deck',
            name: 'Mid Session Deck',
            category: 'Physics',
            cards: [
              { id: 'm1', title: 'Card 1', category: 'Physics', prompt: 'Prompt 1', latexAnswer: 'x=1' },
              { id: 'm2', title: 'Card 2', category: 'Physics', prompt: 'Prompt 2', latexAnswer: 'y=2' },
            ],
          },
        ]),
      },
    },
    {
      name: 'corrupted_storage',
      corrupted: true,
      storageData: {
        formulaflash_settings: '{ invalid json ...',
        formulaflash_sets: 'NOT_AN_ARRAY',
      },
    },
  ];

  return {
    textCorpus,
    formulaCorpus,
    numbersCorpus,
    setsCorpus,
    filesCorpus,
    appStateCorpus,
  };
}
