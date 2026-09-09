import { expect, test } from '@playwright/test';

test('shows Arta foundation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /capture now, classify later/i })).toBeVisible();
});
