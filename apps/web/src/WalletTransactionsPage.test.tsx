import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletTransactionsPage } from "./pages/WalletTransactionsPage";

const householdId = "11111111-1111-4111-8111-111111111111";
const walletId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("arta.householdId", householdId);
  window.history.pushState({}, "", `/wallets/${walletId}/transactions`);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("WalletTransactionsPage", () => {
  it("shows confirmed, transfer, and pending wallet activity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const path = String(input);
        if (path.endsWith(`/wallets/${walletId}`))
          return {
            ok: true,
            json: async () => ({
              id: walletId,
              householdId,
              name: "Cash Rumah",
              type: "cash",
              currency: "IDR",
              status: "active",
            }),
          } as Response;
        if (path.endsWith(`/wallets/${walletId}/activity`))
          return {
            ok: true,
            json: async () => ({
              activity: [
                {
                  id: "capture-1",
                  type: "pending_capture",
                  walletId,
                  amountMinor: 50000,
                  currency: "IDR",
                  occurredAt: "2026-09-18T10:00:00Z",
                  note: "Lunch",
                  status: "pending",
                },
                {
                  id: "transfer-1",
                  type: "transfer",
                  sourceWalletId: walletId,
                  destinationWalletId: "wallet-2",
                  amountMinor: 100000,
                  currency: "IDR",
                  occurredAt: "2026-09-17T10:00:00Z",
                  note: "Move",
                },
                {
                  id: "expense-1",
                  type: "expense",
                  walletId,
                  amountMinor: 25000,
                  currency: "IDR",
                  occurredAt: "2026-09-16T10:00:00Z",
                  note: "Coffee",
                },
              ],
            }),
          } as Response;
        if (path.endsWith("/finance"))
          return {
            ok: true,
            json: async () => ({
              balances: [{ walletId, amountMinor: 750000, currency: "IDR" }],
              totals: { incomeMinor: 0, expenseMinor: 0 },
              activity: [],
            }),
          } as Response;
        throw new Error(`unexpected fetch ${path}`);
      }),
    );
    render(<WalletTransactionsPage />);
    expect(
      await screen.findByRole("heading", { name: "Cash Rumah" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending capture")).toBeInTheDocument();
    expect(screen.getByText("Wallet transfer")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to wallets/i })).toHaveAttribute(
      "href",
      "/wallets",
    );
  });

  it("shows an empty state when the wallet has no activity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const path = String(input);
        if (path.endsWith(`/wallets/${walletId}`))
          return {
            ok: true,
            json: async () => ({
              id: walletId,
              householdId,
              name: "Cash Rumah",
              type: "cash",
              currency: "IDR",
              status: "active",
            }),
          } as Response;
        if (path.endsWith(`/wallets/${walletId}/activity`))
          return { ok: true, json: async () => ({ activity: [] }) } as Response;
        if (path.endsWith("/finance"))
          return {
            ok: true,
            json: async () => ({
              balances: [],
              totals: { incomeMinor: 0, expenseMinor: 0 },
              activity: [],
            }),
          } as Response;
        throw new Error(`unexpected fetch ${path}`);
      }),
    );
    render(<WalletTransactionsPage />);
    expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument();
  });
});
