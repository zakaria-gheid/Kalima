package persistence

import (
	"gorm.io/gorm"

	"hotseat/backend/internal/domain"
)

// WordRepository is the GORM-backed implementation of domain.WordRepository.
type WordRepository struct {
	db *gorm.DB
}

func NewWordRepository(db *gorm.DB) *WordRepository {
	return &WordRepository{db: db}
}

var _ domain.WordRepository = (*WordRepository)(nil)

func toDomainWord(r wordRecord) domain.Word {
	return domain.Word{
		ID:         r.ID,
		English:    r.English,
		Arabic:     r.Arabic,
		Category:   r.Category,
		Difficulty: domain.Difficulty(r.Difficulty),
		Enabled:    r.Enabled,
		HintEn:     r.HintEn,
		HintAr:     r.HintAr,
		CreatedAt:  r.CreatedAt,
	}
}

func (r *WordRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&wordRecord{}).Count(&count).Error
	return count, err
}

func (r *WordRepository) CountByDifficulty() (map[domain.Difficulty]int64, error) {
	var rows []struct {
		Difficulty string
		N          int64
	}
	err := r.db.Model(&wordRecord{}).
		Select("difficulty, COUNT(*) AS n").
		Where("enabled = ?", true).
		Group("difficulty").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	counts := make(map[domain.Difficulty]int64, len(domain.Difficulties))
	for _, d := range domain.Difficulties {
		counts[d] = 0
	}
	for _, row := range rows {
		counts[domain.Difficulty(row.Difficulty)] = row.N
	}
	return counts, nil
}

func (r *WordRepository) FindEnabledByDifficulty(difficulty domain.Difficulty) ([]domain.Word, error) {
	var records []wordRecord
	err := r.db.
		Where("difficulty = ? AND enabled = ?", string(difficulty), true).
		Order("english COLLATE NOCASE").
		Find(&records).Error
	if err != nil {
		return nil, err
	}
	words := make([]domain.Word, len(records))
	for i, record := range records {
		words[i] = toDomainWord(record)
	}
	return words, nil
}

func (r *WordRepository) InsertAll(words []domain.Word) error {
	records := make([]wordRecord, len(words))
	for i, word := range words {
		records[i] = wordRecord{
			English:    word.English,
			Arabic:     word.Arabic,
			Category:   word.Category,
			Difficulty: string(word.Difficulty),
			Enabled:    word.Enabled,
			HintEn:     word.HintEn,
			HintAr:     word.HintAr,
			CreatedAt:  word.CreatedAt,
		}
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		return tx.CreateInBatches(records, 100).Error
	})
}

func (r *WordRepository) ListEnglish() ([]string, error) {
	var english []string
	err := r.db.Model(&wordRecord{}).Pluck("english", &english).Error
	return english, err
}

// CategoriesMissingHints lists categories that still have words without hints.
func (r *WordRepository) CategoriesMissingHints() ([]string, error) {
	var categories []string
	err := r.db.Model(&wordRecord{}).
		Where("hint_en = '' OR hint_ar = ''").
		Distinct().
		Pluck("category", &categories).Error
	return categories, err
}

// SetHintsForCategory backfills the describer hints for every word of a
// category that is still missing them.
func (r *WordRepository) SetHintsForCategory(category, hintEn, hintAr string) error {
	return r.db.Model(&wordRecord{}).
		Where("category = ? AND (hint_en = '' OR hint_ar = '')", category).
		Updates(map[string]any{"hint_en": hintEn, "hint_ar": hintAr}).Error
}

func (r *WordRepository) SetEnabled(id int64, enabled bool) error {
	return r.db.Model(&wordRecord{}).Where("id = ?", id).Update("enabled", enabled).Error
}

// FindUnseenEnabledByDifficulty returns enabled words that have not appeared
// in any game since the pool last reset.
func (r *WordRepository) FindUnseenEnabledByDifficulty(difficulty domain.Difficulty) ([]domain.Word, error) {
	var records []wordRecord
	err := r.db.
		Where("difficulty = ? AND enabled = ? AND seen = ?", string(difficulty), true, false).
		Find(&records).Error
	if err != nil {
		return nil, err
	}
	words := make([]domain.Word, len(records))
	for i, record := range records {
		words[i] = toDomainWord(record)
	}
	return words, nil
}

// SetHintsByEnglish overrides the hints of one word (case-insensitive match).
func (r *WordRepository) SetHintsByEnglish(english, hintEn, hintAr string) error {
	return r.db.Model(&wordRecord{}).
		Where("english = ? COLLATE NOCASE", english).
		Updates(map[string]any{"hint_en": hintEn, "hint_ar": hintAr}).Error
}

// MarkSeen records that a word appeared; it stays out of new decks until the
// pool resets.
func (r *WordRepository) MarkSeen(id int64) error {
	return r.db.Model(&wordRecord{}).Where("id = ?", id).Update("seen", true).Error
}

// ResetSeen returns every word of the difficulty (or all words when empty)
// to the pool of cards that can appear.
func (r *WordRepository) ResetSeen(difficulty domain.Difficulty) error {
	q := r.db.Model(&wordRecord{})
	if difficulty != "" {
		q = q.Where("difficulty = ?", string(difficulty))
	}
	return q.Where("seen = ?", true).Update("seen", false).Error
}
