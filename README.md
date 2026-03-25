# Pianoter

A practice tracker I built for myself to manage my piano repertoire. Keeps track of what I'm working on, logs sessions, and shows how long it takes to get through each learning stage.

## What it does

- Register / login with JWT auth
- Manage pieces with statuses: wishlist, learning, active, shelved
- Log practice sessions with notes and a playing level
- Track progression through stages (hands separate → performance ready)
- Timeline showing how long each stage took
- Dashboard with piece counts and a "to revisit" table (7 / 14 / 30 / 60 days)
- 50 pre-seeded classical composers with per-composer listings and search
- English and French UI with a language switcher in the nav
- Works on mobile too

## Stack

- **Backend:** Go, [Chi](https://github.com/go-chi/chi) v5, [GORM](https://gorm.io), MariaDB, [Goose](https://github.com/pressly/goose) for migrations, JWT
- **Frontend:** React, TypeScript, Vite, [Mantine](https://mantine.dev), react-router-dom, i18next
- **Database:** MariaDB 11

## Running locally

You'll need Go 1.25+, Node.js 20+, and Docker for the database.

```bash
# Start MariaDB
make db

# Run backend + frontend at the same time
make dev
```

Backend runs on port `8080`, frontend dev server on `5173` (proxies `/api` to the backend).

### Environment variables

Copy `.env.example` to `.env` or just set these in your shell:

| Variable      | Default     | Description              |
|---------------|-------------|--------------------------|
| `JWT_SECRET`  | `changeme`  | Secret used to sign JWTs |
| `DB_HOST`     | `localhost` | MariaDB host             |
| `DB_PORT`     | `3306`      | MariaDB port             |
| `DB_USER`     | `pianoter`  | Database user            |
| `DB_PASSWORD` | `pianoter`  | Database password        |
| `DB_NAME`     | `pianoter`  | Database name            |
| `PORT`        | `8080`      | Backend port             |

Migrations run on startup automatically. If you need to manage them manually:

```bash
make migrate-up      # apply pending migrations
make migrate-down    # roll back the last one
make migrate-status  # see what's applied
```

## Docker Compose

To spin up the whole stack (MariaDB + backend + frontend):

```bash
docker compose up
```

Frontend ends up on port `80`, API on `8080`.

## Tests

```bash
make test            # backend + frontend
make test-backend    # go test ./...
make test-frontend   # vitest
make cy              # Cypress e2e (headless)
make cy-open         # Cypress e2e (interactive)
```
