import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TransactionFormProps, TransferFormProps } from "../shared/types";
import { TransactionForm } from "./TransactionForm";
import { TransferForm } from "./TransferForm";

afterEach(cleanup);

const wallet = (id: string, currency = "IDR") => ({
  id,
  householdId: "household",
  name: id,
  type: "bank" as const,
  currency,
  status: "active" as const,
});

function transactionProps(): TransactionFormProps {
  return {
    budgets: [
      {
        id: "idr-budget",
        householdId: "household",
        currency: "IDR",
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        amountMinor: 100000,
        spentMinor: 0,
        remainingMinor: 100000,
        autoRenew: false,
      },
      {
        id: "usd-budget",
        householdId: "household",
        currency: "USD",
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        amountMinor: 100,
        spentMinor: 0,
        remainingMinor: 100,
        autoRenew: false,
      },
    ],
    activeWallets: [wallet("Main")],
    saving: false,
    transactionBudgetId: "",
    setTransactionBudgetId: vi.fn(),
    transactionKind: "expense",
    setTransactionKind: vi.fn(),
    transactionWalletId: "Main",
    setTransactionWalletId: vi.fn(),
    transactionAmount: "",
    setTransactionAmount: vi.fn(),
    transactionNote: "",
    setTransactionNote: vi.fn(),
    handleTransaction: vi.fn((event) => event.preventDefault()),
  };
}

describe("financial transaction forms", () => {
  it("shows only budgets matching the selected wallet currency", () => {
    render(<TransactionForm {...transactionProps()} />);

    expect(
      screen.getByRole("option", { name: /2026-01-01.*IDR/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /2026-01-01.*USD/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the transfer empty state when fewer than two wallets are active", () => {
    const props: TransferFormProps = {
      activeWallets: [wallet("Main")],
      saving: false,
      transferSourceId: "Main",
      setTransferSourceId: vi.fn(),
      transferDestinationId: "",
      setTransferDestinationId: vi.fn(),
      transferAmount: "",
      setTransferAmount: vi.fn(),
      transferNote: "",
      setTransferNote: vi.fn(),
      handleTransfer: vi.fn(),
    };

    render(<TransferForm {...props} />);

    expect(screen.getByText(/add another active wallet/i)).toBeInTheDocument();
  });

  it("submits the transaction form through its typed callback", () => {
    const props = transactionProps();
    render(<TransactionForm {...props} />);

    fireEvent.submit(screen.getByRole("button", { name: /record expense/i }));

    expect(props.handleTransaction).toHaveBeenCalledOnce();
  });
});
