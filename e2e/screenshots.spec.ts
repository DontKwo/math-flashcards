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
        path: `docs/ai-notes/ai/foundation/screenshots/home-${vp.name}.png`,
        fullPage: true,
      });

      // Navigate to Set Details
      await page.click('text=Ideal Gas Law & friends');
      await expect(page.locator('[data-testid="set-study-learn-btn"]')).toBeVisible();

      // Set page screenshot
      await page.screenshot({
        path: `docs/ai-notes/ai/foundation/screenshots/set-${vp.name}.png`,
        fullPage: true,
      });

      // Navigate to Study Mode
      await page.click('[data-testid="set-study-cards-btn"]');
      await expect(page.locator('[data-testid="study-flip-card"]')).toBeVisible();

      // Study screenshot
      await page.screenshot({
        path: `docs/ai-notes/ai/foundation/screenshots/study-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
});
