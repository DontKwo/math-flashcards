import type { Page } from '@playwright/test';
import { Mulberry32PRNG, generateLibrary } from './factory.ts';
import { attachOracles, type OracleViolation } from './oracles.ts';

export type ActionStep =
  | 'navigate-home'
  | 'navigate-stats'
  | 'navigate-settings'
  | 'create-set'
  | 'edit-set'
  | 'study-learn'
  | 'study-cards'
  | 'rapid-click'
  | 'enter-escape-burst'
  | 'page-reload'
  | 'resize-viewport';

export interface WalkStepResult {
  step: number;
  action: ActionStep;
  durationMs: number;
  violations: OracleViolation[];
}

export interface RandomWalkReport {
  seed: number;
  totalSteps: number;
  passedSteps: number;
  steps: WalkStepResult[];
}

// Executes a deterministic seeded sequence of actions across the app
export async function runSeededRandomWalk(
  page: Page,
  seed: number,
  stepCount: number = 10,
  options: { isTouch?: boolean } = {}
): Promise<RandomWalkReport> {
  const rng = new Mulberry32PRNG(seed);
  const actions: ActionStep[] = [
    'navigate-home',
    'navigate-stats',
    'navigate-settings',
    'create-set',
    'edit-set',
    'study-learn',
    'study-cards',
    'rapid-click',
    'enter-escape-burst',
    'page-reload',
  ];

  const oracle = await attachOracles(page, { isTouchViewport: options.isTouch });
  const report: RandomWalkReport = {
    seed,
    totalSteps: stepCount,
    passedSteps: 0,
    steps: [],
  };

  // Seed baseline library
  const lib = generateLibrary({ seed, setCount: 2, cardsPerSet: 2 });
  await page.goto('http://localhost:5173/#/');
  await page.waitForTimeout(500);

  await page.evaluate(
    async ({ s, cs }) => {
      const req = indexedDB.open('formulaflash_db', 1);
      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(['sets', 'cards'], 'readwrite');
          for (const item of s) tx.objectStore('sets').put(item);
          for (const card of cs) tx.objectStore('cards').put(card);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { s: lib.sets, cs: lib.cards }
  );

  for (let i = 0; i < stepCount; i++) {
    const action = rng.pick(actions);
    const start = Date.now();

    try {
      switch (action) {
        case 'navigate-home':
          await page.goto('http://localhost:5173/#/');
          await page.waitForSelector('[data-testid="home-search-input"]', { timeout: 5000 });
          break;

        case 'navigate-stats':
          await page.goto('http://localhost:5173/#/stats');
          await page.waitForSelector('text=Study Stats & Mastery', { timeout: 5000 });
          break;

        case 'navigate-settings':
          await page.goto('http://localhost:5173/#/settings');
          await page.waitForSelector('[data-testid="settings-save-btn"]', { timeout: 5000 });
          break;

        case 'create-set': {
          await page.goto('http://localhost:5173/#/create');
          const titleInput = page.locator('[data-testid="editor-title-input"]');
          await titleInput.fill(`Chaos Set ${seed}-${i}`);
          const saveBtn = page.locator('[data-testid="editor-save-btn"]');
          await saveBtn.click();
          await page.waitForTimeout(300);
          break;
        }

        case 'edit-set':
          await page.goto(`http://localhost:5173/#/set/${lib.sets[0].id}/edit`);
          await page.waitForSelector('[data-testid="editor-title-input"]', { timeout: 5000 });
          break;

        case 'study-learn':
          await page.goto(`http://localhost:5173/#/study/${lib.sets[0].id}/learn`);
          await page.waitForTimeout(300);
          break;

        case 'study-cards':
          await page.goto(`http://localhost:5173/#/study/${lib.sets[0].id}/cards`);
          await page.waitForTimeout(300);
          break;

        case 'rapid-click': {
          const btn = page.locator('button').first();
          if (await btn.isVisible()) {
            await btn.click({ clickCount: 3, delay: 50 });
          }
          break;
        }

        case 'enter-escape-burst':
          await page.keyboard.press('Escape');
          await page.keyboard.press('Enter');
          break;

        case 'page-reload':
          await page.reload();
          await page.waitForTimeout(300);
          break;
      }

      const stepViolations = await oracle.checkInvariants();
      report.steps.push({
        step: i + 1,
        action,
        durationMs: Date.now() - start,
        violations: stepViolations,
      });

      if (stepViolations.length === 0) {
        report.passedSteps++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      report.steps.push({
        step: i + 1,
        action,
        durationMs: Date.now() - start,
        violations: [
          {
            category: 'console-error',
            message: `Walk step failed on ${action}: ${message}`,
          },
        ],
      });
    }
  }

  await oracle.stop();
  return report;
}
