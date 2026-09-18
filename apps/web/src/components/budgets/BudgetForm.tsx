import type { FormEvent } from "react";

type Props = {
  currencies: string[];
  currency: string;
  setCurrency: (value: string) => void;
  periodStart: string;
  setPeriodStart: (value: string) => void;
  periodEnd: string;
  setPeriodEnd: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  autoRenew: boolean;
  setAutoRenew: (value: boolean) => void;
  saving: boolean;
  onSubmit: (event: FormEvent) => void;
};
export function BudgetForm(props: Props) {
  return (
    <form className="stack-form" onSubmit={props.onSubmit}>
      <label>
        Currency
        <select
          aria-label="Budget currency"
          value={props.currency}
          onChange={(event) => props.setCurrency(event.target.value)}
        >
          {(props.currencies.length ? props.currencies : ["IDR"]).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Period start
        <input
          aria-label="Budget period start"
          type="date"
          value={props.periodStart}
          onChange={(event) => props.setPeriodStart(event.target.value)}
          required
        />
      </label>
      <label>
        Period end
        <input
          aria-label="Budget period end"
          type="date"
          value={props.periodEnd}
          onChange={(event) => props.setPeriodEnd(event.target.value)}
          required
        />
      </label>
      <label>
        Budget amount
        <input
          aria-label="Budget amount"
          type="number"
          min="1"
          step="1"
          value={props.amount}
          onChange={(event) => props.setAmount(event.target.value)}
          required
        />
      </label>
      <label>
        <input
          aria-label="Auto-renew budget"
          type="checkbox"
          checked={props.autoRenew}
          onChange={(event) => props.setAutoRenew(event.target.checked)}
        />{" "}
        Auto-renew monthly
      </label>
      <button disabled={props.saving}>
        {props.saving ? "Creating…" : "Create budget"}
      </button>
    </form>
  );
}
