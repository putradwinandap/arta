.PHONY: dev-up dev-down web-install web-dev web-test web-build server-test server-build generate migrate-up

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

server-test:
	cd server && go test ./...

server-build:
	cd server && go build ./cmd/arta

generate:
	cd server && sqlc generate

migrate-up:
	cd server && goose -dir db/migrations postgres "$${ARTA_DATABASE_URL}" up
