import { expect, test } from '@playwright/test';

test('registers, captures, budgets, reviews, and keeps confirmed finance trustworthy', async ({ page }) => {
  const suffix = Date.now();
  const householdName = `Keluarga E2E ${suffix}`;
  const email = `e2e-${suffix}@example.test`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await page.getByRole('button', { name: /need an account.*register/i }).click();
  await expect(page.getByRole('heading', { name: /create your arta account/i })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('correct horse battery staple');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByText(new RegExp(`Signed in as ${email}`, 'i'))).toBeVisible();

  await expect(page.getByRole('heading', { name: /start your family finance space/i })).toBeVisible();
  await page.getByLabel(/household name/i).fill(householdName);
  await page.getByRole('button', { name: /create household/i }).click();
  await expect(page.getByRole('heading', { name: householdName })).toBeVisible();

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

  await expect(page.getByRole('heading', { name: /plan a period/i })).toBeVisible();
  await page.getByLabel('Budget amount').fill('500000');
  await page.getByRole('button', { name: /create budget/i }).click();
  await expect(page.locator('article.budget-card')).toContainText('500.000');
  await expect(page.locator('article.budget-card')).toContainText('Spent');

  await page.getByLabel('Quick capture amount').fill('25000');
  await page.getByLabel('Quick capture note').fill('Coffee');
  await page.getByRole('button', { name: /^capture$/i }).click();
  await expect(page.getByText('Coffee')).toBeVisible();
  await expect(page.getByRole('heading', { name: /1 pending review/i })).toBeVisible();
  await page.getByRole('button', { name: /refresh spending/i }).click();
  await expect(page.locator('article.budget-card')).toContainText(/Spent Rp\s*0/);

  const inboxItem = page.locator('article.inbox-item').filter({ hasText: 'Coffee' });
  await inboxItem.getByRole('button', { name: 'Review' }).click();
  await page.getByLabel('Review transaction type').selectOption('expense');
  await page.getByLabel('Review wallet').selectOption({ label: 'BCA Utama' });
  await page.getByRole('button', { name: /save review/i }).click();
  await inboxItem.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('heading', { name: /0 pending review/i })).toBeVisible();
  await expect(page.locator('article.activity-row').filter({ hasText: 'Coffee' })).toBeVisible();

  await page.getByLabel('Transaction type').selectOption('income');
  await page.getByLabel('Transaction wallet').selectOption({ label: 'BCA Utama' });
  await page.getByLabel('Transaction amount').fill('1000000');
  await page.getByLabel('Transaction note').fill('Salary');
  await page.getByRole('button', { name: /record income/i }).click();
  await expect(page.locator('article.activity-row').filter({ hasText: 'Salary' })).toBeVisible();

  await page.getByLabel('Transaction type').selectOption('expense');
  await page.getByLabel('Transaction amount').fill('250000');
  await page.getByLabel('Transaction note').fill('Groceries');
  await page.getByRole('button', { name: /record expense/i }).click();
  await expect(page.locator('article.activity-row').filter({ hasText: 'Groceries' })).toBeVisible();

  await page.getByLabel('Transfer source').selectOption({ label: 'BCA Utama' });
  await page.getByLabel('Transfer destination').selectOption({ label: 'Cash Rumah' });
  await page.getByLabel('Transfer amount').fill('300000');
  await page.getByLabel('Transfer note').fill('Cash allocation');
  await page.getByRole('button', { name: /transfer money/i }).click();
  await expect(page.locator('article.activity-row').filter({ hasText: 'Cash allocation' })).toBeVisible();

  await page.getByRole('button', { name: /refresh spending/i }).click();
  const budget = page.locator('article.budget-card');
  await expect(budget).toContainText('275.000');
  await expect(budget).toContainText('225.000');

  const bcaCard = page.locator('article.wallet-card').filter({ hasText: 'BCA Utama' });
  const cashCard = page.locator('article.wallet-card').filter({ hasText: 'Cash Rumah' });
  await expect(bcaCard).toContainText('425.000');
  await expect(cashCard).toContainText('300.000');
  await expect(page.getByText(/Transfers and pending captures excluded/i)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: householdName })).toBeVisible();
  await expect(page.getByRole('heading', { name: /0 pending review/i })).toBeVisible();
  await expect(page.locator('article.budget-card')).toContainText('275.000');
  await expect(page.locator('article.activity-row').filter({ hasText: 'Coffee' })).toBeVisible();
  await expect(page.locator('article.activity-row').filter({ hasText: 'Cash allocation' })).toBeVisible();

  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});
