-- +goose Up
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (email = lower(btrim(email))),
    CHECK (char_length(email) BETWEEN 3 AND 320)
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email));

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX user_sessions_expires_at_idx ON user_sessions(expires_at);

ALTER TABLE household_members
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member'));

CREATE UNIQUE INDEX household_members_household_user_unique_idx
    ON household_members(household_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX household_members_user_id_idx ON household_members(user_id);

-- +goose Down
DROP INDEX household_members_user_id_idx;
DROP INDEX household_members_household_user_unique_idx;
ALTER TABLE household_members DROP COLUMN role;
ALTER TABLE household_members DROP COLUMN user_id;
DROP TABLE user_sessions;
DROP INDEX users_email_unique_idx;
DROP TABLE users;
