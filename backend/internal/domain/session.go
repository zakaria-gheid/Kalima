package domain

import "time"

// GameSessionResult is a finished game, persisted for statistics.
type GameSessionResult struct {
	ID             string
	Difficulty     Difficulty
	StartedAt      time.Time
	EndedAt        time.Time
	DurationMs     int64 // countdown length chosen before the game started
	ElapsedMs      int64 // actual time played (== DurationMs when time ran out)
	CardsCompleted int   // cards won — the points banked for the team
	CardsSkipped   int
	CardsTotal     int
	TeamID         *int64 // nil only for legacy sessions recorded before teams existed
}
