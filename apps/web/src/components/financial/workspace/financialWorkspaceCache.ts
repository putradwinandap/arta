import type {
  FinanceOverview,
  Household,
  HouseholdMembership,
  Wallet,
} from "../../../lib/api";

export const HOUSEHOLD_STORAGE_KEY = "arta.householdId";
const APP_CACHE_KEY = "arta.appSnapshot";
export type AppSnapshot = {
  userId: string;
  memberships: HouseholdMembership[];
  household: Household;
  wallets: Wallet[];
  overview: FinanceOverview;
  savedAt: string;
};
export function saveSnapshot(snapshot: Omit<AppSnapshot, "savedAt">) {
  localStorage.setItem(
    APP_CACHE_KEY,
    JSON.stringify({
      ...snapshot,
      savedAt: new Date().toISOString(),
    } satisfies AppSnapshot),
  );
}
export function readSnapshot(): AppSnapshot | null {
  try {
    const snapshot = JSON.parse(
      localStorage.getItem(APP_CACHE_KEY) || "null",
    ) as AppSnapshot | null;
    return snapshot?.userId &&
      snapshot.userId === localStorage.getItem("arta.activeUserId") &&
      snapshot.household?.id &&
      snapshot.wallets &&
      snapshot.overview
      ? snapshot
      : null;
  } catch {
    return null;
  }
}
