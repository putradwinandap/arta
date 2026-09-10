-- +goose Up
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    target_amount_minor BIGINT NOT NULL CHECK (target_amount_minor > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((status = 'active' AND archived_at IS NULL) OR (status = 'archived' AND archived_at IS NOT NULL))
);

CREATE TABLE goal_reservation_events (
    id UUID PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE RESTRICT,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    kind TEXT NOT NULL CHECK (kind IN ('reserve', 'release')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX financial_goals_household_idx ON financial_goals (household_id, status, created_at);
CREATE INDEX goal_reservation_events_goal_idx ON goal_reservation_events (goal_id, wallet_id, created_at);
CREATE INDEX goal_reservation_events_wallet_idx ON goal_reservation_events (household_id, wallet_id, created_at);

-- +goose Down
DROP TABLE goal_reservation_events;
DROP TABLE financial_goals;
