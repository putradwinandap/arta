# Self-hosted installation

This is the supported MVP installation path for a normal technical user. Contributors should use `docs/development/setup.md` instead.

## Supported target

The first supported target is a local or self-hosted machine with:

- Docker Desktop, or Docker Engine with Docker Compose v2
- enough permission to run Docker containers
- a free local TCP port (8080 by default)

Node.js, Go, PostgreSQL, Goose, and sqlc do **not** need to be installed on the host. Arta runs those application/runtime pieces inside containers.

## Fresh install

Clone or download the Arta source checkout. From its root, run one launcher for your platform.

### Windows PowerShell

```powershell
.\scripts\arta.ps1 setup
.\scripts\arta.ps1 start
```

### macOS / Linux / other POSIX shell

```sh
sh scripts/arta.sh setup
sh scripts/arta.sh start
```

`setup` checks Docker, checks Compose v2, checks that Docker is running, and creates `.env` with cryptographically generated PostgreSQL and session secrets. Re-running setup keeps the existing `.env` instead of replacing credentials.

`start` builds the application, starts PostgreSQL, runs all pending database migrations, starts the API, and serves the Arta web application. Open `http://localhost:8080` unless `ARTA_HTTP_PORT` was changed in `.env`.

## Stop and status

Windows:

```powershell
.\scripts\arta.ps1 status
.\scripts\arta.ps1 stop
```

POSIX:

```sh
sh scripts/arta.sh status
sh scripts/arta.sh stop
```

Stopping Arta does not delete the PostgreSQL volume. Do not use `docker compose down -v` for ordinary shutdown because `-v` deletes persistent database storage.

## Update

For a Git source checkout with no uncommitted local changes:

Windows:

```powershell
.\scripts\arta.ps1 update
```

POSIX:

```sh
sh scripts/arta.sh update
```

The update command refuses to proceed with a dirty Git working tree, performs a fast-forward-only pull, keeps the existing `.env` and PostgreSQL volume, rebuilds containers, runs pending migrations, and restarts Arta.

If Arta was installed from a downloaded archive rather than Git, replace the application checkout with the desired version while preserving `.env`, then run `start`. Back up important data before upgrades; the UI backup/restore workflow is tracked separately in Issue #22.

## Configuration

The launcher creates these values in the ignored `.env` file:

- `ARTA_POSTGRES_DB`
- `ARTA_POSTGRES_USER`
- `ARTA_POSTGRES_PASSWORD`
- `ARTA_SESSION_SECRET`
- `ARTA_HTTP_PORT`

`.env.example` documents the supported keys. Never commit a generated `.env`.

If port 8080 is already used, change `ARTA_HTTP_PORT` before starting Arta.

## Recovery and destructive operations

The installer/launcher never removes the PostgreSQL volume. Ordinary `setup`, `start`, `stop`, and `update` are designed to preserve existing data.

Deleting `.env` does not delete the database, but generating a new database password while an existing PostgreSQL volume remains can make the existing database inaccessible to the new configuration. Preserve `.env` together with the deployment until a first-class backup/restore workflow is available.

## Smoke verification

After `start`, verify all of these succeed:

```sh
curl --fail http://127.0.0.1:8080/api/health
curl --fail http://127.0.0.1:8080/api/ready
curl --fail http://127.0.0.1:8080/
```

The repository CI performs the same self-hosted startup checks before its end-to-end browser tests.
