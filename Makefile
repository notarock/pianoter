.PHONY: dev backend frontend build

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
