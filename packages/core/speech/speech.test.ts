import { describe, it, expect } from 'vitest';
import { convertMathToText } from './speech';

describe('convertMathToText', () => {
  it('converts fractions', () => {
    expect(convertMathToText('\\frac{a}{b}')).toBe('a over b');
    expect(convertMathToText('\\frac{1}{2}')).toBe('1 over 2');
  });

  it('converts Greek letters', () => {
    expect(convertMathToText('\\alpha + \\beta')).toBe('alpha + beta');
    expect(convertMathToText('\\theta')).toBe('theta');
  });

  it('converts math operators', () => {
    expect(convertMathToText('a \\cdot b')).toBe('a times b');
    expect(convertMathToText('x \\pm y')).toBe('x plus or minus y');
    expect(convertMathToText('a \\leq b')).toBe('a less than or equal to b');
  });

  it('converts superscripts and subscripts', () => {
    expect(convertMathToText('x^2')).toBe('x squared');
    expect(convertMathToText('y^{3}')).toBe('y cubed');
    expect(convertMathToText('z^{4}')).toBe('z to the power of 4');
    expect(convertMathToText('x_1')).toBe('x sub 1');
    expect(convertMathToText('a_{bc}')).toBe('a sub bc');
  });

  it('handles combinations', () => {
    expect(convertMathToText('\\frac{\\alpha^2}{\\beta_1}')).toBe('alpha squared over beta sub 1');
  });

  it('handles empty or plain text', () => {
    expect(convertMathToText('')).toBe('');
    expect(convertMathToText('hello')).toBe('hello');
  });
});
