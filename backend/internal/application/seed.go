package application

import (
	"fmt"
	"strings"
	"time"

	"hotseat/backend/internal/domain"
)

const seedHeader = "english|arabic|category|difficulty"

// ParseSeedFile parses the pipe-delimited seed file
// (english|arabic|category|difficulty with one header row).
// It fails loudly on any malformed row: the seed file is the single source of
// truth and must never be silently truncated or corrected.
func ParseSeedFile(raw string) ([]domain.Word, error) {
	var lines []string
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(strings.TrimSuffix(line, "\r"))
		if line != "" {
			lines = append(lines, line)
		}
	}
	if len(lines) == 0 || strings.ToLower(lines[0]) != seedHeader {
		return nil, fmt.Errorf("seed file header must be %q", seedHeader)
	}

	now := time.Now()
	seen := make(map[string]bool, len(lines)-1)
	words := make([]domain.Word, 0, len(lines)-1)
	for i, line := range lines[1:] {
		row := i + 2 // 1-based line number including the header
		fields := strings.Split(line, "|")
		if len(fields) != 4 {
			return nil, fmt.Errorf("seed row %d has %d fields, expected 4: %q", row, len(fields), line)
		}
		english := strings.TrimSpace(fields[0])
		arabic := strings.TrimSpace(fields[1])
		category := strings.TrimSpace(fields[2])
		difficulty := domain.Difficulty(strings.TrimSpace(fields[3]))
		if english == "" || arabic == "" || category == "" || difficulty == "" {
			return nil, fmt.Errorf("seed row %d has an empty field: %q", row, line)
		}
		if !difficulty.Valid() {
			return nil, fmt.Errorf("seed row %d has invalid difficulty %q", row, difficulty)
		}
		key := strings.ToLower(english)
		if seen[key] {
			return nil, fmt.Errorf("seed row %d duplicates English word %q", row, english)
		}
		seen[key] = true
		words = append(words, domain.Word{
			English:    english,
			Arabic:     arabic,
			Category:   category,
			Difficulty: difficulty,
			Enabled:    true,
			CreatedAt:  now,
		})
	}
	return words, nil
}

// SeedService imports the seed word list into the database.
type SeedService struct {
	words domain.WordRepository
}

func NewSeedService(words domain.WordRepository) *SeedService {
	return &SeedService{words: words}
}

// Sync parses raw seed data and inserts every word not already present
// (matched case-insensitively on English). It seeds everything on first run
// and imports newly added seed words on upgrades, leaving existing rows and
// their enabled flags untouched. Returns the number of words inserted.
func (s *SeedService) Sync(raw string) (int, error) {
	existing, err := s.words.ListEnglish()
	if err != nil {
		return 0, fmt.Errorf("listing existing words: %w", err)
	}
	present := make(map[string]bool, len(existing))
	for _, english := range existing {
		present[strings.ToLower(english)] = true
	}

	words, err := ParseSeedFile(raw)
	if err != nil {
		return 0, err
	}
	missing := words[:0:0]
	for _, word := range words {
		if !present[strings.ToLower(word.English)] {
			word.HintEn, word.HintAr = HintsForCategory(word.Category)
			missing = append(missing, word)
		}
	}
	if len(missing) > 0 {
		if err := s.words.InsertAll(missing); err != nil {
			return 0, fmt.Errorf("inserting seed words: %w", err)
		}
	}
	if err := s.backfillHints(); err != nil {
		return 0, err
	}
	return len(missing), nil
}

// ApplyWordHints parses the word-specific hints file (english|hint_en|hint_ar,
// # comments allowed) and overrides the generic category hints for the words
// it covers. Returns the number of hint rows applied.
func (s *SeedService) ApplyWordHints(raw string) (int, error) {
	applied := 0
	for i, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Split(line, "|")
		if len(fields) != 3 {
			return 0, fmt.Errorf("hint row %d has %d fields, expected 3: %q", i+1, len(fields), line)
		}
		english := strings.TrimSpace(fields[0])
		hintEn := strings.TrimSpace(fields[1])
		hintAr := strings.TrimSpace(fields[2])
		if english == "" || hintEn == "" || hintAr == "" {
			return 0, fmt.Errorf("hint row %d has an empty field: %q", i+1, line)
		}
		if err := s.words.SetHintsByEnglish(english, hintEn, hintAr); err != nil {
			return 0, fmt.Errorf("applying hint for %q: %w", english, err)
		}
		applied++
	}
	return applied, nil
}

// backfillHints fills the describer hints for any word still missing them
// (rows created before hints existed).
func (s *SeedService) backfillHints() error {
	categories, err := s.words.CategoriesMissingHints()
	if err != nil {
		return fmt.Errorf("listing categories missing hints: %w", err)
	}
	for _, category := range categories {
		en, ar := HintsForCategory(category)
		if err := s.words.SetHintsForCategory(category, en, ar); err != nil {
			return fmt.Errorf("backfilling hints for %q: %w", category, err)
		}
	}
	return nil
}
