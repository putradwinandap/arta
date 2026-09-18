import { useEffect, useState } from "react";
import { HouseholdOverview } from "./components/overview/HouseholdOverview";
import { useHouseholdOverview } from "./components/overview/useHouseholdOverview";

export function HouseholdOverviewMount() {
  const [householdId, setHouseholdId] = useState(
    localStorage.getItem("arta.householdId") || "",
  );
  useEffect(() => {
    const timer = setInterval(
      () => setHouseholdId(localStorage.getItem("arta.householdId") || ""),
      500,
    );
    return () => clearInterval(timer);
  }, []);
  if (!householdId) return null;
  return <HouseholdOverviewPage householdId={householdId} />;
}

export function HouseholdOverviewPage({ householdId }: { householdId: string }) {
  const state = useHouseholdOverview(householdId);
  if (state.error)
    return (
      <main className="app-shell">
        <section className="panel">
          <p className="error" role="alert">
            Unable to load dashboard: {state.error}
          </p>
          <button type="button" onClick={() => void state.refresh()}>
            Retry
          </button>
        </section>
      </main>
    );
  if (!state.overview)
    return (
      <main className="app-shell">
        <section className="panel" role="status" aria-live="polite">
          <p className="muted">Loading household overview…</p>
        </section>
      </main>
    );
  return (
    <HouseholdOverview
      overview={state.overview}
      names={state.names}
      pending={state.pending}
      reconciliations={state.reconciliations}
    />
  );
}

export { HouseholdOverviewPage as HouseholdOverview };
