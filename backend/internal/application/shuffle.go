package application

import "math/rand/v2"

// FisherYatesShuffle returns a new slice containing a uniformly random
// permutation of items. The input slice is not mutated.
func FisherYatesShuffle[T any](items []T, rng *rand.Rand) []T {
	result := make([]T, len(items))
	copy(result, items)
	for i := len(result) - 1; i > 0; i-- {
		j := rng.IntN(i + 1)
		result[i], result[j] = result[j], result[i]
	}
	return result
}
