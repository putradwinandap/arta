-- +goose Up
ALTER TABLE transaction_captures ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE transaction_captures DROP COLUMN budget_id;
