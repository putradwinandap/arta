#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SERVER="$ROOT/server"
MODE="${1:-fix}"

case "$MODE" in
  fix|check) ;;
  *)
    echo "Usage: sh scripts/server-check.sh [fix|check]" >&2
    exit 2
    ;;
esac

cd "$SERVER"

if [ "$MODE" = "fix" ]; then
  echo "==> Formatting Go sources"
  gofmt -w .
else
  echo "==> Checking Go formatting"
  unformatted="$(gofmt -l .)"
  if [ -n "$unformatted" ]; then
    echo "Go files need gofmt:" >&2
    printf '%s\n' "$unformatted" >&2
    exit 1
  fi
fi

echo "==> Running Go tests"
go test ./...

echo "==> Building Arta server"
go build ./cmd/arta

echo "Server verification passed."
