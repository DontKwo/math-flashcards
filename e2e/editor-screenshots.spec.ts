import { test } from '@playwright/test';

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

test.describe('Editor Screenshots', () => {
  for (const vp of VIEWPORTS) {
    test(`captures editor view at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('#/create');
      await page.waitForSelector('[data-testid="editor-title-input"]');

      await page.getByTestId('editor-title-input').fill('Classical Physics & Electromagnetism');
      await page.getByTestId('editor-category-input').fill('Physics');
      await page.getByTestId('editor-tag-input').fill('Electromagnetism');
      await page.getByTestId('editor-add-tag-btn').click();

      await page.getByTestId('editor-bulk-add-open-btn').click();
      await page.getByTestId('editor-bulk-textarea').fill(
        'Coulomb\'s Law\tF = k_e \\frac{q_1 q_2}{r^2}\nNewton\'s Second Law\tF = ma\nOhm\'s Law\tV = IR\nIdeal Gas Law\tPV = nRT'
      );
      await page.getByTestId('editor-bulk-import-btn').click();

      const firstMathBtn = page.locator('.editor-row-card').first().getByRole('button', { name: /^Math$/i });
      if (await firstMathBtn.count() > 0) {
        await firstMathBtn.first().click();
      }

      await page.waitForTimeout(300);
      await page.screenshot({
        path: `docs/ai-notes/ai/set-editor/screenshots/editor-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
});
