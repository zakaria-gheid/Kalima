package persistence

import (
	"fmt"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// wordRecord is the GORM mapping for the words table. It mirrors the schema
// used by the frontend's sql.js database so both sides stay compatible.
type wordRecord struct {
	ID         int64  `gorm:"primaryKey;autoIncrement"`
	English    string `gorm:"uniqueIndex;not null"`
	Arabic     string `gorm:"not null"`
	Category   string `gorm:"not null"`
	Difficulty string `gorm:"index:idx_words_difficulty;not null"`
	Enabled    bool   `gorm:"index:idx_words_difficulty;not null;default:true"`
	Seen       bool   `gorm:"not null;default:false"`
	CreatedAt  time.Time
}

func (wordRecord) TableName() string { return "words" }

// sessionRecord is the GORM mapping for the game_sessions table.
type sessionRecord struct {
	ID             string `gorm:"primaryKey"`
	Difficulty     string `gorm:"not null"`
	StartedAt      int64  `gorm:"index;not null"`
	EndedAt        int64  `gorm:"not null"`
	DurationMs     int64  `gorm:"not null;default:0"`
	ElapsedMs      int64  `gorm:"not null"`
	CardsCompleted int    `gorm:"not null"`
	CardsSkipped   int    `gorm:"not null"`
	CardsTotal     int    `gorm:"not null"`
	TeamID         *int64 `gorm:"index"`
}

func (sessionRecord) TableName() string { return "game_sessions" }

// teamRecord is the GORM mapping for the teams table.
type teamRecord struct {
	ID        int64  `gorm:"primaryKey;autoIncrement"`
	Describer string `gorm:"uniqueIndex:idx_teams_pair;not null"`
	Guesser   string `gorm:"uniqueIndex:idx_teams_pair;not null"`
	CreatedAt time.Time
}

func (teamRecord) TableName() string { return "teams" }

// Open opens (creating if needed) the SQLite database at path and migrates
// the schema. Use ":memory:" for tests.
func Open(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: logger.Discard,
	})
	if err != nil {
		return nil, fmt.Errorf("opening sqlite database %q: %w", path, err)
	}
	if err := db.AutoMigrate(&wordRecord{}, &teamRecord{}, &sessionRecord{}); err != nil {
		return nil, fmt.Errorf("migrating schema: %w", err)
	}
	return db, nil
}
