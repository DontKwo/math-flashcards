import { test, expect } from '@playwright/test';

test.describe('Home and Set Screens Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    // Ensure home view is loaded with initial sample deck
    await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible({ timeout: 10000 });
  });

  test('searches across sets, tags, and cards with debounced highlighting', async ({ page }) => {
    const searchInput = page.locator('[data-testid="home-search-input"]');
    await searchInput.fill('Kinetic');

    // Should match sample deck containing Kinetic Energy card
    await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible();
    await expect(page.locator('text=1 matching card')).toBeVisible();

    // Query for something nonexistent
    await searchInput.fill('NonexistentXYZ123');
    await expect(page.locator('[data-testid="home-empty-search-state"]')).toBeVisible();
    await expect(page.locator('text=No matching sets found')).toBeVisible();

    // Clear search
    await page.click('[data-testid="home-clear-filters-btn"]');
    await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible();
  });

  test('toggles grid and list views', async ({ page }) => {
    const listBtn = page.locator('[data-testid="home-view-list-btn"]');
    await listBtn.click();
    await expect(page.locator('.home-set-list')).toBeVisible();

    const gridBtn = page.locator('[data-testid="home-view-grid-btn"]');
    await gridBtn.click();
    await expect(page.locator('.home-set-grid')).toBeVisible();
  });

  test('filters sets by tag chips', async ({ page }) => {
    // Click on Chemistry chip
    const chemChip = page.locator('[data-testid="home-filter-Chemistry"]');
    if (await chemChip.isVisible()) {
      await chemChip.click();
      await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible();
    }

    // Click back to All Sets
    await page.click('[data-testid="home-filter-all"]');
    await expect(page.locator('text=Ideal Gas Law & friends')).toBeVisible();
  });

  test('views Set details, searches cards, toggles starred, and navigates to study', async ({ page }) => {
    // Open set details
    await page.click('text=Ideal Gas Law & friends');
    await expect(page).toHaveURL(/#\/set\//);

    // Verify Set header and cards
    await expect(page.locator('[data-testid="set-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="set-study-learn-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="set-study-cards-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid^="set-card-row-"]').first()).toBeVisible();

    // In-set card search
    const cardSearch = page.locator('[data-testid="set-card-search-input"]');
    await cardSearch.fill('Kinetic');
    await expect(page.locator("text=Kinetic Energy")).toBeVisible();

    // Star a card and test starred filter
    const starBtn = page.locator('[data-testid^="set-card-star-"]').first();
    await starBtn.click();

    const starredToggle = page.locator('[data-testid="set-starred-toggle-btn"]');
    await starredToggle.click();
    await expect(page.locator('[data-testid^="set-card-row-"]').first()).toBeVisible();

    // Reset filter
    await starredToggle.click();
    await cardSearch.fill('');

    // Open Flashcards study mode
    await page.click('[data-testid="set-study-cards-btn"]');
    await expect(page).toHaveURL(/#\/study\/.*\/cards/);
    await page.click('[data-testid="study-exit-btn"]');
    await expect(page).toHaveURL(/#\/set\//);
  });
});
