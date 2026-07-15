package application

import "hotseat/backend/internal/domain"

// WordService exposes vocabulary queries and management to callers.
type WordService struct {
	words domain.WordRepository
}

func NewWordService(words domain.WordRepository) *WordService {
	return &WordService{words: words}
}

func (w *WordService) CountByDifficulty() (map[domain.Difficulty]int64, error) {
	return w.words.CountByDifficulty()
}

func (w *WordService) SetEnabled(id int64, enabled bool) error {
	return w.words.SetEnabled(id, enabled)
}
