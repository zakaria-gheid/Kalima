// Command seed builds the local SQLite database (database/hotseat.db) from
// the canonical word list at assets/data/words_seed.txt. It is idempotent:
// an already-seeded database is left untouched unless -force is given.
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"hotseat/backend/internal/application"
	"hotseat/backend/internal/domain"
	"hotseat/backend/internal/infrastructure/persistence"
)

func main() {
	dbPath := flag.String("db", "../database/hotseat.db", "path to the SQLite database file")
	seedPath := flag.String("seed", "../assets/data/words_seed.txt", "path to the seed word list")
	force := flag.Bool("force", false, "drop and reseed the words table even if it already has rows")
	flag.Parse()

	if err := run(*dbPath, *seedPath, *force); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run(dbPath, seedPath string, force bool) error {
	raw, err := os.ReadFile(seedPath)
	if err != nil {
		return fmt.Errorf("reading seed file: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("creating database directory: %w", err)
	}

	db, err := persistence.Open(dbPath)
	if err != nil {
		return err
	}

	if force {
		if err := db.Exec("DELETE FROM words").Error; err != nil {
			return fmt.Errorf("clearing words table: %w", err)
		}
	}

	words := persistence.NewWordRepository(db)
	seeder := application.NewSeedService(words)
	inserted, err := seeder.Sync(string(raw))
	if err != nil {
		return err
	}

	counts, err := words.CountByDifficulty()
	if err != nil {
		return err
	}
	if inserted > 0 {
		fmt.Printf("imported %d new words into %s\n", inserted, dbPath)
	} else {
		fmt.Printf("database %s already up to date, nothing to do\n", dbPath)
	}
	for _, d := range domain.Difficulties {
		fmt.Printf("  %-6s %d\n", d, counts[d])
	}
	return nil
}
