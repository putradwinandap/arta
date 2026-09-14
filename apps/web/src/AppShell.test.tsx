import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  afterEach(cleanup);
  it('exposes the primary destinations and account control', () => {
    render(<AppShell email="family@example.com" offline={false} onLogout={vi.fn()}><p>content</p></AppShell>);
    expect(screen.getAllByRole('link', { name: 'Dashboard' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Transactions & Inbox' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Budgets' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Log out' })).toHaveLength(1);
    expect(screen.getByText('family@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Budgets' })).toHaveAttribute('href', '/budgets');
    fireEvent.click(screen.getByRole('link', { name: 'Budgets' }));
    expect(screen.getByRole('link', { name: 'Budgets' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the mobile menu and closes it after navigation', () => {
    render(<AppShell email="family@example.com" offline={false} onLogout={vi.fn()}><p>content</p></AppShell>);
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getAllByRole('link', { name: 'Budgets' }).at(-1)!);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the active destination in sync with browser history', () => {
    window.history.pushState({}, '', '/wallets');
    render(<AppShell email="family@example.com" offline={false} onLogout={vi.fn()}><p>content</p></AppShell>);
    expect(screen.getByRole('link', { name: 'Wallets' })).toHaveAttribute('aria-current', 'page');
    window.history.pushState({}, '', '/transactions');
    fireEvent(window, new PopStateEvent('popstate'));
    expect(screen.getByRole('link', { name: 'Transactions & Inbox' })).toHaveAttribute('aria-current', 'page');
  });
});
