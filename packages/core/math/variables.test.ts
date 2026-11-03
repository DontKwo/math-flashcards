import { describe, it, expect } from 'vitest';
import { extractVariables } from './variables.js';

describe('extractVariables', () => {
  it('extracts simple variables', () => {
    expect(extractVariables('PV = nRT')).toEqual(['P', 'R', 'T', 'V', 'n']);
    expect(extractVariables('y = m x + c')).toEqual(['c', 'm', 'x', 'y']);
  });

  it('extracts greek letters', () => {
    expect(extractVariables('\\alpha + \\beta = \\Omega')).toEqual(['\\Omega', '\\alpha', '\\beta']);
    expect(extractVariables('\\theta = \\pi / 2')).toEqual(['\\theta']); // pi is a constant
  });

  it('extracts decorated variables', () => {
    expect(extractVariables('\\hat{x} + \\vec{v} + \\bar{y}')).toEqual(['\\bar{y}', '\\hat{x}', '\\vec{v}']);
    expect(extractVariables('\\dot{q} + \\ddot{r}')).toEqual(['\\ddot{r}', '\\dot{q}']);
  });

  it('extracts variables with subscripts', () => {
    expect(extractVariables('v_{initial} + a_{max}')).toEqual(['a_{max}', 'v_{initial}']);
    expect(extractVariables('x_1 + y_2')).toEqual(['x_{1}', 'y_{2}']);
    expect(extractVariables('\\mu_0 + \\epsilon_0')).toEqual(['\\epsilon_{0}', '\\mu_{0}']);
  });

  it('ignores functions and constants', () => {
    expect(extractVariables('\\sin(x) + \\cos(y)')).toEqual(['x', 'y']);
    expect(extractVariables('e^{x} + \\ln(y)')).toEqual(['x', 'y']); // e is ExponentialE
    expect(extractVariables('\\log(z)')).toEqual(['z']);
  });

  it('handles multiple occurrences and returns sorted unique elements', () => {
    expect(extractVariables('x + x^2 + 2x')).toEqual(['x']);
    expect(extractVariables('A_1 + A_1')).toEqual(['A_{1}']);
  });
});
