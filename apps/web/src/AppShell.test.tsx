import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
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
});
