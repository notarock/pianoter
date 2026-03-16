-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id            INT      PRIMARY KEY AUTO_INCREMENT,
    username      TEXT     NOT NULL UNIQUE,
    password_hash TEXT     NOT NULL,
    created_at    DATETIME
);

CREATE TABLE IF NOT EXISTS composers (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL DEFAULT 0,
    name        TEXT    NOT NULL,
    nationality TEXT,
    born_year   INT,
    died_year   INT
);

CREATE TABLE IF NOT EXISTS pieces (
    id             INT      PRIMARY KEY AUTO_INCREMENT,
    user_id        INT      NOT NULL DEFAULT 0,
    title          TEXT     NOT NULL,
    composer_id    INT      NOT NULL,
    difficulty     INT,
    status         TEXT,
    started_at     DATETIME,
    last_played_at DATETIME,
    current_level  TEXT
);

CREATE TABLE IF NOT EXISTS play_sessions (
    id            INT      PRIMARY KEY AUTO_INCREMENT,
    piece_id      INT      NOT NULL,
    played_at     DATETIME NOT NULL,
    notes         TEXT,
    playing_level TEXT
);

-- +goose Down
DROP TABLE IF EXISTS play_sessions;
DROP TABLE IF EXISTS pieces;
DROP TABLE IF EXISTS composers;
DROP TABLE IF EXISTS users;
