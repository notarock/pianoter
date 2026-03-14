# Pianoter

Pianoter is a personal practice tracker for pianists to manage their repertoire, log sessions, and follow their progress from first notes to performance-ready.

## Features

- Manage a repertoire of pieces with status tracking (wishlist, learning, active, shelved)
- Log practice sessions with notes and a playing level
- Track progress through stages from hands-separate work up to performance-ready
- Dashboard showing pieces overdue for practice
- Composer catalog with 50 pre-seeded classical composers

## Stack

Go backend with Chi and GORM, SQLite database, React frontend. Migrations are handled by goose.

## Getting started

```bash
make migrate-up
make dev
```

The backend runs on port 8080. The frontend dev server proxies API requests to it.
