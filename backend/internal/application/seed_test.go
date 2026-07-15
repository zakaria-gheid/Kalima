package application

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"hotseat/backend/internal/domain"
)

const validSeed = "english|arabic|category|difficulty\n" +
	"Chair|كرسي|Home|easy\n" +
	"Lion|أسد|Animals|medium\n" +
	"Compass|بوصلة|Tools|hard\n"

func TestParseSeedFileValid(t *testing.T) {
	words, err := ParseSeedFile(validSeed)
	if err != nil {
		t.Fatalf("ParseSeedFile returned error: %v", err)
	}
	if len(words) != 3 {
		t.Fatalf("got %d words, want 3", len(words))
	}
	first := words[0]
	if first.English != "Chair" || first.Arabic != "كرسي" || first.Category != "Home" ||
		first.Difficulty != domain.DifficultyEasy || !first.Enabled {
		t.Errorf("unexpected first word: %+v", first)
	}
}

func TestParseSeedFileRejectsMalformedInput(t *testing.T) {
	cases := map[string]string{
		"missing header":     "Chair|كرسي|Home|easy",
		"empty file":         "",
		"wrong field count":  "english|arabic|category|difficulty\nChair|كرسي|Home",
		"invalid difficulty": "english|arabic|category|difficulty\nChair|كرسي|Home|EASY",
		"empty field":        "english|arabic|category|difficulty\nChair||Home|easy",
		"duplicate english":  "english|arabic|category|difficulty\nChair|كرسي|Home|easy\nchair|كرسي|Home|hard",
	}
	for name, input := range cases {
		if _, err := ParseSeedFile(input); err == nil {
			t.Errorf("%s: expected error, got nil", name)
		}
	}
}

func TestParseSeedFileHandlesCRLF(t *testing.T) {
	words, err := ParseSeedFile(strings.ReplaceAll(validSeed, "\n", "\r\n"))
	if err != nil {
		t.Fatalf("ParseSeedFile with CRLF returned error: %v", err)
	}
	if len(words) != 3 {
		t.Fatalf("got %d words, want 3", len(words))
	}
}

func TestParseRealSeedFile(t *testing.T) {
	path := filepath.Join("..", "..", "..", "assets", "data", "words_seed.txt")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("reading real seed file: %v", err)
	}
	words, err := ParseSeedFile(string(raw))
	if err != nil {
		t.Fatalf("ParseSeedFile on real seed file: %v", err)
	}
	if len(words) != 1600 {
		t.Fatalf("got %d words, want 1600", len(words))
	}
	counts := map[domain.Difficulty]int{}
	for _, w := range words {
		counts[w.Difficulty]++
	}
	want := map[domain.Difficulty]int{
		domain.DifficultyEasy:   300,
		domain.DifficultyMedium: 1000,
		domain.DifficultyHard:   300,
	}
	for _, d := range domain.Difficulties {
		if counts[d] != want[d] {
			t.Errorf("difficulty %s has %d words, want %d", d, counts[d], want[d])
		}
	}
}
