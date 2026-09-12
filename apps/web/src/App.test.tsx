import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { localDb } from './lib/db';

const household = { id: '11111111-1111-4111-8111-111111111111', name: 'Keluarga Arta' };
const membership = { ...household, role: 'owner' };
const secondHousehold = { id: '55555555-5555-4555-8555-555555555555', name: 'Keluarga Kedua' };
const secondMembership = { ...secondHousehold, role: 'member' };
const emptyOverview = { balances: [], totals: { incomeMinor: 0, expenseMinor: 0 }, activity: [] };

beforeEach(async () => { localStorage.clear(); vi.restoreAllMocks(); vi.stubGlobal('crypto', { randomUUID: () => '22222222-2222-4222-8222-222222222222' }); await localDb.captures.clear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('App household wallet finance and capture slice', () => {
  it('shows unified Create Household and Join Family tabs when no membership exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { if (String(input) === '/api/auth/households') return { ok: true, json: async () => ({ households: [] }) } as Response; throw new Error(`unexpected fetch ${String(input)}`); }));
    render(<App />);
    expect(await screen.findByRole('heading', { name: /choose how to get started/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /create household/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /join family/i }));
    expect(screen.getByLabelText(/invite code/i)).toBeInTheDocument();
  });

  it('creates a household, refreshes memberships, and activates it', async () => {
    let created = false;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { const path = String(input); if (path === '/api/auth/households') return { ok: true, json: async () => ({ households: created ? [membership] : [] }) } as Response; if (path === '/api/households/') { created = true; return { ok: true, json: async () => household } as Response; } if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response; if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response; if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [] }) } as Response; if (path.endsWith('/finance')) return { ok: true, json: async () => emptyOverview } as Response; throw new Error(`unexpected fetch ${path}`); }));
    render(<App />); fireEvent.change(await screen.findByLabelText(/household name/i), { target: { value: household.name } }); fireEvent.click(screen.getByRole('button', { name: /create household/i }));
    expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument(); expect(localStorage.getItem('arta.householdId')).toBe(household.id);
  });

  it('joins a household, refreshes memberships, and activates it', async () => {
    let joined = false;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { const path = String(input); if (path === '/api/auth/households') return { ok: true, json: async () => ({ households: joined ? [membership] : [] }) } as Response; if (path === '/api/invites/redeem') { joined = true; return { ok: true, json: async () => ({ householdId: household.id }) } as Response; } if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response; if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response; if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [] }) } as Response; if (path.endsWith('/finance')) return { ok: true, json: async () => emptyOverview } as Response; throw new Error(`unexpected fetch ${path}`); }));
    render(<App />); fireEvent.click(await screen.findByRole('tab', { name: /join family/i })); fireEvent.change(screen.getByLabelText(/invite code/i), { target: { value: 'invite-token' } }); fireEvent.click(screen.getByRole('button', { name: /join household/i }));
    expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument(); expect(localStorage.getItem('arta.householdId')).toBe(household.id);
  });

  it('lets a multi-household user switch only among server memberships', async () => {
    localStorage.setItem('arta.householdId', household.id);
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { const path = String(input); if (path === '/api/auth/households') return { ok: true, json: async () => ({ households: [membership, secondMembership] }) } as Response; if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response; if (path.endsWith(`/households/${secondHousehold.id}`)) return { ok: true, json: async () => secondHousehold } as Response; if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response; if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [] }) } as Response; if (path.endsWith('/finance')) return { ok: true, json: async () => emptyOverview } as Response; throw new Error(`unexpected fetch ${path}`); }));
    render(<App />); const selector = await screen.findByLabelText(/active household/i); fireEvent.change(selector, { target: { value: secondHousehold.id } });
    expect(await screen.findByRole('heading', { name: secondHousehold.name })).toBeInTheDocument(); expect(localStorage.getItem('arta.householdId')).toBe(secondHousehold.id);
  });

  it('keeps create and join actions available to an existing household user', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { const path = String(input); if (path === '/api/auth/households') return { ok: true, json: async () => ({ households: [membership] }) } as Response; if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response; if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response; if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [] }) } as Response; if (path.endsWith('/finance')) return { ok: true, json: async () => emptyOverview } as Response; throw new Error(`unexpected fetch ${path}`); }));
    render(<App />); fireEvent.click(await screen.findByRole('button', { name: /manage households/i })); expect(screen.getByRole('tab', { name: /create household/i })).toBeInTheDocument(); expect(screen.getByRole('tab', { name: /join family/i })).toBeInTheDocument();
  });

  it('reopens a saved household and displays wallet balances, totals, and an empty Inbox', async () => {
    localStorage.setItem('arta.householdId', household.id); const wallet = { id: '33333333-3333-4333-8333-333333333333', householdId: household.id, name: 'Cash Rumah', type: 'cash', currency: 'IDR', status: 'active' }; const overview = { balances: [{ walletId: wallet.id, amountMinor: 750000, currency: 'IDR' }], totals: { incomeMinor: 1000000, expenseMinor: 250000 }, activity: [{ id: '44444444-4444-4444-8444-444444444444', type: 'expense', walletId: wallet.id, amountMinor: 250000, currency: 'IDR', occurredAt: new Date().toISOString(), note: 'Groceries' }] };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { const path = String(input); if (path === '/api/auth/households') return { ok: true, json: async () => ({ households: [membership] }) } as Response; if (path.endsWith(`/households/${household.id}`)) return { ok: true, json: async () => household } as Response; if (path.endsWith('/wallets/')) return { ok: true, json: async () => ({ wallets: [wallet] }) } as Response; if (path.endsWith('/finance')) return { ok: true, json: async () => overview } as Response; if (path.endsWith('/captures/')) return { ok: true, json: async () => ({ captures: [] }) } as Response; throw new Error(`unexpected fetch ${path}`); }));
    render(<App />); expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument(); expect(screen.getByRole('heading', { name: wallet.name })).toBeInTheDocument(); expect(screen.getByText(/1 active wallet/i)).toBeInTheDocument(); expect(screen.getByText('Groceries')).toBeInTheDocument(); expect(await screen.findByRole('heading', { name: /0 pending review/i })).toBeInTheDocument(); await waitFor(() => expect(screen.getByLabelText(/quick capture amount/i)).toBeInTheDocument());
  });
});
