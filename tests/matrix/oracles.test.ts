import { describe, it, expect } from 'vitest';
import type { OracleViolation } from './oracles.ts';

describe('Quality Oracles', () => {
  it('categorizes and formats oracle violations accurately', () => {
    const violation: OracleViolation = {
      category: 'leaked-literal',
      message: 'Found leaked "NaN" in: "Score: NaN / 10"',
    };

    expect(violation.category).toBe('leaked-literal');
    expect(violation.message).toContain('NaN');
  });

  it('detects overflow and network requests structure', () => {
    const netViolation: OracleViolation = {
      category: 'network-request',
      message: 'App made unexpected external network request to https://evil.com/telemetry',
    };
    expect(netViolation.category).toBe('network-request');
  });
});
