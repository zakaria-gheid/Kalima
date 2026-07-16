package persistence

import (
	"gorm.io/gorm"

	"hotseat/backend/internal/domain"
)

// SessionRepository is the GORM-backed implementation of domain.SessionRepository.
type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

var _ domain.SessionRepository = (*SessionRepository)(nil)

func (r *SessionRepository) Insert(result domain.GameSessionResult) error {
	record := sessionRecord{
		ID:             result.ID,
		Difficulty:     string(result.Difficulty),
		StartedAt:      result.StartedAt.UnixMilli(),
		EndedAt:        result.EndedAt.UnixMilli(),
		DurationMs:     result.DurationMs,
		ElapsedMs:      result.ElapsedMs,
		CardsCompleted: result.CardsCompleted,
		CardsSkipped:   result.CardsSkipped,
		CardsTotal:     result.CardsTotal,
		TeamID:         result.TeamID,
	}
	return r.db.Create(&record).Error
}

// DeleteByID discards a single recorded game so it no longer counts anywhere.
func (r *SessionRepository) DeleteByID(id string) error {
	return r.db.Delete(&sessionRecord{}, "id = ?", id).Error
}

// DeleteAll erases every recorded game session.
func (r *SessionRepository) DeleteAll() error {
	return r.db.Exec("DELETE FROM game_sessions").Error
}
