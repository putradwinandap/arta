import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { localDb } from './lib/db';

const household = { id: '11111111-1111-4111-8111-111111111111', name: 'Keluarga Arta' };
const emptyOverview = { balances: [], totals: { incomeMinor: 0, expenseMinor: 0 }, activity: [] };

beforeEach(async () => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal('crypto', { randomUUID: () => '22222222-2222-4222-8222-222222222222' });
  await localDb.captures.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App household wallet finance and capture slice', () => {
  it('shows household onboarding in a fresh browser', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /start your family finance space/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create household/i })).toBeInTheDocument();
  });

  it('creates a household and exposes quick capture immediately', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response;
      return { ok: true, json: async () => household } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fireEvent.change(await screen.findByLabelText(/household name/i), { target: { value: household.name } });
    fireEvent.click(screen.getByRole('button', { name: /create household/i }));
    expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /capture now\. classify later/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/quick capture amount/i)).toBeInTheDocument();
    expect(localStorage.getItem('arta.householdId')).toBe(household.id);
  });

  it('reopens a saved household and displays wallet balances, totals, and an empty Inbox', async () => {
    localStorage.setItem('arta.householdId', household.id);
    const wallet = { id: '33333333-3333-4333-8333-333333333333', householdId: household.id, name: 'Cash Rumah', type: 'cash', currency: 'IDR', status: 'active' };
    const overview = {
      balances: [{ walletId: wallet.id, amountMinor: 750000, currency: 'IDR' }],
      totals: { incomeMinor: 1000000, expenseMinor: 250000 },
      activity: [{ id: '44444444-4444-4444-8444-444444444444', type: 'expense', walletId: wallet.id, amountMinor: 250000, currency: 'IDR', occurredAt: new Date().toISOString(), note: 'Groceries' }],
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response;
      if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [wallet] }) } as Response;
      if (path.endsWith('/finance')) return { ok: true, json: async () => overview } as Response;
      if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response;
      throw new Error(`unexpected fetch ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: wallet.name })).toBeInTheDocument();
    expect(screen.getByText(/1 active wallet/i)).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText(/Transfers and pending captures excluded/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /0 pending review/i })).toBeInTheDocument();
  });

  it('keeps confirmed finance forms hidden until at least one active wallet exists while quick capture stays available', async () => {
    localStorage.setItem('arta.householdId', household.id);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response;
      if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [] }) } as Response;
      if (path.endsWith('/finance')) return { ok: true, json: async () => emptyOverview } as Response;
      if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response;
      throw new Error(`unexpected fetch ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    expect(await screen.findByRole('heading', { name: /no wallets yet/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /income or expense/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/quick capture amount/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });
});
