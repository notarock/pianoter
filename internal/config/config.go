package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	Port       string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		DBHost:     getenv("DB_HOST", "localhost"),
		DBPort:     getenv("DB_PORT", "3306"),
		DBUser:     getenv("DB_USER", "pianoter"),
		DBPassword: getenv("DB_PASSWORD", "pianoter"),
		DBName:     getenv("DB_NAME", "pianoter"),
		JWTSecret:  getenv("JWT_SECRET", "dev-secret-change-in-production"),
		Port:       getenv("PORT", "8080"),
	}
}

func (c *Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=True&charset=utf8mb4",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

func getenv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
