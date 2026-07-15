package persistence

import (
	"math/rand/v2"
	"testing"
	"time"

	"hotseat/backend/internal/application"
	"hotseat/backend/internal/domain"
)

const testSeed = "english|arabic|category|difficulty\n" +
	"Chair|كرسي|Home|easy\n" +
	"Table|طاولة|Home|easy\n" +
	"Lion|أسد|Animals|medium\n" +
	"Compass|بوصلة|Tools|hard\n"

func openTestDB(t *testing.T) *WordRepository {
	t.Helper()
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("opening in-memory database: %v", err)
	}
	return NewWordRepository(db)
}

func TestSeedAndQueryRoundTrip(t *testing.T) {
	words := openTestDB(t)
	seeder := application.NewSeedService(words)

	inserted, err := seeder.Sync(testSeed)
	if err != nil {
		t.Fatalf("Sync: %v", err)
	}
	if inserted != 4 {
		t.Fatalf("inserted %d words, want 4", inserted)
	}

	// Syncing again must be a no-op.
	inserted, err = seeder.Sync(testSeed)
	if err != nil {
		t.Fatalf("second Sync: %v", err)
	}
	if inserted != 0 {
		t.Fatalf("second sync inserted %d words, want 0", inserted)
	}

	// A grown seed file imports only the missing rows.
	inserted, err = seeder.Sync(testSeed + "Bridge|جسر|City|medium\n")
	if err != nil {
		t.Fatalf("Sync with extra word: %v", err)
	}
	if inserted != 1 {
		t.Fatalf("sync with one new word inserted %d, want 1", inserted)
	}

	counts, err := words.CountByDifficulty()
	if err != nil {
		t.Fatalf("CountByDifficulty: %v", err)
	}
	want := map[domain.Difficulty]int64{
		domain.DifficultyEasy:   2,
		domain.DifficultyMedium: 2, // Lion from the base seed + the synced Bridge
		domain.DifficultyHard:   1,
	}
	for d, n := range want {
		if counts[d] != n {
			t.Errorf("difficulty %s: got %d words, want %d", d, counts[d], n)
		}
	}

	easy, err := words.FindEnabledByDifficulty(domain.DifficultyEasy)
	if err != nil {
		t.Fatalf("FindEnabledByDifficulty: %v", err)
	}
	if len(easy) != 2 || easy[0].Arabic == "" {
		t.Fatalf("unexpected easy words: %+v", easy)
	}

	// Disabling a word removes it from the deck pool.
	if err := words.SetEnabled(easy[0].ID, false); err != nil {
		t.Fatalf("SetEnabled: %v", err)
	}
	easy, err = words.FindEnabledByDifficulty(domain.DifficultyEasy)
	if err != nil {
		t.Fatalf("FindEnabledByDifficulty after disable: %v", err)
	}
	if len(easy) != 1 {
		t.Fatalf("got %d enabled easy words after disable, want 1", len(easy))
	}
}

func TestGameServiceDeckAndSessionRecording(t *testing.T) {
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("opening in-memory database: %v", err)
	}
	words := NewWordRepository(db)
	sessions := NewSessionRepository(db)
	if _, err := application.NewSeedService(words).Sync(testSeed); err != nil {
		t.Fatalf("seeding: %v", err)
	}

	game := application.NewGameService(words, sessions, rand.New(rand.NewPCG(1, 2)))
	deck, err := game.NewDeck(domain.DifficultyEasy)
	if err != nil {
		t.Fatalf("NewDeck: %v", err)
	}
	if len(deck) != 2 {
		t.Fatalf("deck has %d cards, want 2", len(deck))
	}
	seen := map[int64]bool{}
	for _, card := range deck {
		if seen[card.ID] {
			t.Fatalf("card %d repeated within a session", card.ID)
		}
		seen[card.ID] = true
	}

	if _, err := game.NewDeck("impossible"); err == nil {
		t.Fatal("NewDeck with invalid difficulty: expected error")
	}

	teams := NewTeamRepository(db)
	team, err := teams.FindOrCreate("Ali", "Sara")
	if err != nil {
		t.Fatalf("FindOrCreate: %v", err)
	}

	now := time.Now()
	err = game.RecordResult(domain.GameSessionResult{
		ID:             "test-session",
		Difficulty:     domain.DifficultyEasy,
		StartedAt:      now.Add(-time.Minute),
		EndedAt:        now,
		DurationMs:     120_000,
		ElapsedMs:      60_000,
		CardsCompleted: 2,
		CardsSkipped:   0,
		CardsTotal:     2,
		TeamID:         &team.ID,
	})
	if err != nil {
		t.Fatalf("RecordResult: %v", err)
	}
	var stored sessionRecord
	if err := db.First(&stored, "id = ?", "test-session").Error; err != nil {
		t.Fatalf("reading stored session: %v", err)
	}
	if stored.CardsCompleted != 2 || stored.ElapsedMs != 60_000 || stored.DurationMs != 120_000 {
		t.Errorf("unexpected stored session: %+v", stored)
	}
	if stored.TeamID == nil || *stored.TeamID != team.ID {
		t.Errorf("stored session team = %v, want %d", stored.TeamID, team.ID)
	}
}

func TestTeamsAndLeaderboard(t *testing.T) {
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("opening in-memory database: %v", err)
	}
	teams := NewTeamRepository(db)
	sessions := NewSessionRepository(db)

	ali, err := teams.FindOrCreate("Ali", "Sara")
	if err != nil {
		t.Fatalf("FindOrCreate ali: %v", err)
	}
	// Same pair, different case → same team; swapped roles → different team.
	same, err := teams.FindOrCreate("ali", "SARA")
	if err != nil {
		t.Fatalf("FindOrCreate same: %v", err)
	}
	if same.ID != ali.ID {
		t.Errorf("case-insensitive lookup created a duplicate team: %d vs %d", same.ID, ali.ID)
	}
	swapped, err := teams.FindOrCreate("Sara", "Ali")
	if err != nil {
		t.Fatalf("FindOrCreate swapped: %v", err)
	}
	if swapped.ID == ali.ID {
		t.Error("swapped roles must be a distinct team")
	}
	if _, err := teams.FindOrCreate("", "Sara"); err == nil {
		t.Error("empty describer: expected error")
	}

	record := func(id string, teamID int64, points int) {
		t.Helper()
		now := time.Now()
		err := sessions.Insert(domain.GameSessionResult{
			ID: id, Difficulty: domain.DifficultyEasy,
			StartedAt: now, EndedAt: now,
			DurationMs: 60_000, ElapsedMs: 60_000,
			CardsCompleted: points, CardsTotal: 100, TeamID: &teamID,
		})
		if err != nil {
			t.Fatalf("Insert %s: %v", id, err)
		}
	}
	record("s1", ali.ID, 10)
	record("s2", ali.ID, 5)
	record("s3", swapped.ID, 20)

	standings, err := teams.Leaderboard()
	if err != nil {
		t.Fatalf("Leaderboard: %v", err)
	}
	if len(standings) != 2 {
		t.Fatalf("got %d standings, want 2", len(standings))
	}
	if standings[0].TeamID != swapped.ID || standings[0].TotalPoints != 20 {
		t.Errorf("first place = %+v, want team %d with 20 points", standings[0], swapped.ID)
	}
	if standings[1].TeamID != ali.ID || standings[1].TotalPoints != 15 || standings[1].GamesPlayed != 2 {
		t.Errorf("second place = %+v, want team %d with 15 points over 2 games", standings[1], ali.ID)
	}

	// Clearing removes every session and team; the leaderboard becomes empty.
	if err := sessions.DeleteAll(); err != nil {
		t.Fatalf("sessions.DeleteAll: %v", err)
	}
	if err := teams.DeleteAll(); err != nil {
		t.Fatalf("teams.DeleteAll: %v", err)
	}
	standings, err = teams.Leaderboard()
	if err != nil {
		t.Fatalf("Leaderboard after clear: %v", err)
	}
	if len(standings) != 0 {
		t.Errorf("leaderboard after clear has %d rows, want 0", len(standings))
	}
}
