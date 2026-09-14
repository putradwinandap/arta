import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdOverview } from './HouseholdOverviewMount';

const householdId = '11111111-1111-4111-8111-111111111111';
const wallet = { id: '33333333-3333-4333-8333-333333333333', householdId, name: 'Cash Rumah', type: 'cash', currency: 'IDR', status: 'active' };

beforeEach(() => { localStorage.clear(); localStorage.setItem('arta.householdId', householdId); vi.restoreAllMocks(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function stubDashboard(overrides: Record<string, unknown> = {}) {
  const overview = { balances: [{ walletId: wallet.id, amountMinor: 750000, reservedMinor: 100000, availableMinor: 650000, currency: 'IDR' }], totals: { incomeMinor: 1000000, expenseMinor: 250000 }, activity: [{ id: 'activity-1', type: 'expense', walletId: wallet.id, amountMinor: 250000, currency: 'IDR', occurredAt: new Date().toISOString(), note: 'Groceries' }], currentBudgets: [{ id: 'budget-1', householdId, currency: 'IDR', periodStart: '2026-09-01', periodEnd: '2026-09-30', amountMinor: 500000, spentMinor: 250000, remainingMinor: 250000 }], activeGoals: [{ id: 'goal-1', householdId, name: 'Emergency fund', currency: 'IDR', targetAmountMinor: 1000000, status: 'active', reservedMinor: 100000, remainingMinor: 900000 }], ...overrides };
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input);
    if (path.endsWith('/finance')) return { ok: true, json: async () => overview } as Response;
    if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [wallet] }) } as Response;
    if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [{ id: 'capture-1', householdId, amountMinor: 50000, status: 'pending' }] }) } as Response;
    if (path.endsWith('/reconciliations/')) return { ok: true, json: async () => ({ reconciliations: [] }) } as Response;
    throw new Error(`unexpected fetch ${path}`);
  }));
}

describe('Dashboard overview', () => {
  it('shows trusted balance distinctions and summary links', async () => {
    stubDashboard(); render(<HouseholdOverview householdId={householdId} />);
    expect(await screen.findByRole('heading', { name: /your financial position/i })).toBeInTheDocument();
    expect(screen.getByText(/physical · reserved/i)).toBeInTheDocument();
    expect(screen.getByText(/1 pending review/i)).toBeInTheDocument();
    expect(screen.getByText('Emergency fund')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage budgets/i })).toHaveAttribute('href', '/budgets');
  });

  it('keeps empty financial states useful', async () => {
    stubDashboard({ balances: [], currentBudgets: [], activeGoals: [], activity: [] }); render(<HouseholdOverview householdId={householdId} />);
    expect(await screen.findByRole('heading', { name: /start your household overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add a wallet/i })).toHaveAttribute('href', '/wallets');
    expect(screen.getByText(/no budget covers today/i)).toBeInTheDocument();
    expect(screen.getByText(/no active financial goals yet/i)).toBeInTheDocument();
  });

  it('shows an error state when required overview data fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); })); render(<HouseholdOverview householdId={householdId} />);
    expect(await screen.findByText(/unable to load dashboard/i)).toBeInTheDocument();
  });
});
