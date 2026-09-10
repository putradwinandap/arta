export type Household = { id: string; name: string };
export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'other';
export type WalletStatus = 'active' | 'archived';
export type TransactionKind = 'income' | 'expense';
export type CaptureStatus = 'pending' | 'confirmed';

export type Wallet = { id: string; householdId: string; name: string; type: WalletType; currency: string; status: WalletStatus; archivedAt?: string };
export type WalletBalance = { walletId: string; amountMinor: number; currency: string };
export type Activity = { id: string; type: TransactionKind | 'transfer'; walletId?: string; sourceWalletId?: string; destinationWalletId?: string; amountMinor: number; currency: string; occurredAt: string; note?: string };
export type TransactionCapture = { id: string; householdId: string; walletId?: string; kind?: TransactionKind; amountMinor: number; note?: string; source: 'quick_manual'; status: CaptureStatus; capturedAt: string; updatedAt: string; confirmedAt?: string; confirmedTransactionId?: string };
export type FinanceOverview = { balances: WalletBalance[]; totals: { incomeMinor: number; expenseMinor: number }; activity: Activity[] };
export type BudgetSummary = { id: string; householdId: string; currency: string; periodStart: string; periodEnd: string; amountMinor: number; spentMinor: number; remainingMinor: number };

type ApiErrorBody = { error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    let code = `http_${response.status}`;
    try { const body = (await response.json()) as ApiErrorBody; code = body.error || code; } catch { /* status fallback */ }
    throw new Error(code);
  }
  return response.json() as Promise<T>;
}

export function createHousehold(name: string, ownerSubjectId: string) { return request<Household>('/api/households/', { method: 'POST', body: JSON.stringify({ name, ownerSubjectId }) }); }
export function getHousehold(householdId: string) { return request<Household>(`/api/households/${householdId}`); }
export async function listWallets(householdId: string) { return (await request<{ wallets: Wallet[] }>(`/api/households/${householdId}/wallets/`)).wallets; }
export function createWallet(householdId: string, input: { name: string; type: WalletType; currency: string }) { return request<Wallet>(`/api/households/${householdId}/wallets/`, { method: 'POST', body: JSON.stringify(input) }); }
export function updateWallet(householdId: string, walletId: string, input: { name: string; type: WalletType }) { return request<Wallet>(`/api/households/${householdId}/wallets/${walletId}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function archiveWallet(householdId: string, walletId: string) { return request<Wallet>(`/api/households/${householdId}/wallets/${walletId}/archive`, { method: 'POST' }); }
export function createTransaction(householdId: string, input: { walletId: string; kind: TransactionKind; amountMinor: number; note?: string }) { return request(`/api/households/${householdId}/transactions`, { method: 'POST', body: JSON.stringify(input) }); }
export function createTransfer(householdId: string, input: { sourceWalletId: string; destinationWalletId: string; amountMinor: number; note?: string }) { return request(`/api/households/${householdId}/transfers`, { method: 'POST', body: JSON.stringify(input) }); }
export function getFinanceOverview(householdId: string) { return request<FinanceOverview>(`/api/households/${householdId}/finance`); }
export function createCapture(householdId: string, input: { id: string; amountMinor: number; note?: string; capturedAt?: string }) { return request<TransactionCapture>(`/api/households/${householdId}/captures/`, { method: 'POST', body: JSON.stringify(input) }); }
export async function listPendingCaptures(householdId: string) { return (await request<{ captures: TransactionCapture[] }>(`/api/households/${householdId}/captures/`)).captures; }
export function reviewCapture(householdId: string, captureId: string, input: { walletId: string; kind: TransactionKind; amountMinor: number; note?: string }) { return request<TransactionCapture>(`/api/households/${householdId}/captures/${captureId}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function confirmCapture(householdId: string, captureId: string) { return request(`/api/households/${householdId}/captures/${captureId}/confirm`, { method: 'POST' }); }
export function createBudget(householdId: string, input: { currency: string; periodStart: string; periodEnd: string; amountMinor: number }) { return request<BudgetSummary>(`/api/households/${householdId}/budgets/`, { method: 'POST', body: JSON.stringify(input) }); }
export async function listBudgets(householdId: string) { return (await request<{ budgets: BudgetSummary[] }>(`/api/households/${householdId}/budgets/`)).budgets; }
export function getBudget(householdId: string, budgetId: string) { return request<BudgetSummary>(`/api/households/${householdId}/budgets/${budgetId}`); }
