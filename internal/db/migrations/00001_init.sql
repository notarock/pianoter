-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    username      TEXT     NOT NULL UNIQUE,
    password_hash TEXT     NOT NULL,
    created_at    DATETIME
);

CREATE TABLE IF NOT EXISTS composers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL DEFAULT 0,
    name        TEXT    NOT NULL,
    nationality TEXT,
    born_year   INTEGER,
    died_year   INTEGER
);

CREATE TABLE IF NOT EXISTS pieces (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER  NOT NULL DEFAULT 0,
    title          TEXT     NOT NULL,
    composer_id    INTEGER  NOT NULL,
    difficulty     INTEGER,
    status         TEXT,
    started_at     DATETIME,
    last_played_at DATETIME,
    current_level  TEXT
);

CREATE TABLE IF NOT EXISTS play_sessions (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    piece_id      INTEGER  NOT NULL,
    played_at     DATETIME NOT NULL,
    notes         TEXT,
    playing_level TEXT
);

-- +goose Down
DROP TABLE IF EXISTS play_sessions;
DROP TABLE IF EXISTS pieces;
DROP TABLE IF EXISTS composers;
DROP TABLE IF EXISTS users;
