package domain

// WordRepository is the persistence port for vocabulary words.
type WordRepository interface {
	Count() (int64, error)
	CountByDifficulty() (map[Difficulty]int64, error)
	FindEnabledByDifficulty(difficulty Difficulty) ([]Word, error)
	FindUnseenEnabledByDifficulty(difficulty Difficulty) ([]Word, error)
	InsertAll(words []Word) error
	ListEnglish() ([]string, error)
	MarkSeen(id int64) error
	ResetSeen(difficulty Difficulty) error
	SetEnabled(id int64, enabled bool) error
}

// SessionRepository is the persistence port for finished game sessions.
type SessionRepository interface {
	Insert(result GameSessionResult) error
	DeleteAll() error
}

// TeamRepository is the persistence port for teams and their rankings.
type TeamRepository interface {
	FindOrCreate(describer, guesser string) (Team, error)
	Leaderboard() ([]TeamStanding, error)
	DeleteAll() error
}
