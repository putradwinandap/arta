import { useEffect, useState, type FormEvent } from "react";
import type { TransactionKind, Wallet, WalletType } from "../../../lib/api";
import { useFinancialWorkspaceActions } from "./useFinancialWorkspaceActions";
import { useFinancialWorkspaceData } from "./useFinancialWorkspaceData";

export const walletTypes: Array<{ value: WalletType; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "other", label: "Other" },
];
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.replaceAll("_", " ")
    : "Something went wrong. Please try again.";
}
export function formatMoney(amountMinor: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor);
}

export function useFinancialWorkspace() {
  const data = useFinancialWorkspaceData();
  const actions = useFinancialWorkspaceActions(data);
  const [showHouseholdManagement, setShowHouseholdManagement] = useState(false);
  const [walletName, setWalletName] = useState(""),
    [walletType, setWalletType] = useState<WalletType>("cash"),
    [currency, setCurrency] = useState("IDR");
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null),
    [editName, setEditName] = useState(""),
    [editType, setEditType] = useState<WalletType>("cash");
  const [transactionBudgetId, setTransactionBudgetId] = useState(""),
    [transactionKind, setTransactionKind] = useState<TransactionKind>("expense"),
    [transactionWalletId, setTransactionWalletId] = useState(""),
    [transactionAmount, setTransactionAmount] = useState(""),
    [transactionNote, setTransactionNote] = useState("");
  const [transferSourceId, setTransferSourceId] = useState(""),
    [transferDestinationId, setTransferDestinationId] = useState(""),
    [transferAmount, setTransferAmount] = useState(""),
    [transferNote, setTransferNote] = useState("");
  useEffect(() => {
    if (data.activeWallets.length) {
      if (!transactionWalletId) setTransactionWalletId(data.activeWallets[0].id);
      if (!transferSourceId) setTransferSourceId(data.activeWallets[0].id);
      if (!transferDestinationId && data.activeWallets.length > 1)
        setTransferDestinationId(data.activeWallets[1].id);
    }
  }, [
    data.activeWallets,
    transactionWalletId,
    transferSourceId,
    transferDestinationId,
  ]);
  const handleCreateWallet = (event: FormEvent) =>
    actions.createWallet(event, walletName, walletType, currency);
  const beginEdit = (wallet: Wallet) => {
    setEditingWalletId(wallet.id);
    setEditName(wallet.name);
    setEditType(wallet.type);
  };
  const handleUpdateWallet = (event: FormEvent, id: string) => {
    actions.updateWallet(event, id, editName, editType);
    setEditingWalletId(null);
  };
  const handleArchive = (id: string) => {
    actions.archiveWallet(id);
    setEditingWalletId(null);
  };
  const handleTransaction = (event: FormEvent) =>
    actions.createTransaction(
      event,
      transactionWalletId,
      transactionKind,
      Number(transactionAmount),
      transactionNote,
      transactionBudgetId,
    );
  const handleTransfer = (event: FormEvent) =>
    actions.createTransfer(
      event,
      transferSourceId,
      transferDestinationId,
      Number(transferAmount),
      transferNote,
    );
  return {
    ...data,
    ...actions,
    showHouseholdManagement,
    setShowHouseholdManagement,
    walletName,
    setWalletName,
    walletType,
    setWalletType,
    currency,
    setCurrency,
    editingWalletId,
    editName,
    setEditName,
    editType,
    setEditType,
    transactionBudgetId,
    setTransactionBudgetId,
    transactionKind,
    setTransactionKind,
    transactionWalletId,
    setTransactionWalletId,
    transactionAmount,
    setTransactionAmount,
    transactionNote,
    setTransactionNote,
    transferSourceId,
    setTransferSourceId,
    transferDestinationId,
    setTransferDestinationId,
    transferAmount,
    setTransferAmount,
    transferNote,
    setTransferNote,
    handleCreateWallet,
    beginEdit,
    handleUpdateWallet,
    handleArchive,
    handleTransaction,
    handleTransfer,
    setEditingWalletId,
  };
}
