import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

test.describe('Responsive Visual Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`capture screenshots at ${vp.name}`, async ({ page }, testInfo) => {
      // Only capture from the project matching the viewport name to prevent file write collisions
      if (!testInfo.project.name.includes(vp.name)) {
        test.skip();
      }

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/#/');

      // Wait for home screen content
      await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible();

      // Home screenshot
      await page.screenshot({
        path: `docs/ai-notes/ai/study/screenshots/home-${vp.name}.png`,
        fullPage: true,
      });

      // Navigate to Set Details
      await page.click('text=Ideal Gas Law & friends');
      await expect(page.locator('[data-testid="set-study-learn-btn"]')).toBeVisible();

      // Set page screenshot
      await page.screenshot({
        path: `docs/ai-notes/ai/study/screenshots/set-${vp.name}.png`,
        fullPage: true,
      });

      // Navigate to Flashcards Mode
      await page.click('[data-testid="set-study-cards-btn"]');
      await expect(page.locator('[data-testid="study-flip-card"]')).toBeVisible();

      // Flashcards screenshot
      await page.screenshot({
        path: `docs/ai-notes/ai/study/screenshots/cards-${vp.name}.png`,
        fullPage: true,
      });

      // Exit back to Set
      await page.click('[data-testid="study-exit-btn"]');
      await expect(page).toHaveURL(/#\/set\//);

      // Navigate to Learn Mode
      await page.click('[data-testid="set-study-learn-btn"]');
      await expect(page.locator('[data-testid="study-learn-panel"]')).toBeVisible();

      // Learn mode screenshot
      await page.screenshot({
        path: `docs/ai-notes/ai/study/screenshots/learn-${vp.name}.png`,
        fullPage: true,
      });

      // Navigate to Stats
      await page.goto('/#/stats');
      await expect(page.locator('text=Study Stats & Mastery')).toBeVisible();
      await page.screenshot({
        path: `docs/ai-notes/ai/study/screenshots/stats-${vp.name}.png`,
        fullPage: true,
      });

      // Navigate to Settings
      await page.goto('/#/settings');
      await expect(page.locator('text=Math Answer Checker')).toBeVisible();
      await page.screenshot({
        path: `docs/ai-notes/ai/study/screenshots/settings-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
});
