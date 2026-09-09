-- +goose Up
CREATE TABLE system_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_metadata (key, value) VALUES ('schema_initialized', 'true');

-- +goose Down
DROP TABLE system_metadata;
