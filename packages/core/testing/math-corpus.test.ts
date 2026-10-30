import { describe, it, expect } from 'vitest';
import { mathCorpus } from './math-corpus';

describe('math-corpus', () => {
  it('should have basic scaffolding', () => {
    expect(mathCorpus.length).toBe(1);
    expect(mathCorpus[0].reference).toBe('PV = nRT');
  });
});
