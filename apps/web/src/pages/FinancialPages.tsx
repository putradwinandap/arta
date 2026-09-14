import { FinancialWorkspace } from '../FinancialWorkspace';

export function DashboardPage() {
  return <FinancialWorkspace view="dashboard" />;
}

export function WalletsPage() {
  return <FinancialWorkspace view="wallets" />;
}

export function TransactionsPage() {
  return <FinancialWorkspace view="transactions" />;
}
