-- +goose Up
ALTER TABLE pieces ADD COLUMN opus TEXT, ADD COLUMN number TEXT;

-- +goose Down
ALTER TABLE pieces DROP COLUMN opus, DROP COLUMN number;
