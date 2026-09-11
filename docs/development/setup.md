# Development Setup

## Prerequisites

Contributor workflow:

- Git
- Node.js 24+
- npm
- Go 1.27+
- Docker with Compose

Normal end users should not need this toolchain. This document is for contributors.

## Install frontend dependencies

```bash
npm install
```

## Start the self-hosted technical stack

```bash
docker compose up --build
```

This starts:

- PostgreSQL with persistent storage
- Goose migrations
- the Go API server
- the built Arta PWA served by Nginx

Open:

```text
http://localhost:8080
```

Another device on the same LAN can open:

```text
http://<host-machine-ip>:8080
```

when the host firewall/network permits inbound access.

The PWA container proxies `/api/*` to the Go server internally, so the browser only needs the single exposed Arta address.

## Frontend development mode

For hot reload during frontend development:

```bash
npm run dev:web
```

Vite listens on `0.0.0.0:5173` and proxies `/api` to a Go server listening on the host at port 8080. Use this mode for development; the Docker Compose PWA on port 8080 is the first technical self-hosted path.

## Database tools

Install Goose and sqlc when working directly outside containers:

```bash
go install github.com/pressly/goose/v3/cmd/goose@v3.27.3
go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1
```

Then:

```bash
cd server
go mod tidy
sqlc generate
goose -dir db/migrations postgres "$ARTA_DATABASE_URL" up
```

## Verification

For every Go/server change, the canonical local command is:

```bash
make server-check
```

It runs `gofmt -w` first, then the server test suite and build. Run it before committing or updating a pull request. CI calls the same script in check-only mode, so bypassing the local formatter still fails remotely instead of weakening enforcement.

Frontend verification remains:

```bash
npm run typecheck:web
npm run test:web
npm run build:web
```

### Optional automatic Git guard

Contributors who want formatting to happen automatically when committing staged Go changes can enable the repository hook once:

```bash
git config core.hooksPath scripts/git-hooks
```

The hook runs the canonical server check when staged `server/*.go` changes are present and re-stages any formatting fixes. This is optional; `make server-check` remains the documented source of truth and CI remains the final safety net.

Playwright can be run after starting the Vite app:

```bash
npx playwright install chromium
npm run test:e2e
```

## Environment

Copy `.env.example` only when local overrides are needed. Never commit real credentials or production secrets.

The credentials in `compose.yaml` are development/bootstrap defaults for the local technical stack. A normal-user release must generate or guide secure deployment credentials rather than treating these defaults as production secrets.
