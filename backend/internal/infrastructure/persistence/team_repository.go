package persistence

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"hotseat/backend/internal/domain"
)

// TeamRepository is the GORM-backed implementation of domain.TeamRepository.
type TeamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

var _ domain.TeamRepository = (*TeamRepository)(nil)

// FindOrCreate returns the existing team for this describer/guesser pair
// (case-insensitive) or creates it.
func (r *TeamRepository) FindOrCreate(describer, guesser string) (domain.Team, error) {
	describer = strings.TrimSpace(describer)
	guesser = strings.TrimSpace(guesser)
	if describer == "" || guesser == "" {
		return domain.Team{}, errors.New("both a describer and a guesser name are required")
	}

	var record teamRecord
	err := r.db.
		Where("describer = ? COLLATE NOCASE AND guesser = ? COLLATE NOCASE", describer, guesser).
		First(&record).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		record = teamRecord{Describer: describer, Guesser: guesser}
		err = r.db.Create(&record).Error
	}
	if err != nil {
		return domain.Team{}, err
	}
	return domain.Team{ID: record.ID, Describer: record.Describer, Guesser: record.Guesser}, nil
}

// DeleteAll erases every team. Combined with SessionRepository.DeleteAll it
// clears the leaderboard.
func (r *TeamRepository) DeleteAll() error {
	return r.db.Exec("DELETE FROM teams").Error
}

// Leaderboard returns all teams ranked best-first by total points
// (cards won across all their recorded games).
func (r *TeamRepository) Leaderboard() ([]domain.TeamStanding, error) {
	var rows []struct {
		TeamID      int64
		Describer   string
		Guesser     string
		TotalPoints int64
		GamesPlayed int64
	}
	err := r.db.
		Table("teams t").
		Select(`t.id AS team_id, t.describer, t.guesser,
			COALESCE(SUM(s.cards_completed), 0) AS total_points,
			COUNT(s.id) AS games_played`).
		Joins("LEFT JOIN game_sessions s ON s.team_id = t.id").
		Group("t.id").
		Order("total_points DESC, games_played ASC, t.describer COLLATE NOCASE").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	standings := make([]domain.TeamStanding, len(rows))
	for i, row := range rows {
		standings[i] = domain.TeamStanding(row)
	}
	return standings, nil
}
