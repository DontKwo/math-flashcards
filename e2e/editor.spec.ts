import { test, expect } from '@playwright/test';

test.describe('Set Editor E2E Journey', () => {
  test('creates a set with multiple cards, bulk add, validation, and math checks', async ({ page }) => {
    await page.goto('#/create');

    const titleInput = page.getByTestId('editor-title-input');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Calculus & Geometry');

    const tagInput = page.getByTestId('editor-tag-input');
    await tagInput.fill('Analysis');
    await page.getByTestId('editor-add-tag-btn').click();
    await expect(page.locator('.editor-tag-chip', { hasText: 'analysis' })).toBeVisible();

    const initialRows = page.locator('.editor-row-card');
    const firstRow = initialRows.first();
    const termInput = firstRow.locator('textarea').first();
    await termInput.fill('Derivative of sin(x)');

    await page.getByRole('button', { name: /Math/i }).first().click();

    await page.getByTestId('editor-bulk-add-open-btn').click();
    await expect(page.getByTestId('editor-bulk-modal')).toBeVisible();

    const bulkTextarea = page.getByTestId('editor-bulk-textarea');
    await bulkTextarea.fill('Area of Circle\t\\pi r^2\nCircumference\t2\\pi r\nEuler Identity\te^{i\\pi} + 1 = 0');
    await expect(page.getByTestId('editor-bulk-preview-table')).toBeVisible();

    await page.getByTestId('editor-bulk-import-btn').click();
    await expect(page.getByTestId('editor-bulk-modal')).not.toBeVisible();

    await expect(page.locator('.editor-row-card')).toHaveCount(4);

    const testOpenBtn = page.getByTestId(/editor-test-open-/).first();
    await testOpenBtn.click();
    const testInput = page.getByTestId(/editor-test-input-/).first();
    await testInput.fill('cos(x)');
    const testRunBtn = page.getByTestId(/editor-test-run-/).first();
    await testRunBtn.click();
    await expect(page.getByTestId(/editor-test-result-/).first()).toBeVisible();

    await page.getByTestId('editor-done-btn').click();
    await expect(page).toHaveURL(/#\//);
  });
});
