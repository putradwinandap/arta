-- +goose Up
CREATE TABLE balance_adjustments (
    id uuid PRIMARY KEY,
    household_id uuid NOT NULL REFERENCES households(id),
    wallet_id uuid NOT NULL REFERENCES wallets(id),
    amount_minor bigint NOT NULL CHECK (amount_minor <> 0),
    currency char(3) NOT NULL CHECK (currency = upper(currency)),
    reason text NOT NULL CHECK (length(trim(reason)) > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX balance_adjustments_wallet_idx ON balance_adjustments(household_id, wallet_id, created_at);

CREATE TABLE wallet_reconciliations (
    id uuid PRIMARY KEY,
    household_id uuid NOT NULL REFERENCES households(id),
    wallet_id uuid NOT NULL REFERENCES wallets(id),
    currency char(3) NOT NULL CHECK (currency = upper(currency)),
    expected_amount_minor bigint NOT NULL,
    observed_amount_minor bigint NOT NULL,
    discrepancy_minor bigint NOT NULL,
    status text NOT NULL CHECK (status IN ('unresolved', 'reconciled')),
    adjustment_id uuid REFERENCES balance_adjustments(id),
    observed_at timestamptz NOT NULL,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (discrepancy_minor = observed_amount_minor - expected_amount_minor),
    CHECK ((status = 'unresolved' AND discrepancy_minor <> 0 AND resolved_at IS NULL AND adjustment_id IS NULL)
        OR (status = 'reconciled' AND resolved_at IS NOT NULL))
);

CREATE INDEX wallet_reconciliations_wallet_idx ON wallet_reconciliations(household_id, wallet_id, observed_at DESC);

-- +goose Down
DROP TABLE wallet_reconciliations;
DROP TABLE balance_adjustments;
