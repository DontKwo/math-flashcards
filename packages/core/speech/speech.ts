export function convertMathToText(math: string): string {
  if (!math) return '';

  let s = math;

  // Fractions: \frac{a}{b} -> a over b
  s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1 over $2');

  // Replace common Greek letters and math symbols
  s = s.replace(/\\([a-zA-Z]+)(?![a-zA-Z])/g, (match, p1) => {
    // Basic mapping for spoken text
    const map: Record<string, string> = {
      alpha: 'alpha',
      beta: 'beta',
      gamma: 'gamma',
      delta: 'delta',
      epsilon: 'epsilon',
      zeta: 'zeta',
      eta: 'eta',
      theta: 'theta',
      iota: 'iota',
      kappa: 'kappa',
      lambda: 'lambda',
      mu: 'mu',
      nu: 'nu',
      xi: 'xi',
      omicron: 'omicron',
      pi: 'pi',
      rho: 'rho',
      sigma: 'sigma',
      tau: 'tau',
      upsilon: 'upsilon',
      phi: 'phi',
      chi: 'chi',
      psi: 'psi',
      omega: 'omega',
      // Common operators and symbols
      cdot: 'times',
      times: 'times',
      div: 'divided by',
      pm: 'plus or minus',
      mp: 'minus or plus',
      leq: 'less than or equal to',
      geq: 'greater than or equal to',
      neq: 'not equal to',
      approx: 'approximately equal to',
      infty: 'infinity',
      sqrt: 'square root of',
    };
    return map[p1.toLowerCase()] || p1;
  });

  // Handle exponents (superscripts) ^2 -> squared, ^3 -> cubed, ^{x} -> to the power of x
  s = s.replace(/\^2(?![0-9])/g, ' squared');
  s = s.replace(/\^3(?![0-9])/g, ' cubed');
  s = s.replace(/\^\{2\}/g, ' squared');
  s = s.replace(/\^\{3\}/g, ' cubed');
  s = s.replace(/\^\{([^{}]+)\}/g, ' to the power of $1');
  s = s.replace(/\^([a-zA-Z0-9])/g, ' to the power of $1');

  // Handle subscripts _2 -> sub 2, _{x} -> sub x
  s = s.replace(/_\{([^{}]+)\}/g, ' sub $1');
  s = s.replace(/_([a-zA-Z0-9])/g, ' sub $1');

  // Clean up remaining braces and spaces
  s = s.replace(/[{}]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

export async function speakTerm(term: string, lang?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }

  const textToSpeak = convertMathToText(term);

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (lang) {
      utterance.lang = lang;
    }

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    window.speechSynthesis.speak(utterance);
  });
}
