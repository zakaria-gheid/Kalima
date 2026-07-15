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

// NewDeck builds a deck from the pool of cards that have not appeared yet: a
// card shown in any game stays out of every following deck until the whole
// pool has been played, then the pool resets automatically. The deck is
// shuffled exactly once with Fisher–Yates, so order stays random and playing
// front to back guarantees zero repeats within a session too.
func (g *GameService) NewDeck(difficulty domain.Difficulty) ([]domain.Word, error) {
	if !difficulty.Valid() {
		return nil, fmt.Errorf("invalid difficulty %q", difficulty)
	}
	pool, err := g.words.FindUnseenEnabledByDifficulty(difficulty)
	if err != nil {
		return nil, fmt.Errorf("loading words: %w", err)
	}
	if len(pool) == 0 {
		// Every card has appeared — return them all to the pool and start over.
		if err := g.words.ResetSeen(difficulty); err != nil {
			return nil, fmt.Errorf("resetting card pool: %w", err)
		}
		pool, err = g.words.FindUnseenEnabledByDifficulty(difficulty)
		if err != nil {
			return nil, fmt.Errorf("loading words after reset: %w", err)
		}
	}
	if len(pool) == 0 {
		return nil, fmt.Errorf("no enabled words for difficulty %q", difficulty)
	}
	return FisherYatesShuffle(pool, g.rng), nil
}

// MarkCardAppeared records that a card was shown, keeping it out of future
// decks until the pool resets.
func (g *GameService) MarkCardAppeared(id int64) error {
	return g.words.MarkSeen(id)
}

// ResetCardPool manually returns every card of the difficulty (or all cards
// when difficulty is empty) to the pool.
func (g *GameService) ResetCardPool(difficulty domain.Difficulty) error {
	return g.words.ResetSeen(difficulty)
}

// RecordResult persists a finished session for statistics.
func (g *GameService) RecordResult(result domain.GameSessionResult) error {
	return g.sessions.Insert(result)
}
