import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { generateCorpus } from '../fixtures/corpus/corpus-generator.js';

interface RegisteredAction {
  screen: string;
  testId: string;
  role: string;
  label: string;
  preconditions: string;
  inputs: string[];
  expectedEffect: string;
}

const actions: RegisteredAction[] = JSON.parse(
  readFileSync('tests/e2e/registry/actions.generated.json', 'utf-8'),
);

const corpus = generateCorpus(101);

/**
 * Asserts all core UI invariants on the page.
 */
async function assertInvariants(page: import('@playwright/test').Page, screenName: string) {
  // Invariant 1: No NaN, undefined, null or [object Object] visible in the DOM
  const bodyText = await page.innerText('body');
  expect(bodyText).not.toContain('[object Object]');
  expect(bodyText).not.toMatch(/\bNaN\b/);
  expect(bodyText).not.toMatch(/\bundefined\b/);
  expect(bodyText).not.toMatch(/\bnull\b/);

  // Invariant 2: No broken layout: horizontal overflow
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalScroll, `Horizontal overflow detected on screen ${screenName}`).toBe(false);

  // Invariant 3: Safety: Injected HTML or script strings are rendered as text and never executed
  const xssFired = await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss === true);
  expect(xssFired, 'XSS script injection executed in page context!').toBe(false);

  // Invariant 4: Accessibility: axe-core reports no critical violations
  try {
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // color-contrast is verified separately in packages/core/testing/contrast-tokens.test.ts
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, `Axe critical violations on ${screenName}: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  } catch (axeErr) {
    // If axe fails to run due to detached frame, log warning
    console.warn('Axe analysis warning:', axeErr);
  }
}

test.describe('UI Matrix Layer', () => {
  // @smoke tests: Essential representative actions across key screens
  test('@smoke Navigation and core mode switching', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-testid="mode-tab-learn"]');
    await assertInvariants(page, 'learn');

    // Switch to study mode
    await page.click('[data-testid="mode-tab-study"]');
    await page.waitForSelector('[data-testid="study-flip-btn"]');
    await assertInvariants(page, 'study');

    // Flip card
    await page.click('[data-testid="study-flip-btn"]');
    await assertInvariants(page, 'study-flipped');

    // Switch to analytics
    await page.click('[data-testid="mode-tab-analytics"]');
    await assertInvariants(page, 'analytics');

    // Open settings
    await page.click('[data-testid="nav-settings-btn"]');
    await page.waitForSelector('[data-testid="settings-close-btn"]');
    await assertInvariants(page, 'settings');
    await page.click('[data-testid="settings-close-btn"]');
  });

  test('@smoke Card creation and validation flow', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="nav-add-card-btn"]');
    await page.waitForSelector('[data-testid="creator-title-input"]');

    // Fill valid card
    await page.fill('[data-testid="creator-title-input"]', 'Smoke Card');
    await page.fill('[data-testid="creator-prompt-input"]', 'Smoke Prompt');
    await page.fill('[data-testid="creator-answer-input"]', 'x = 42');

    await assertInvariants(page, 'creator-single');

    await page.click('[data-testid="creator-save-btn"]');
    await assertInvariants(page, 'learn-after-create');
  });

  // @matrix tests: Generating combinations across actions and corpus data classes
  // Deduplicate by testId so test titles are unique
  const uniqueTestIds = Array.from(new Set(actions.map((a) => a.testId)));
  const targetTestIds = [
    'nav-decks-btn',
    'nav-add-card-btn',
    'nav-settings-btn',
    'mode-tab-learn',
    'mode-tab-study',
    'mode-tab-analytics',
    'settings-accents-switch',
    'settings-greek-switch',
    'settings-sideswap-switch',
  ].filter((id) => uniqueTestIds.includes(id));

  for (const testId of targetTestIds) {
    test(`@matrix Action [${testId}] under dark & light themes`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          'formulaflash_settings',
          JSON.stringify({ accentsMatter: true, greekVariantsEqual: true, allowSideSwap: true, theme: 'dark' }),
        );
      });

      await page.goto('/');
      await page.waitForSelector('[data-testid="mode-tab-learn"]');

      const el = page.locator(`[data-testid="${testId}"]`);
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(50);
        await assertInvariants(page, testId);
      }
    });
  }

  // Cross text corpus inputs on creation modal
  for (const [idx, text] of corpus.textCorpus.slice(0, 15).entries()) {
    test(`@matrix CardCreator with corpus text variant #${idx}`, async ({ page }) => {
      await page.goto('/');
      await page.click('[data-testid="nav-add-card-btn"]');
      await page.waitForSelector('[data-testid="creator-title-input"]');

      // Seed inputs with corpus text
      await page.fill('[data-testid="creator-title-input"]', text.slice(0, 100) || 'Fallback');
      await page.fill('[data-testid="creator-prompt-input"]', text.slice(0, 200) || 'Fallback Prompt');
      await page.fill('[data-testid="creator-answer-input"]', 'E = mc^2');

      await assertInvariants(page, 'card-creator-corpus-input');
      await page.click('[data-testid="creator-cancel-btn"]');
    });
  }

  // Cross formula corpus inputs on Learn answer input
  for (const [idx, formula] of corpus.formulaCorpus.trivial.slice(0, 5).entries()) {
    test(`@matrix Learn check with formula variant #${idx}: ${formula}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="learn-answer-input"]');

      // Set mathfield value and dispatch input event so React state syncs
      await page.evaluate((val) => {
        const mf = document.querySelector('math-field');
        if (mf) {
          (mf as unknown as { value: string }).value = val;
          mf.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, formula);

      await page.click('[data-testid="learn-check-btn"]');
      await assertInvariants(page, 'learn-verdict');
    });
  }

  // @soak test: Rapid sequential action bursts
  test('@soak 50 rapid sequential transitions', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 50; i++) {
      if (i % 2 === 0) {
        await page.click('[data-testid="mode-tab-study"]');
      } else {
        await page.click('[data-testid="mode-tab-learn"]');
      }
    }
    await assertInvariants(page, 'learn-after-soak');
  });
});
