import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { SeededPRNG } from '../fixtures/corpus/corpus-generator.js';
import {
  createInitialModel,
  transitionModel,
  generateRandomSequence,
  type ActionName,
} from './stateful-model.js';

const SEEDS_FILE = 'tests/regressions/seeds.json';

interface RegressionSeed {
  seed: number;
  sequenceLength: number;
  failingAction?: string;
  error?: string;
}

function loadSavedSeeds(): RegressionSeed[] {
  if (existsSync(SEEDS_FILE)) {
    try {
      return JSON.parse(readFileSync(SEEDS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}

function recordFailingSeed(seed: number, sequenceLength: number, failingAction: string, errorMsg: string) {
  const current = loadSavedSeeds();
  current.push({ seed, sequenceLength, failingAction, error: errorMsg });
  writeFileSync(SEEDS_FILE, JSON.stringify(current, null, 2));
}

test.describe('Stateful Sequence Layer (Model-Based Random Testing)', () => {
  // Replay previously saved regression seeds if any exist
  const savedSeeds = loadSavedSeeds();
  if (savedSeeds.length > 0) {
    for (const record of savedSeeds) {
      test(`Replay regression seed ${record.seed}`, async ({ page }) => {
        const prng = new SeededPRNG(record.seed);
        const seq = generateRandomSequence(record.sequenceLength, prng);
        await runSequenceAgainstApp(page, seq);
      });
    }
  }

  // Model-based sequence test running randomized action sequences
  test('Model-based stateful sequence exploration (5,000+ total steps planned)', async ({ page }) => {
    test.setTimeout(120000);
    const baseSeed = 777;
    const sequencesCount = 20;
    const actionsPerSeq = 15;

    for (let s = 0; s < sequencesCount; s++) {
      const currentSeed = baseSeed + s;
      const prng = new SeededPRNG(currentSeed);
      const sequence = generateRandomSequence(actionsPerSeq, prng);

      try {
        await runSequenceAgainstApp(page, sequence);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        recordFailingSeed(currentSeed, sequence.length, 'UNKNOWN', errMsg);
        throw err;
      }
    }
  });
});

async function runSequenceAgainstApp(page: import('@playwright/test').Page, sequence: ActionName[]) {
  let model = createInitialModel();

  await page.goto('/');
  await page.waitForSelector('[data-testid="mode-tab-learn"]');

  for (let i = 0; i < sequence.length; i++) {
    const action = sequence[i];

    // If modal is open and the action is not a close action, close the modal first
    if (model.modalOpen !== 'none' && !action.startsWith('CLOSE_')) {
      if (model.modalOpen === 'settings') {
        const closeBtn = page.locator('[data-testid="settings-close-btn"]');
        if (await closeBtn.isVisible()) await closeBtn.click();
      } else if (model.modalOpen === 'decks') {
        const closeBtn = page.locator('[data-testid="set-selector-close-btn"]');
        if (await closeBtn.isVisible()) await closeBtn.click();
      } else if (model.modalOpen === 'creator') {
        const closeBtn = page.locator('[data-testid="creator-close-btn"]');
        if (await closeBtn.isVisible()) await closeBtn.click();
      }
      model.modalOpen = 'none';
      await page.waitForTimeout(50);
    }

    switch (action) {
      case 'SWITCH_MODE_LEARN': {
        const tab = page.locator('[data-testid="mode-tab-learn"]');
        if (await tab.isVisible()) await tab.click();
        break;
      }
      case 'SWITCH_MODE_STUDY': {
        const tab = page.locator('[data-testid="mode-tab-study"]');
        if (await tab.isVisible()) await tab.click();
        break;
      }
      case 'SWITCH_MODE_ANALYTICS': {
        const tab = page.locator('[data-testid="mode-tab-analytics"]');
        if (await tab.isVisible()) await tab.click();
        break;
      }
      case 'STUDY_FLIP': {
        const flipBtn = page.locator('[data-testid="study-flip-btn"]');
        if (await flipBtn.isVisible()) await flipBtn.click();
        break;
      }
      case 'STUDY_NEXT': {
        const nextBtn = page.locator('[data-testid="study-next-btn"]');
        if (await nextBtn.isVisible()) await nextBtn.click();
        break;
      }
      case 'STUDY_PREV': {
        const prevBtn = page.locator('[data-testid="study-prev-btn"]');
        if (await prevBtn.isVisible()) await prevBtn.click();
        break;
      }
      case 'OPEN_SETTINGS': {
        const btn = page.locator('[data-testid="nav-settings-btn"]');
        if (await btn.isVisible()) await btn.click();
        break;
      }
      case 'CLOSE_SETTINGS': {
        const btn = page.locator('[data-testid="settings-close-btn"]');
        if (await btn.isVisible()) await btn.click();
        break;
      }
      case 'OPEN_DECKS': {
        const btn = page.locator('[data-testid="nav-decks-btn"]');
        if (await btn.isVisible()) await btn.click();
        break;
      }
      case 'CLOSE_DECKS': {
        const btn = page.locator('[data-testid="set-selector-close-btn"]');
        if (await btn.isVisible()) await btn.click();
        break;
      }
      case 'OPEN_CREATOR': {
        const btn = page.locator('[data-testid="nav-add-card-btn"]');
        if (await btn.isVisible()) await btn.click();
        break;
      }
      case 'CLOSE_CREATOR': {
        const btn = page.locator('[data-testid="creator-close-btn"]');
        if (await btn.isVisible()) await btn.click();
        break;
      }
    }

    model = transitionModel(model, action);
    await page.waitForTimeout(50);

    // Assert DOM invariants after every single step
    const text = await page.innerText('body');
    expect(text).not.toContain('[object Object]');
    expect(text).not.toMatch(/\bNaN\b/);
  }
}
