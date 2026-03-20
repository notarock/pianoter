-- +goose Up
ALTER TABLE pieces ADD COLUMN notes TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE pieces DROP COLUMN notes;
