-- +goose Up
ALTER TABLE transactions
    ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;

CREATE INDEX transactions_budget_idx ON transactions(budget_id);

-- +goose Down
DROP INDEX transactions_budget_idx;
ALTER TABLE transactions DROP COLUMN budget_id;
