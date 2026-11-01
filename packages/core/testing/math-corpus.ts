export interface CorpusCase {
  reference: string;
  accept: Array<string | { given: string; options?: Record<string, unknown> }>;
  reject: Array<string | { given: string; options?: Record<string, unknown> }>;
}

export const mathCorpus: CorpusCase[] = [
  {
    reference: 'PV = nRT',
    accept: [
      'PV=nRT',
      'nRT=PV',
      'P V = n R T',
    ],
    reject: [
      'P=nRT',
      'PV=nR',
      'PV=nRT^2',
      'PV=nrT',
      'PV=nRt',
    ],
  },
  {
    reference: 'P = \\hat{\\rho} R T',
    accept: [
      'P=\\hat{\\rho}RT',
      'P=R T\\hat{\\rho}',
      '\\hat{\\rho}RT=P',
      { given: 'P=\\rho RT', options: { accentsMatter: false } },
    ],
    reject: [
      'P=\\rho RT',
      'P=\\hat{\\rho}R',
      'P=\\bar{\\rho}RT',
    ],
  },
  {
    reference: 'E = \\frac{1}{2} m v^{2}',
    accept: [
      'E=\\frac12mv^2',
      'E=\\frac{mv^2}{2}',
    ],
    reject: [
      'E=mv^2',
      'E=\\frac12 m v',
      'E=\\frac12 m^2 v',
    ],
  },
  {
    reference: '\\Delta G = \\Delta H - T\\Delta S',
    accept: [
      '\\Delta G=\\Delta H-T\\Delta S',
      '\\Delta G=\\Delta H-\\Delta S T',
    ],
    reject: [
      '\\Delta G=\\Delta H+T\\Delta S',
      'G=H-TS',
    ],
  },
  {
    reference: 'x = \\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
    accept: [
      'x = \\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}',
    ],
    reject: [
      'x = \\frac{-b\\pm\\sqrt{b^2-4ac}}{a}',
      'x = \\frac{b\\pm\\sqrt{b^2-4ac}}{2a}',
    ],
  },
];
