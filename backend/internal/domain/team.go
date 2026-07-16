package domain

// Team is a pair of players: one describes the word, the other guesses it.
// Roles matter — A describing to B is a different team than B describing to A.
type Team struct {
	ID        int64
	Describer string
	Guesser   string
}

// TeamStanding is one leaderboard row: a team with its accumulated points
// (total cards won across all its games). AvgPoints (points per game) is the
// fair ranking metric across different game counts.
type TeamStanding struct {
	TeamID      int64
	Describer   string
	Guesser     string
	TotalPoints int64
	GamesPlayed int64
	AvgPoints   float64
}

// PlayerRole selects which side of a team an individual ranking is for.
type PlayerRole string

const (
	RoleDescriber PlayerRole = "describer"
	RoleGuesser   PlayerRole = "guesser"
)

// PlayerStanding is a leaderboard row for an individual player in one role.
type PlayerStanding struct {
	Name        string
	TotalPoints int64
	GamesPlayed int64
	AvgPoints   float64
}
