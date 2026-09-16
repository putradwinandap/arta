import type { FormEventHandler, Dispatch, SetStateAction } from "react";
import type {
  BudgetSummary,
  TransactionKind,
  Wallet,
  WalletType,
} from "../../../lib/api";

export type StringSetter = Dispatch<SetStateAction<string>>;
export type WalletTypeSetter = Dispatch<SetStateAction<WalletType>>;
export type TransactionKindSetter = Dispatch<SetStateAction<TransactionKind>>;
export type SubmitHandler = FormEventHandler<HTMLFormElement>;

export type TransactionFormProps = {
  budgets: BudgetSummary[];
  activeWallets: Wallet[];
  saving: boolean;
  transactionBudgetId: string;
  setTransactionBudgetId: StringSetter;
  transactionKind: TransactionKind;
  setTransactionKind: TransactionKindSetter;
  transactionWalletId: string;
  setTransactionWalletId: StringSetter;
  transactionAmount: string;
  setTransactionAmount: StringSetter;
  transactionNote: string;
  setTransactionNote: StringSetter;
  handleTransaction: SubmitHandler;
};
export type TransferFormProps = {
  activeWallets: Wallet[];
  saving: boolean;
  transferSourceId: string;
  setTransferSourceId: StringSetter;
  transferDestinationId: string;
  setTransferDestinationId: StringSetter;
  transferAmount: string;
  setTransferAmount: StringSetter;
  transferNote: string;
  setTransferNote: StringSetter;
  handleTransfer: SubmitHandler;
};
export type WalletSectionProps = {
  wallets: Wallet[];
  activeWallets: Wallet[];
  archivedWallets: Wallet[];
  balanceByWallet: Map<string, { amountMinor: number; currency: string }>;
  saving: boolean;
  walletName: string;
  setWalletName: StringSetter;
  walletType: WalletType;
  setWalletType: WalletTypeSetter;
  currency: string;
  setCurrency: StringSetter;
  editingWalletId: string | null;
  editName: string;
  setEditName: StringSetter;
  editType: WalletType;
  setEditType: WalletTypeSetter;
  handleCreateWallet: SubmitHandler;
  handleUpdateWallet: (event: Parameters<SubmitHandler>[0], walletId: string) => void;
  handleArchive: (walletId: string) => void;
  beginEdit: (wallet: Wallet) => void;
  setEditingWalletId: (value: string | null) => void;
};
