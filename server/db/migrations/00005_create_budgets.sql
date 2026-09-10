-- +goose Up
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (period_start <= period_end)
);

CREATE INDEX budgets_household_period_idx
    ON budgets(household_id, currency, period_start, period_end);

-- +goose Down
DROP TABLE budgets;
