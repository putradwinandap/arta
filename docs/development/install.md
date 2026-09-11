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

If Windows PowerShell blocks local script execution under the machine's execution policy, a one-process invocation can be used without changing the machine-wide policy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\arta.ps1 setup
powershell -ExecutionPolicy Bypass -File .\scripts\arta.ps1 start
```

### macOS / Linux / other POSIX shell

```sh
sh scripts/arta.sh setup
sh scripts/arta.sh start
```

`setup` checks Docker, checks Compose v2, checks that Docker is running, and creates `.env` with cryptographically generated PostgreSQL and session secrets. Re-running setup keeps the existing `.env` instead of replacing credentials.

The Windows launcher supports Windows PowerShell 5.1-compatible cryptographic secret generation as well as newer PowerShell runtimes.

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

If Arta was installed from a downloaded archive rather than Git, replace the application checkout with the desired version while preserving `.env`, then run `start`. Back up important data before upgrades. Arta also provides a household-scoped backup/restore workflow through its interface for supported persisted household data.

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

Ordinary `setup`, `start`, `stop`, and `update` preserve the PostgreSQL volume and existing data.

Deleting `.env` does not delete the database, but generating a new database password while an existing PostgreSQL volume remains can make that database inaccessible to the new configuration because PostgreSQL initializes the configured password when the volume is first created.

If a disposable/local installation is intentionally being reset and **all local Arta PostgreSQL data may be permanently deleted**, use the guarded `reset` command instead of manually deleting volumes.

Windows:

```powershell
.\scripts\arta.ps1 reset
```

POSIX:

```sh
sh scripts/arta.sh reset
```

`reset` is deliberately fail-closed. Before any persistent volume is removed, it displays a destructive-data warning and requires the exact, case-sensitive phrase:

```text
DELETE ALL ARTA DATA
```

Any mismatch cancels the reset without deleting data. A confirmed reset removes the local PostgreSQL volume, regenerates local credentials, and cannot be undone. If the installation contains important financial records, create and retain a verified backup before using reset.

Do not substitute `docker compose down -v` for normal Arta lifecycle commands; it bypasses Arta's explicit destructive confirmation guard.

## Smoke verification

After `start`, verify all of these succeed:

```sh
curl --fail http://127.0.0.1:8080/api/health
curl --fail http://127.0.0.1:8080/api/ready
curl --fail http://127.0.0.1:8080/
```

The repository CI performs the same self-hosted startup checks before its end-to-end browser tests.
