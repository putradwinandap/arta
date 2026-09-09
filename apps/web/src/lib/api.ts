export type Household = {
  id: string;
  name: string;
};

export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'other';
export type WalletStatus = 'active' | 'archived';

export type Wallet = {
  id: string;
  householdId: string;
  name: string;
  type: WalletType;
  currency: string;
  status: WalletStatus;
  archivedAt?: string;
};

type ApiErrorBody = { error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let code = `http_${response.status}`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      code = body.error || code;
    } catch {
      // Keep the status-based fallback when the response is not JSON.
    }
    throw new Error(code);
  }

  return response.json() as Promise<T>;
}

export function createHousehold(name: string, ownerSubjectId: string) {
  return request<Household>('/api/households/', {
    method: 'POST',
    body: JSON.stringify({ name, ownerSubjectId }),
  });
}

export function getHousehold(householdId: string) {
  return request<Household>(`/api/households/${householdId}`);
}

export async function listWallets(householdId: string) {
  const response = await request<{ wallets: Wallet[] }>(`/api/households/${householdId}/wallets/`);
  return response.wallets;
}

export function createWallet(householdId: string, input: { name: string; type: WalletType; currency: string }) {
  return request<Wallet>(`/api/households/${householdId}/wallets/`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateWallet(householdId: string, walletId: string, input: { name: string; type: WalletType }) {
  return request<Wallet>(`/api/households/${householdId}/wallets/${walletId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveWallet(householdId: string, walletId: string) {
  return request<Wallet>(`/api/households/${householdId}/wallets/${walletId}/archive`, {
    method: 'POST',
  });
}
