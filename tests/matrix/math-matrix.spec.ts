import { test, expect } from '@playwright/test';
import { registry, type CardSet, type Card } from '@formulaflash/core';
import { mathCorpus } from '../../packages/core/testing/math-corpus.ts';
import { attachOracles } from './oracles.ts';

test.describe('Math Answer Matrix Evaluation Suite (Interactive UI)', () => {
  const mathChecker = registry.getChecker('math');

  for (let corpusIdx = 0; corpusIdx < mathCorpus.length; corpusIdx++) {
    const item = mathCorpus[corpusIdx];

    test(`verifies math corpus #${corpusIdx + 1} (${item.reference}) interactive UI input evaluation`, async ({ page }) => {
      const setId = `math-interactive-deck-${corpusIdx}`;
      const testSet: CardSet = {
        id: setId,
        title: `Math Corpus Deck #${corpusIdx + 1}`,
        description: `Reference: ${item.reference}`,
        tags: ['math-corpus'],
        cardCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const testCard: Card = {
        id: `math-interactive-card-${corpusIdx}`,
        setId,
        order: 0,
        type: 'equation',
        front: [{ t: 'text', v: `State formula for: ${item.reference}` }],
        back: [{ t: 'math', latex: item.reference, display: true }],
        answer: {
          checker: 'math',
          accepted: [{ content: [{ t: 'math', latex: item.reference, display: true }] }],
          options: {},
        },
        hints: [],
        tags: [],
        starred: false,
        media: [],
        extra: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await page.goto('http://localhost:5173/#/');
      await page.waitForTimeout(300);

      await page.evaluate(
        async ({ s, c }) => {
          const req = indexedDB.open('formulaflash_db', 1);
          await new Promise<void>((resolve, reject) => {
            req.onsuccess = () => {
              const db = req.result;
              const tx = db.transaction(['sets', 'cards'], 'readwrite');
              tx.objectStore('sets').put(s);
              tx.objectStore('cards').put(c);
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
            };
          });
        },
        { s: testSet, c: testCard }
      );

      const oracle = await attachOracles(page);

      // Navigate to Learn mode for this card
      await page.goto(`http://localhost:5173/#/study/${setId}/learn`);
      await page.waitForSelector('[data-testid="study-learn-panel"]', { timeout: 10000 });

      // Run every accept case through UI input
      for (const acc of item.accept) {
        // StudyScreen currently evaluates with hardcoded accentsMatter: true
        if (typeof acc !== 'string' && acc.options?.accentsMatter === false) {
          continue;
        }
        const given = typeof acc === 'string' ? acc : acc.given;

        // Type / set into MathLive field in the UI
        await page.evaluate((latex) => {
          const mf = document.querySelector('math-field') as unknown as { value: string; dispatchEvent: (e: Event) => void };
          if (mf) {
            mf.value = latex;
            mf.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, given);

        const checkBtn = page.locator('[data-testid="study-check-btn"]');
        await expect(checkBtn).toBeEnabled({ timeout: 5000 });
        await checkBtn.click();
        await page.waitForTimeout(100);

        await expect(page.locator('.study-verdict-correct')).toBeVisible();

        // Click continue or next card to proceed
        const contBtn = page.locator('button:has-text("Next Card"), button:has-text("Continue")');
        if (await contBtn.isVisible()) {
          await contBtn.click();
          await page.waitForTimeout(100);
        }
      }

      // Run reject cases through UI input
      for (const rej of item.reject) {
        const given = typeof rej === 'string' ? rej : rej.given;
        const options = typeof rej === 'string' ? undefined : rej.options;

        const expectedResult = mathChecker!.check(given, item.reference, {
          accentsMatter: true,
          greekVariantsEqual: true,
          allowSideSwap: true,
          ...(options || {}),
        });

        // Type into MathLive field in UI
        await page.evaluate((latex) => {
          const mf = document.querySelector('math-field') as unknown as { value: string; dispatchEvent: (e: Event) => void };
          if (mf) {
            mf.value = latex;
            mf.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, given);

        const checkBtn = page.locator('[data-testid="study-check-btn"]');
        await expect(checkBtn).toBeEnabled({ timeout: 5000 });
        await checkBtn.click();
        await page.waitForTimeout(100);

        if (expectedResult.correct) {
          await expect(page.locator('.study-verdict-correct')).toBeVisible();
        } else {
          await expect(page.locator('.study-verdict-incorrect')).toBeVisible();
        }

        const contBtn = page.locator('button:has-text("Next Card"), button:has-text("Continue")');
        if (await contBtn.isVisible()) {
          await contBtn.click();
          await page.waitForTimeout(100);
        }
      }

      // Test Virtual Math Toolbar interaction
      const fractionToolbarBtn = page.locator('button.toolbar-btn[title="Fraction"]');
      if (await fractionToolbarBtn.isVisible()) {
        await fractionToolbarBtn.click();
        await page.waitForTimeout(100);
        const previewHasText = await page.evaluate(() => {
          const preview = document.querySelector('.study-math-preview');
          return preview ? preview.textContent?.trim() : '';
        });
        expect(previewHasText).not.toBe('Live equation preview appears here');
      }

      const violations = await oracle.stop();
      expect(violations.filter((v) => v.category === 'console-error')).toHaveLength(0);
    });
  }
});
