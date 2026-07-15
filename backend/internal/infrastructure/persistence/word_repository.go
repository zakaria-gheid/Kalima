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

func (r *WordRepository) SetEnabled(id int64, enabled bool) error {
	return r.db.Model(&wordRecord{}).Where("id = ?", id).Update("enabled", enabled).Error
}
