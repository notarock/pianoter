package handlers_test

import (
	"testing"
	"time"

	"pianoter/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const testSecret = "test-secret"

func setupDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared&mode=memory"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory sqlite: %v", err)
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Composer{},
		&models.Piece{},
		&models.PlaySession{},
	); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	t.Cleanup(func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	})
	return db
}

func makeToken(userID uint) string {
	claims := jwt.MapClaims{
		"sub": float64(userID),
		"exp": time.Now().Add(time.Hour).Unix(),
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testSecret))
	if err != nil {
		panic("makeToken: " + err.Error())
	}
	return token
}

func authHeader(userID uint) string {
	return "Bearer " + makeToken(userID)
}
