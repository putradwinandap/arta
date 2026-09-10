-- +goose Up
CREATE TABLE transaction_captures (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
    kind TEXT CHECK (kind IS NULL OR kind IN ('income', 'expense')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    note TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'quick_manual' CHECK (source IN ('quick_manual')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    captured_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    confirmed_transaction_id UUID UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
    CONSTRAINT transaction_captures_confirmation_state CHECK (
        (status = 'pending' AND confirmed_at IS NULL AND confirmed_transaction_id IS NULL)
        OR
        (status = 'confirmed' AND confirmed_at IS NOT NULL AND confirmed_transaction_id IS NOT NULL AND wallet_id IS NOT NULL AND kind IS NOT NULL)
    )
);

CREATE INDEX transaction_captures_household_pending_idx
    ON transaction_captures (household_id, captured_at DESC)
    WHERE status = 'pending';

-- +goose Down
DROP TABLE transaction_captures;
