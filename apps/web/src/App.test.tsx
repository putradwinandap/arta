import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('./lib/db', () => ({
  localDb: { open: () => Promise.resolve() }
}));

describe('App', () => {
  it('renders the Arta foundation', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /capture now, classify later/i })).toBeInTheDocument();
    expect(await screen.findByText('Local storage ready')).toBeInTheDocument();
  });
});
