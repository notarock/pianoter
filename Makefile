.PHONY: dev backend frontend build migrate-up migrate-down migrate-status

dev:
	@echo "Starting backend and frontend..."
	@(trap 'kill 0' INT; \
	  go run ./cmd/server & \
	  cd web && npm run dev)

backend:
	go run ./cmd/server

frontend:
	cd web && npm run dev

build:
	go build -o pianoter ./cmd/server
	cd web && npm run build

migrate-up:
	go run ./cmd/server migrate up

migrate-down:
	go run ./cmd/server migrate down

migrate-status:
	go run ./cmd/server migrate status
