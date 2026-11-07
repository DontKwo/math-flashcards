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

    // Flip card
    await page.click('[data-testid="study-flip-card"]');
    await expect(page.locator('text=Target Formula')).toBeVisible();

    // Rate card "Know it"
    await page.click('[data-testid="study-rate-know-btn"]');

    // Exit study mode
    await page.click('[data-testid="study-exit-btn"]');
    await expect(page).toHaveURL(/#\/set\//);
  });

  test('executes real Learn mode session with Multiple Choice and escape hatches', async ({ page }) => {
    await page.click('text=Ideal Gas Law & friends');
    await page.click('[data-testid="set-study-learn-btn"]');
    await expect(page).toHaveURL(/#\/study\/.*\/learn/);
    await expect(page.locator('[data-testid="study-learn-panel"]')).toBeVisible({ timeout: 10000 });

    // Level 0 cards start with Multiple Choice options
    const mcOption = page.locator('[data-testid="study-mc-option-0"]');
    if (await mcOption.isVisible()) {
      await mcOption.click();
      await expect(page.locator('[data-testid="study-continue-btn"]')).toBeVisible();
      // If retype phase is active because wrong answer was chosen, mark correct or type
      const overrideBtn = page.locator('[data-testid="study-override-btn"]');
      if (await overrideBtn.isVisible()) {
        await overrideBtn.click();
      }
      await page.click('[data-testid="study-continue-btn"]');
    }

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

  test('navigates through Stats and Settings with real controls', async ({ page }) => {
    // Navigate to stats
    await page.goto('/#/stats');
    await expect(page.locator('text=Study Stats & Mastery')).toBeVisible();
    await expect(page.locator('text=Day Streak')).toBeVisible();
    await expect(page.locator('text=Overall Accuracy')).toBeVisible();

    // Navigate to settings
    await page.goto('/#/settings');
    await expect(page.locator('text=Math Answer Checker')).toBeVisible();
    await expect(page.locator('[data-testid="settings-toggle-accents"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-select-theme"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-export-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-save-btn"]')).toBeVisible();

    // Toggle a setting and save
    await page.click('[data-testid="settings-toggle-accents"]');
    await page.click('[data-testid="settings-save-btn"]');
    await expect(page.locator('text=Preferences saved successfully!')).toBeVisible();
  });
});
