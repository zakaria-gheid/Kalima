package application

import (
	"math/rand/v2"
	"sort"
	"strconv"
	"strings"
	"testing"
)

func newRng(seed uint64) *rand.Rand {
	return rand.New(rand.NewPCG(seed, seed))
}

func TestFisherYatesShuffleDoesNotMutateInput(t *testing.T) {
	input := []int{1, 2, 3, 4, 5}
	snapshot := append([]int(nil), input...)
	FisherYatesShuffle(input, newRng(42))
	for i := range input {
		if input[i] != snapshot[i] {
			t.Fatalf("input mutated at index %d", i)
		}
	}
}

func TestFisherYatesShuffleIsPermutation(t *testing.T) {
	input := make([]int, 100)
	for i := range input {
		input[i] = i
	}
	result := FisherYatesShuffle(input, newRng(7))
	if len(result) != len(input) {
		t.Fatalf("got length %d, want %d", len(result), len(input))
	}
	sorted := append([]int(nil), result...)
	sort.Ints(sorted)
	for i, v := range sorted {
		if v != i {
			t.Fatalf("result is not a permutation: index %d has %d", i, v)
		}
	}
}

func TestFisherYatesShuffleEdgeCases(t *testing.T) {
	if got := FisherYatesShuffle([]int{}, newRng(1)); len(got) != 0 {
		t.Errorf("empty input: got %v", got)
	}
	if got := FisherYatesShuffle([]string{"only"}, newRng(1)); len(got) != 1 || got[0] != "only" {
		t.Errorf("single input: got %v", got)
	}
}

func TestFisherYatesShuffleUniformity(t *testing.T) {
	rng := newRng(99)
	counts := map[string]int{}
	const trials = 6000
	for range trials {
		result := FisherYatesShuffle([]int{1, 2, 3}, rng)
		parts := make([]string, len(result))
		for i, v := range result {
			parts[i] = strconv.Itoa(v)
		}
		counts[strings.Join(parts, ",")]++
	}
	if len(counts) != 6 {
		t.Fatalf("got %d distinct permutations, want 6", len(counts))
	}
	for perm, count := range counts {
		if count < 650 || count > 1350 {
			t.Errorf("permutation %s occurred %d times, outside [650, 1350]", perm, count)
		}
	}
}
