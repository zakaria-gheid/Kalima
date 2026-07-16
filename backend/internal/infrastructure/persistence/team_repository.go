package persistence

import (
	"errors"
	"sort"
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

// rankStandings sorts fairly across different game counts: points per game
// first, more games as tie-breaker, then total points.
func rankStandings[T any](rows []T, avg func(T) float64, games func(T) int64, total func(T) int64) {
	sort.SliceStable(rows, func(i, j int) bool {
		if avg(rows[i]) != avg(rows[j]) {
			return avg(rows[i]) > avg(rows[j])
		}
		if games(rows[i]) != games(rows[j]) {
			return games(rows[i]) > games(rows[j])
		}
		return total(rows[i]) > total(rows[j])
	})
}

// Leaderboard returns all teams that played, ranked fairly (points per game,
// then games played, then total points).
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
		Joins("JOIN game_sessions s ON s.team_id = t.id").
		Group("t.id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	standings := make([]domain.TeamStanding, len(rows))
	for i, row := range rows {
		standings[i] = domain.TeamStanding{
			TeamID:      row.TeamID,
			Describer:   row.Describer,
			Guesser:     row.Guesser,
			TotalPoints: row.TotalPoints,
			GamesPlayed: row.GamesPlayed,
		}
		if row.GamesPlayed > 0 {
			standings[i].AvgPoints = float64(row.TotalPoints) / float64(row.GamesPlayed)
		}
	}
	rankStandings(standings,
		func(s domain.TeamStanding) float64 { return s.AvgPoints },
		func(s domain.TeamStanding) int64 { return s.GamesPlayed },
		func(s domain.TeamStanding) int64 { return s.TotalPoints })
	return standings, nil
}

// PlayerStandings ranks individual players in one role (describer or
// guesser), grouped case-insensitively by name.
func (r *TeamRepository) PlayerStandings(role domain.PlayerRole) ([]domain.PlayerStanding, error) {
	column := "t.describer"
	if role == domain.RoleGuesser {
		column = "t.guesser"
	}
	var rows []struct {
		Name        string
		TotalPoints int64
		GamesPlayed int64
	}
	err := r.db.
		Table("teams t").
		Select(column + ` AS name,
			COALESCE(SUM(s.cards_completed), 0) AS total_points,
			COUNT(s.id) AS games_played`).
		Joins("JOIN game_sessions s ON s.team_id = t.id").
		Group(column + " COLLATE NOCASE").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	standings := make([]domain.PlayerStanding, len(rows))
	for i, row := range rows {
		standings[i] = domain.PlayerStanding{
			Name:        row.Name,
			TotalPoints: row.TotalPoints,
			GamesPlayed: row.GamesPlayed,
		}
		if row.GamesPlayed > 0 {
			standings[i].AvgPoints = float64(row.TotalPoints) / float64(row.GamesPlayed)
		}
	}
	rankStandings(standings,
		func(s domain.PlayerStanding) float64 { return s.AvgPoints },
		func(s domain.PlayerStanding) int64 { return s.GamesPlayed },
		func(s domain.PlayerStanding) int64 { return s.TotalPoints })
	return standings, nil
}
