import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { scanPageControls, type InventoryResult } from './inventory.ts';

test.describe('Control Inventory & Crawl Matrix', () => {
  test('crawls all routes and generates tests/matrix/inventory.json', async ({ page }) => {
    const routesToTest = [
      '#/',
      '#/set/sample-deck',
      '#/set/sample-deck/edit',
      '#/create',
      '#/study/sample-deck/learn',
      '#/study/sample-deck/cards',
      '#/stats',
      '#/settings',
    ];

    const result: InventoryResult = {
      timestamp: new Date().toISOString(),
      routes: routesToTest,
      controls: [],
      violations: [],
    };

    const seenControlKeys = new Set<string>();

    for (const route of routesToTest) {
      await page.goto(`http://localhost:5173/${route}`);
      // Wait for content to render
      await page.waitForTimeout(500);

      const { controls, violations } = await scanPageControls(page, route);

      for (const ctrl of controls) {
        const key = `${ctrl.route}|${ctrl.selector}|${ctrl.role}|${ctrl.accessibleName}`;
        if (!seenControlKeys.has(key)) {
          seenControlKeys.add(key);
          result.controls.push(ctrl);
        }
      }

      for (const v of violations) {
        result.violations.push(v);
      }
    }

    const outPath = path.resolve(process.cwd(), 'tests/matrix/inventory.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

    console.log(`Discovered ${result.controls.length} controls across ${routesToTest.length} routes.`);
    console.log(`Found ${result.violations.length} control violations/warnings.`);

    expect(fs.existsSync(outPath)).toBe(true);
    expect(result.controls.length).toBeGreaterThan(15);
  });
});
