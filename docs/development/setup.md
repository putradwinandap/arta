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

This starts PostgreSQL, applies Goose migrations, and starts the Go API at `http://localhost:8080`.

The Vite development frontend runs separately:

```bash
npm run dev:web
```

Vite listens on all interfaces. Another device on the same network can open `http://<development-machine-ip>:5173` when the local firewall allows it.

## Database tools

Install Goose and sqlc when working directly outside containers:

```bash
go install github.com/pressly/goose/v3/cmd/goose@v3.27.3
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

Then:

```bash
cd server
sqlc generate
goose -dir db/migrations postgres "$ARTA_DATABASE_URL" up
```

## Verification

```bash
npm run typecheck:web
npm run test:web
npm run build:web
cd server && go test ./... && go build ./cmd/arta
```

Playwright can be run after starting the Vite app:

```bash
npx playwright install chromium
npm run test:e2e
```

## Environment

Copy `.env.example` only when local overrides are needed. Never commit real credentials or production secrets.
