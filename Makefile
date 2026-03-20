.PHONY: dev backend frontend build db migrate-up migrate-down migrate-status test test-backend test-frontend cy cy-open

dev:
	@echo "Starting backend and frontend..."
	@(trap 'kill 0' INT; \
	  go run . & \
	  cd web && npm run dev)

db:
	docker compose up mariadb -d

backend:
	go run .

frontend:
	cd web && npm run dev

build:
	go build -o pianoter .
	cd web && npm run build

migrate-up:
	go run . migrate up

migrate-down:
	go run . migrate down

migrate-status:
	go run . migrate status

test: test-backend test-frontend

test-backend:
	go test ./...

test-frontend:
	cd web && npm test

cy:
	cd web && npm run cy:run

cy-open:
	cd web && npm run cy:open
