package db

import (
	"fmt"

	"github.com/glebarez/sqlite"
	"github.com/pressly/goose/v3"
	"gorm.io/gorm"
)

func OpenOnly(path string) (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(path), &gorm.Config{})
}

func New(path string) (*gorm.DB, error) {
	db, err := OpenOnly(path)
	if err != nil {
		return nil, err
	}
	if err := RunMigrations(db, "up", 0); err != nil {
		return nil, err
	}
	return db, nil
}

// RunMigrations runs goose migrations against the database.
// direction: "up", "down", "up-to", "down-to", "status"
// target: version number for "up-to" and "down-to", ignored otherwise
func RunMigrations(gormDB *gorm.DB, direction string, target int64) error {
	sqlDB, err := gormDB.DB()
	if err != nil {
		return fmt.Errorf("getting sql.DB: %w", err)
	}

	goose.SetBaseFS(migrationsFS)
	if err := goose.SetDialect("sqlite3"); err != nil {
		return fmt.Errorf("setting dialect: %w", err)
	}

	switch direction {
	case "up":
		return goose.Up(sqlDB, "migrations")
	case "down":
		return goose.Down(sqlDB, "migrations")
	case "up-to":
		return goose.UpTo(sqlDB, "migrations", target)
	case "down-to":
		return goose.DownTo(sqlDB, "migrations", target)
	case "status":
		return goose.Status(sqlDB, "migrations")
	default:
		return fmt.Errorf("unknown migration direction: %s", direction)
	}
}
