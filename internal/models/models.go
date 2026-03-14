package models

import "time"

type Composer struct {
	ID       uint    `json:"id" gorm:"primaryKey"`
	Name     string  `json:"name" gorm:"not null"`
	BornYear *int    `json:"born_year"`
	DiedYear *int    `json:"died_year"`
}

type Piece struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	Title        string     `json:"title" gorm:"not null"`
	ComposerID   uint       `json:"composer_id"`
	Composer     Composer   `json:"composer" gorm:"foreignKey:ComposerID"`
	Difficulty   int        `json:"difficulty"` // 1–10
	Status       string     `json:"status"`     // wishlist, learning, active, shelved
	StartedAt    *time.Time `json:"started_at"`
	LastPlayedAt *time.Time `json:"last_played_at"`
	CurrentLevel string     `json:"current_level"` // denormalized from latest session with a level
}

type PlaySession struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	PieceID      uint      `json:"piece_id"`
	PlayedAt     time.Time `json:"played_at" gorm:"autoCreateTime"`
	Notes        string    `json:"notes"`
	PlayingLevel string    `json:"playing_level"` // optional; empty = not recorded
}
