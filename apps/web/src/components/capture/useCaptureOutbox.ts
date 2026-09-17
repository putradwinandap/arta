import { useCallback, useEffect, useState } from "react";
import { createCapture } from "../../lib/api";
import { localDb } from "../../lib/db";
import {
  captureApiPayload,
  errorMessage,
  isUnauthenticated,
} from "./captureFormatters";

export function useCaptureOutbox(
  householdId: string,
  refreshInbox: () => Promise<void>,
  onError: (error: unknown) => void,
) {
  const [localPendingCount, setLocalPendingCount] = useState(0);

  const refreshLocalPendingCount = useCallback(async () => {
    const count = await localDb.captures
      .where("householdId")
      .equals(householdId)
      .count();
    setLocalPendingCount(count);
  }, [householdId]);

  const syncLocalCaptures = useCallback(async () => {
    const localCaptures = await localDb.captures
      .where("householdId")
      .equals(householdId)
      .toArray();
    let syncedAny = false;
    for (const item of localCaptures) {
      try {
        await createCapture(householdId, captureApiPayload(item));
        await localDb.captures.delete(item.id);
        syncedAny = true;
      } catch (error) {
        if (isUnauthenticated(error)) return;
        await localDb.captures.update(item.id, { syncStatus: "failed" });
      }
    }
    await refreshLocalPendingCount();
    if (syncedAny) await refreshInbox();
  }, [householdId, refreshInbox, refreshLocalPendingCount]);

  useEffect(() => {
    void refreshLocalPendingCount().catch(onError);
    void syncLocalCaptures().catch((error) => onError(errorMessage(error)));

    function handleOnline() {
      void syncLocalCaptures();
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void syncLocalCaptures();
    }
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onError, refreshLocalPendingCount, syncLocalCaptures]);

  return { localPendingCount, refreshLocalPendingCount };
}
