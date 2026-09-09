import { expect, test } from '@playwright/test';

test('creates a household and manages wallets through the self-hosted stack', async ({ page }) => {
  const householdName = `Keluarga E2E ${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /start your family finance space/i })).toBeVisible();

  await page.getByLabel(/household name/i).fill(householdName);
  await page.getByRole('button', { name: /create household/i }).click();
  await expect(page.getByRole('heading', { name: householdName })).toBeVisible();
  await expect(page.getByRole('heading', { name: /no wallets yet/i })).toBeVisible();

  await page.getByLabel('Wallet name', { exact: true }).fill('BCA Utama');
  await page.getByLabel('Type', { exact: true }).selectOption('bank');
  await page.getByLabel('Currency', { exact: true }).fill('IDR');
  await page.getByRole('button', { name: /add wallet/i }).click();
  await expect(page.getByRole('heading', { name: 'BCA Utama' })).toBeVisible();

  await page.getByLabel('Wallet name', { exact: true }).fill('Cash Rumah');
  await page.getByLabel('Type', { exact: true }).selectOption('cash');
  await page.getByRole('button', { name: /add wallet/i }).click();
  await expect(page.getByRole('heading', { name: 'Cash Rumah' })).toBeVisible();
  await expect(page.getByText(/2 active wallets/i)).toBeVisible();

  const bcaCard = page.getByRole('article').filter({ hasText: 'BCA Utama' });
  await bcaCard.getByRole('button', { name: 'Edit' }).click();
  await bcaCard.getByLabel(/wallet name/i).fill('BCA Keluarga');
  await bcaCard.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'BCA Keluarga' })).toBeVisible();

  const cashCard = page.getByRole('article').filter({ hasText: 'Cash Rumah' });
  await cashCard.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText(/1 active wallet/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cash Rumah' })).toBeVisible();
  await expect(page.getByText('Archived', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: householdName })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'BCA Keluarga' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cash Rumah' })).toBeVisible();
});
