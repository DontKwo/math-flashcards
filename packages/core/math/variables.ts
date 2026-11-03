import { ComputeEngine } from '@cortex-js/compute-engine';

// Extracts unique mathematical variables from a LaTeX string.
export function extractVariables(latex: string): string[] {

  const ce = new ComputeEngine();
  const expr = ce.parse(latex);
  const vars = new Set<string>();

  const ignored = new Set([
    'Pi', 'ExponentialE', 'ImaginaryI', 'True', 'False', 'Nothing', 'Half', 'NaN', 'ComplexInfinity',
    'Infinity', 'NegativeInfinity', 'PositiveInfinity',
    'Derivative', 'Integrate', 'Sum', 'Product', 'List'
  ]);

  const decorators: Record<string, string> = {
    'OverHat': '\\hat',
    'Mean': '\\bar', // ComputeEngine parses \bar as Mean
    'OverBar': '\\bar',
    'OverVector': '\\vec',
    'OverTilde': '\\tilde',
    'OverDot': '\\dot',
    'OverDoubleDot': '\\ddot'
  };

  const traverse = (node: unknown): void => {
    if (typeof node === 'string') {
      if (/^[A-Za-z][A-Za-z0-9_]*$/.test(node) && !ignored.has(node)) {
        vars.add(node);
      }
    } else if (Array.isArray(node)) {
      const head = node[0];

      if (typeof head === 'string' && head in decorators && node.length === 2 && typeof node[1] === 'string') {
        vars.add(`${decorators[head]}{${node[1]}}`);
      } else if (head === 'D') {
        // CE parses \dot{q} as ["D", ["Function", ["Block", "q"], "t"], "t"]
        if (node[1] && Array.isArray(node[1]) && node[1][0] === 'Function' && Array.isArray(node[1][1]) && node[1][1][0] === 'Block' && typeof node[1][1][1] === 'string' && node[2] === 't') {
          vars.add(`\\dot{${node[1][1][1]}}`);
        } else if (node[1] && Array.isArray(node[1]) && node[1][0] === 'D' && Array.isArray(node[1][1]) && node[1][1][0] === 'Function' && Array.isArray(node[1][1][1]) && node[1][1][1][0] === 'Block' && typeof node[1][1][1][1] === 'string' && node[2] === 't') {
          vars.add(`\\ddot{${node[1][1][1][1]}}`);
        } else {
          for (let i = 1; i < node.length; i++) {
            traverse(node[i]);
          }
        }
      } else if (head === 'Subscript' && typeof node[1] === 'string') {
        // If node[2] is a string or number, we can combine them, otherwise extract separately
        if (typeof node[2] === 'string' || typeof node[2] === 'number') {
          vars.add(`${node[1]}_${node[2]}`);
        } else {
          vars.add(node[1]);
          traverse(node[2]);
        }
      } else {
        for (let i = 1; i < node.length; i++) {
          traverse(node[i]);
        }
      }
    } else if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>;
      if (obj.sym) traverse(obj.sym);
      if (Array.isArray(obj.fn)) {
        for (let i = 1; i < obj.fn.length; i++) {
          traverse(obj.fn[i]);
        }
      }
    }
  };

  traverse(expr.json);

  const greekLetters = new Set([
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
  ]);

  const formatVar = (v: string): string => {
    if (v === 'Mu0') return '\\mu_{0}';
    if (v.startsWith('\\')) return v;

    const parts = v.split('_');
    const base = parts[0]!;
    const sub = parts.slice(1).join('_');

    let formattedBase = base;
    if (greekLetters.has(base.toLowerCase()) || greekLetters.has(base)) {
      formattedBase = `\\${base}`;
    }

    if (sub) {
      return `${formattedBase}_{${sub}}`;
    }
    return formattedBase;
  };

  const extracted = Array.from(vars).map(formatVar);

  return Array.from(new Set(extracted)).sort();
}
