import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const household = { id: '11111111-1111-4111-8111-111111111111', name: 'Keluarga Arta' };

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal('crypto', { randomUUID: () => '22222222-2222-4222-8222-222222222222' });
});

describe('App household and wallet slice', () => {
  it('shows household onboarding in a fresh browser', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /start your family finance space/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create household/i })).toBeInTheDocument();
  });

  it('creates a household and shows the wallet empty state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => household,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(await screen.findByLabelText(/household name/i), { target: { value: household.name } });
    fireEvent.click(screen.getByRole('button', { name: /create household/i }));

    expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no wallets yet/i })).toBeInTheDocument();
    expect(localStorage.getItem('arta.householdId')).toBe(household.id);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('reopens a saved household and displays wallets', async () => {
    localStorage.setItem('arta.householdId', household.id);
    const wallet = {
      id: '33333333-3333-4333-8333-333333333333',
      householdId: household.id,
      name: 'Cash Rumah',
      type: 'cash',
      currency: 'IDR',
      status: 'active',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => household })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ wallets: [wallet] }) });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('heading', { name: household.name })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: wallet.name })).toBeInTheDocument();
    expect(screen.getByText(/1 active wallet/i)).toBeInTheDocument();
  });
});
