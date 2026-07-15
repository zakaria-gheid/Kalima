package domain

// Team is a pair of players: one describes the word, the other guesses it.
// Roles matter — A describing to B is a different team than B describing to A.
type Team struct {
	ID        int64
	Describer string
	Guesser   string
}

// TeamStanding is one leaderboard row: a team with its accumulated points
// (total cards won across all its games).
type TeamStanding struct {
	TeamID      int64
	Describer   string
	Guesser     string
	TotalPoints int64
	GamesPlayed int64
}
