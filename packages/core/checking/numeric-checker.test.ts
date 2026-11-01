import { describe, it, expect } from 'vitest';
import { numericChecker } from './numeric-checker.js';

describe('NumericChecker', () => {
  it('matches exact numbers', () => {
    expect(numericChecker.check('42', '42')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('3.14', '3.14')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('-5', '-5')).toEqual({ correct: true, via: 'exact' });
  });

  it('handles absolute tolerance', () => {
    const opts = { tol: 0.1 };
    expect(numericChecker.check('42.05', '42', opts)).toEqual({ correct: true, via: 'numeric' });
    expect(numericChecker.check('41.95', '42', opts)).toEqual({ correct: true, via: 'numeric' });
    expect(numericChecker.check('42.2', '42', opts)).toMatchObject({ correct: false });
  });

  it('handles relative tolerance', () => {
    const opts = { relTol: 0.05 }; // 5%
    expect(numericChecker.check('104', '100', opts)).toEqual({ correct: true, via: 'numeric' });
    expect(numericChecker.check('96', '100', opts)).toEqual({ correct: true, via: 'numeric' });
    expect(numericChecker.check('106', '100', opts)).toMatchObject({ correct: false });
  });

  it('handles scientific notation', () => {
    expect(numericChecker.check('1.5e3', '1500')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('1.5 * 10^3', '1500')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('1.5e-3', '0.0015')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('1.5*10^-3', '0.0015')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('1e6', '1000000')).toEqual({ correct: true, via: 'exact' });
  });

  it('handles units', () => {
    expect(numericChecker.check('42 m/s', '42 m/s')).toEqual({ correct: true, via: 'exact' });
    expect(numericChecker.check('42 m/s', '42', { unit: 'm/s' })).toEqual({ correct: true, via: 'exact' });

    // Mismatches
    expect(numericChecker.check('42 km/h', '42 m/s')).toMatchObject({ correct: false });
    expect(numericChecker.check('42', '42 m/s')).toMatchObject({ correct: false });
    expect(numericChecker.check('42 m/s', '42')).toMatchObject({ correct: false }); // unexpected unit
  });

  it('handles invalid input gracefully', () => {
    expect(numericChecker.check('abc', '42')).toMatchObject({ correct: false });
    expect(numericChecker.check('42', 'def')).toMatchObject({ correct: false });
  });
});
