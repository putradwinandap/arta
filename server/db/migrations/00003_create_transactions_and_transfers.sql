-- +goose Up
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    occurred_at TIMESTAMPTZ NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX transactions_household_occurred_idx ON transactions(household_id, occurred_at DESC, id);
CREATE INDEX transactions_wallet_idx ON transactions(wallet_id);

CREATE TABLE transfers (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    source_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    destination_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    occurred_at TIMESTAMPTZ NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (source_wallet_id <> destination_wallet_id)
);

CREATE INDEX transfers_household_occurred_idx ON transfers(household_id, occurred_at DESC, id);
CREATE INDEX transfers_source_wallet_idx ON transfers(source_wallet_id);
CREATE INDEX transfers_destination_wallet_idx ON transfers(destination_wallet_id);

-- +goose Down
DROP TABLE transfers;
DROP TABLE transactions;
