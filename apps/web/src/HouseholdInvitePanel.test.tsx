import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdInvitePanel } from './HouseholdInvitePanel';

describe('HouseholdInvitePanel', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('creates and copies a single-use invitation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ token: 'invite-123', householdId: 'household-1', expiresAt: '2026-09-19T00:00:00Z' }) }) as Response));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<HouseholdInvitePanel householdId="household-1" />);

    fireEvent.click(screen.getByRole('button', { name: /create invitation/i }));
    expect(await screen.findByDisplayValue('invite-123')).toBeInTheDocument();
    expect(screen.getByText(/used once and expires in 7 days/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /copy invite code/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('invite-123'));
  });

  it('shows a safe API error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: 'forbidden' }) }) as Response));
    render(<HouseholdInvitePanel householdId="household-1" />);
    fireEvent.click(screen.getByRole('button', { name: /create invitation/i }));
    expect(await screen.findByRole('status')).toHaveTextContent('forbidden');
  });
});
