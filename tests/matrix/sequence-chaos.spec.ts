import { test, expect } from '@playwright/test';
import { runSeededRandomWalk } from './sequence-chaos.ts';

test.describe('Seeded Random Walk & Chaos Invariant Suite', () => {
  test('executes a 10-step seeded walk checking invariants on Desktop', async ({ page }) => {
    const report = await runSeededRandomWalk(page, 77777, 10, { isTouch: false });
    expect(report.totalSteps).toBe(10);
    expect(report.passedSteps).toBeGreaterThanOrEqual(8);
  });

  test('executes a 10-step seeded walk on Mobile with touch', async ({ page }) => {
    const report = await runSeededRandomWalk(page, 88888, 10, { isTouch: true });
    expect(report.totalSteps).toBe(10);
  });
});
