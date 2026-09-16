import type { Household, HouseholdMembership } from "../../../lib/api";

export function FinancialHeader({ household, memberships, activeWalletCount, switching, showManagement, onSwitch, onToggleManagement }: {
  household: Household;
  memberships: HouseholdMembership[];
  activeWalletCount: number;
  switching: boolean;
  showManagement: boolean;
  onSwitch: (id: string) => void;
  onToggleManagement: () => void;
}) {
  return <header className="topbar">
    <div><p className="eyebrow">Arta household</p><h1>{household.name}</h1><p className="muted">Capture quickly, review later, and keep confirmed money trustworthy.</p></div>
    <div className="household-controls">
      {memberships.length > 1 && <label className="household-switcher">Active household<select aria-label="Active household" value={household.id} disabled={switching} onChange={(event) => onSwitch(event.target.value)}>{memberships.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</select></label>}
      <button type="button" className="secondary" onClick={onToggleManagement}>{showManagement ? "Close household management" : "Manage households"}</button>
      <div className="summary-chip">{activeWalletCount} active wallet{activeWalletCount === 1 ? "" : "s"}</div>
    </div>
  </header>;
}
