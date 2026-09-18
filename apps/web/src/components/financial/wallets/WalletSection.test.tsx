import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletSection } from "./WalletSection";
import type { WalletSectionProps } from "../shared/types";

afterEach(cleanup);

describe("WalletSection", () => {
  it("links a wallet identity and balance to its transaction history", () => {
    const wallet = {
      id: "wallet-1",
      householdId: "household-1",
      name: "Cash Rumah",
      type: "cash" as const,
      currency: "IDR",
      status: "active" as const,
    };
    const props = {
      wallets: [wallet],
      activeWallets: [wallet],
      archivedWallets: [],
      balanceByWallet: new Map([[wallet.id, { amountMinor: 100000, currency: "IDR" }]]),
      saving: false,
      walletName: "",
      setWalletName: vi.fn(),
      walletType: "cash" as const,
      setWalletType: vi.fn(),
      currency: "IDR",
      setCurrency: vi.fn(),
      editingWalletId: null,
      editName: "",
      setEditName: vi.fn(),
      editType: "cash" as const,
      setEditType: vi.fn(),
      handleCreateWallet: vi.fn(),
      handleUpdateWallet: vi.fn(),
      handleArchive: vi.fn(),
      beginEdit: vi.fn(),
      setEditingWalletId: vi.fn(),
    } satisfies WalletSectionProps;
    render(<WalletSection {...props} />);
    expect(screen.getByRole("link", { name: /cash rumah/i })).toHaveAttribute(
      "href",
      `/wallets/${wallet.id}/transactions`,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
  });
});
