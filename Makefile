.PHONY: dev-up dev-down web-install web-dev web-test web-build server-format server-check server-ci server-test server-build generate migrate-up

ifeq ($(OS),Windows_NT)
SERVER_CHECK = powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/server-check.ps1
else
SERVER_CHECK = sh scripts/server-check.sh
endif

dev-up:
	docker compose up --build

dev-down:
	docker compose down

web-install:
	npm install

web-dev:
	npm run dev:web

web-test:
	npm run test:web

web-build:
	npm run build:web

server-format:
	$(SERVER_CHECK) fix

server-check:
	$(SERVER_CHECK) fix

server-ci:
	$(SERVER_CHECK) check

server-test:
	cd server && go test ./...

server-build:
	cd server && go build ./cmd/arta

generate:
	cd server && sqlc generate

migrate-up:
	cd server && goose -dir db/migrations postgres "$${ARTA_DATABASE_URL}" up
