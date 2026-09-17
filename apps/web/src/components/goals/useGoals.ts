import { useCallback, useEffect, useState } from "react";
import {
  archiveGoal,
  createGoal,
  listGoals,
  releaseGoal,
  reserveGoal,
  GoalSummary,
} from "../../lib/api";
export function useGoals(householdId: string) {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [error, setError] = useState("");
  const refresh = useCallback(
    () =>
      listGoals(householdId)
        .then(setGoals)
        .catch((e) => setError(String(e.message || e))),
    [householdId],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return {
    goals,
    error,
    setError,
    refresh,
    create: (input: { name: string; currency: string; targetAmountMinor: number }) =>
      createGoal(householdId, input),
    reserve: (id: string, input: { walletId: string; amountMinor: number }) =>
      reserveGoal(householdId, id, input),
    release: (id: string, input: { walletId: string; amountMinor: number }) =>
      releaseGoal(householdId, id, input),
    archive: (id: string) => archiveGoal(householdId, id),
  };
}
