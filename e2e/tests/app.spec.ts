import { expect, test } from '@playwright/test';

test('manages wallets, transactions, and transfers through the self-hosted stack', async ({ page }) => {
  const householdName = `Keluarga E2E ${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /start your family finance space/i })).toBeVisible();

  await page.getByLabel(/household name/i).fill(householdName);
  await page.getByRole('button', { name: /create household/i }).click();
  await expect(page.getByRole('heading', { name: householdName })).toBeVisible();
  await expect(page.getByRole('heading', { name: /no wallets yet/i })).toBeVisible();

  const createPanel = page.locator('aside.create-panel');
  await createPanel.getByLabel(/wallet name/i).fill('BCA Utama');
  await createPanel.locator('select').selectOption('bank');
  await createPanel.getByLabel(/currency/i).fill('IDR');
  await createPanel.getByRole('button', { name: /add wallet/i }).click();
  await expect(page.getByRole('heading', { name: 'BCA Utama' })).toBeVisible();

  await createPanel.getByLabel(/wallet name/i).fill('Cash Rumah');
  await createPanel.locator('select').selectOption('cash');
  await createPanel.getByRole('button', { name: /add wallet/i }).click();
  await expect(page.getByRole('heading', { name: 'Cash Rumah' })).toBeVisible();
  await expect(page.getByText(/2 active wallets/i)).toBeVisible();

  await page.getByLabel('Transaction type').selectOption('income');
  await page.getByLabel('Transaction wallet').selectOption({ label: 'BCA Utama' });
  await page.getByLabel('Transaction amount').fill('1000000');
  await page.getByLabel('Transaction note').fill('Salary');
  await page.getByRole('button', { name: /record income/i }).click();
  await expect(page.getByText('Salary')).toBeVisible();

  await page.getByLabel('Transaction type').selectOption('expense');
  await page.getByLabel('Transaction amount').fill('250000');
  await page.getByLabel('Transaction note').fill('Groceries');
  await page.getByRole('button', { name: /record expense/i }).click();
  await expect(page.getByText('Groceries')).toBeVisible();

  await page.getByLabel('Transfer source').selectOption({ label: 'BCA Utama' });
  await page.getByLabel('Transfer destination').selectOption({ label: 'Cash Rumah' });
  await page.getByLabel('Transfer amount').fill('300000');
  await page.getByLabel('Transfer note').fill('Cash allocation');
  await page.getByRole('button', { name: /transfer money/i }).click();
  await expect(page.getByText('Cash allocation')).toBeVisible();

  const bcaCardBeforeEdit = page.locator('article.wallet-card').filter({ hasText: 'BCA Utama' });
  const cashCardBeforeArchive = page.locator('article.wallet-card').filter({ hasText: 'Cash Rumah' });
  await expect(bcaCardBeforeEdit).toContainText('450.000');
  await expect(cashCardBeforeArchive).toContainText('300.000');
  await expect(page.getByText(/Transfers excluded/i)).toBeVisible();

  await bcaCardBeforeEdit.getByRole('button', { name: 'Edit' }).click();
  const editForm = page.locator('form.edit-form');
  await editForm.getByLabel(/wallet name/i).fill('BCA Keluarga');
  await editForm.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'BCA Keluarga' })).toBeVisible();

  const cashCard = page.locator('article.wallet-card').filter({ hasText: 'Cash Rumah' });
  await cashCard.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText(/1 active wallet/i)).toBeVisible();
  await expect(page.locator('article.wallet-card').filter({ hasText: 'Cash Rumah' }).getByText('Archived', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: householdName })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'BCA Keluarga' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cash Rumah' })).toBeVisible();
  await expect(page.getByText('Cash allocation')).toBeVisible();
});
