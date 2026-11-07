import { test, expect } from '@playwright/test';

test.describe('Formula Flash App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
  });

  test('boots to Home and shows seeded sample deck', async ({ page }) => {
    await expect(page.locator('.shell-topbar-title')).toBeVisible();
    await expect(page.locator('[data-testid^="home-set-card-"]').first()).toBeVisible();
    await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible();
  });

  test('navigates to Set details and study modes', async ({ page }) => {
    // Open sample deck
    await page.click('text=Ideal Gas Law & friends');
    await expect(page).toHaveURL(/#\/set\//);
    await expect(page.locator('[data-testid="set-study-learn-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="set-study-cards-btn"]')).toBeVisible();

    // Enter Cards mode
    await page.click('[data-testid="set-study-cards-btn"]');
    await expect(page).toHaveURL(/#\/study\/.*\/cards/);
    await expect(page.locator('[data-testid="study-flip-card"]')).toBeVisible({ timeout: 10000 });

    // Exit study mode
    await page.click('[data-testid="study-exit-btn"]');
    await expect(page).toHaveURL(/#\/set\//);
  });

  test('creates a new flashcard set with a card', async ({ page }) => {
    // Navigate to create set
    await page.click('[data-testid="home-create-set"]');
    await expect(page).toHaveURL(/#\/create/);

    // Fill form
    await page.fill('[data-testid="editor-title-input"]', 'Quantum Electrodynamics');
    await page.fill('[data-testid="editor-tags-input"]', 'Physics, Quantum');
    await page.click('[data-testid="editor-save-btn"]');

    // Should navigate to newly created set view
    await expect(page).toHaveURL(/#\/set\//);
    await expect(page.locator('text=Quantum Electrodynamics')).toBeVisible();
  });

  test('navigates through Stats and Settings', async ({ page }) => {
    // Navigate to stats
    await page.goto('/#/stats');
    await expect(page.locator('text=Study Stats & Mastery')).toBeVisible();

    // Navigate to settings
    await page.goto('/#/settings');
    await expect(page.locator('text=Math Answer Checker')).toBeVisible();
    await expect(page.locator('[data-testid="settings-save-btn"]')).toBeVisible();
  });
});
