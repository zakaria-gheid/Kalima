package domain

import "time"

// Difficulty is one of the three fixed game difficulty levels.
// Values are lowercase by contract with the seed file and the frontend schema.
type Difficulty string

const (
	DifficultyEasy   Difficulty = "easy"
	DifficultyMedium Difficulty = "medium"
	DifficultyHard   Difficulty = "hard"
)

// Difficulties lists all valid difficulty levels in display order.
var Difficulties = []Difficulty{DifficultyEasy, DifficultyMedium, DifficultyHard}

// Valid reports whether d is one of the known difficulty levels.
func (d Difficulty) Valid() bool {
	switch d {
	case DifficultyEasy, DifficultyMedium, DifficultyHard:
		return true
	}
	return false
}

// Word is a single bilingual vocabulary card.
type Word struct {
	ID         int64
	English    string
	Arabic     string
	Category   string
	Difficulty Difficulty
	Enabled    bool
	HintEn     string // describer hint in English
	HintAr     string // describer hint in Arabic
	CreatedAt  time.Time
}
