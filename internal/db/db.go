package db

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func OpenOnly(dsn string) (*gorm.DB, error) {
	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}

func New(dsn string) (*gorm.DB, error) {
	db, err := OpenOnly(dsn)
	if err != nil {
		return nil, err
	}
	if err := RunMigrations(db, "up", 0); err != nil {
		return nil, err
	}
	return db, nil
}
