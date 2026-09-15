-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE budgets
  ADD COLUMN auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN cadence TEXT,
  ADD COLUMN renewed_from_id UUID UNIQUE REFERENCES budgets(id) ON DELETE RESTRICT,
  ADD CONSTRAINT budgets_cadence_check CHECK (cadence IS NULL OR cadence IN ('monthly')),
  ADD CONSTRAINT budgets_auto_renew_cadence_check CHECK (auto_renew = FALSE OR cadence IS NOT NULL);

-- +goose Down
ALTER TABLE budgets DROP CONSTRAINT budgets_auto_renew_cadence_check;
ALTER TABLE budgets DROP CONSTRAINT budgets_cadence_check;
ALTER TABLE budgets DROP COLUMN renewed_from_id, DROP COLUMN cadence, DROP COLUMN auto_renew;
