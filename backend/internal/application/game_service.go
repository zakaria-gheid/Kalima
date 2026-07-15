package application

import (
	"fmt"
	"math/rand/v2"

	"hotseat/backend/internal/domain"
)

// GameService builds shuffled decks and records finished sessions.
type GameService struct {
	words    domain.WordRepository
	sessions domain.SessionRepository
	rng      *rand.Rand
}

func NewGameService(words domain.WordRepository, sessions domain.SessionRepository, rng *rand.Rand) *GameService {
	return &GameService{words: words, sessions: sessions, rng: rng}
}

// NewDeck loads every enabled word for the difficulty and shuffles it exactly
// once with Fisher–Yates. Playing the deck front to back guarantees zero
// repeats within a session.
func (g *GameService) NewDeck(difficulty domain.Difficulty) ([]domain.Word, error) {
	if !difficulty.Valid() {
		return nil, fmt.Errorf("invalid difficulty %q", difficulty)
	}
	pool, err := g.words.FindEnabledByDifficulty(difficulty)
	if err != nil {
		return nil, fmt.Errorf("loading words: %w", err)
	}
	if len(pool) == 0 {
		return nil, fmt.Errorf("no enabled words for difficulty %q", difficulty)
	}
	return FisherYatesShuffle(pool, g.rng), nil
}

// RecordResult persists a finished session for statistics.
func (g *GameService) RecordResult(result domain.GameSessionResult) error {
	return g.sessions.Insert(result)
}
