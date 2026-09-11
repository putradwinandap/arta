#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env"

fail() {
  printf 'Arta: %s\n' "$1" >&2
  exit 1
}

require_runtime() {
  command -v docker >/dev/null 2>&1 || fail "Docker is required. Install Docker Desktop or Docker Engine first."
  docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required (the 'docker compose' command)."
  docker info >/dev/null 2>&1 || fail "Docker is installed but the daemon is not running. Start Docker and retry."
}

random_hex() {
  bytes="$1"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import secrets; print(secrets.token_hex($bytes))"
  else
    fail "OpenSSL or Python 3 is required once to generate secure local credentials."
  fi
}

ensure_env() {
  if [ -f "$ENV_FILE" ]; then
    printf 'Arta: keeping existing .env configuration.\n'
    return
  fi

  db_password=$(random_hex 24)
  session_secret=$(random_hex 32)
  umask 077
  cat > "$ENV_FILE" <<EOF
ARTA_POSTGRES_DB=arta
ARTA_POSTGRES_USER=arta
ARTA_POSTGRES_PASSWORD=$db_password
ARTA_SESSION_SECRET=$session_secret
ARTA_HTTP_PORT=8080
EOF
  printf 'Arta: created .env with generated local credentials.\n'
}

setup() {
  require_runtime
  ensure_env
  cd "$ROOT_DIR"
  docker compose config >/dev/null || fail "Generated configuration is invalid. Check .env and compose.yaml."
  printf 'Arta: setup is ready. Run: sh scripts/arta.sh start\n'
}

start() {
  require_runtime
  ensure_env
  cd "$ROOT_DIR"
  docker compose up -d --build
  port=$(awk -F= '$1 == "ARTA_HTTP_PORT" { print $2 }' "$ENV_FILE" | tail -n 1)
  [ -n "$port" ] || port=8080
  printf 'Arta: started. Open http://localhost:%s\n' "$port"
}

stop() {
  require_runtime
  cd "$ROOT_DIR"
  docker compose down
  printf 'Arta: stopped. Persistent PostgreSQL data was kept.\n'
}

status() {
  require_runtime
  cd "$ROOT_DIR"
  docker compose ps
}

update() {
  require_runtime
  if ! command -v git >/dev/null 2>&1; then
    fail "Git is required for the source-checkout update flow. Install Git or replace the checkout manually."
  fi
  cd "$ROOT_DIR"
  git diff --quiet && git diff --cached --quiet || fail "Working tree has local changes. Commit or stash them before updating."
  git pull --ff-only
  ensure_env
  docker compose up -d --build
  printf 'Arta: updated and started. Existing PostgreSQL data was preserved and migrations ran automatically.\n'
}

reset() {
  require_runtime
  confirmation_phrase='DELETE ALL ARTA DATA'

  printf '\n============================================================\n' >&2
  printf ' DANGER: DESTRUCTIVE ARTA RESET\n' >&2
  printf '============================================================\n' >&2
  printf 'This operation permanently deletes ALL local Arta PostgreSQL data.\n' >&2
  printf 'This includes wallets, transactions, budgets, goals, household data,\n' >&2
  printf 'and any other information stored in the local database.\n\n' >&2
  printf 'The database volume will be removed and local credentials regenerated.\n' >&2
  printf 'THIS CANNOT BE UNDONE.\n' >&2
  printf 'If this installation contains anything important, stop now and back it up first.\n\n' >&2
  printf 'To continue, type this exact phrase:\n  %s\n\n' "$confirmation_phrase" >&2
  printf 'Confirmation: ' >&2
  IFS= read -r confirmation

  if [ "$confirmation" != "$confirmation_phrase" ]; then
    printf 'Arta: reset cancelled. No data was deleted.\n'
    return
  fi

  printf 'Arta: destructive reset confirmed. Deleting local database volume...\n' >&2
  cd "$ROOT_DIR"
  ARTA_POSTGRES_PASSWORD="${ARTA_POSTGRES_PASSWORD:-arta-reset-placeholder}" \
    ARTA_SESSION_SECRET="${ARTA_SESSION_SECRET:-arta-reset-placeholder}" \
    docker compose down -v --remove-orphans || fail "Docker Compose could not reset Arta local data."
  rm -f "$ENV_FILE"
  ensure_env
  printf 'Arta: local data reset complete. Run: sh scripts/arta.sh start\n'
}

usage() {
  cat <<'EOF'
Usage: sh scripts/arta.sh <command>

Commands:
  setup   Check prerequisites and create secure local configuration
  start   Setup if needed, build, migrate, and start Arta
  stop    Stop Arta without deleting persistent data
  status  Show service status
  update  Fast-forward the checkout, rebuild, migrate, and restart
  reset   Permanently delete local data and regenerate credentials (requires explicit confirmation)
EOF
}

case "${1:-}" in
  setup) setup ;;
  start) start ;;
  stop) stop ;;
  status) status ;;
  update) update ;;
  reset) reset ;;
  *) usage; [ -z "${1:-}" ] || exit 2 ;;
esac
