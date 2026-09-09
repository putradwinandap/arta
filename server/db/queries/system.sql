-- name: GetSystemMetadata :one
SELECT key, value, updated_at
FROM system_metadata
WHERE key = $1;
