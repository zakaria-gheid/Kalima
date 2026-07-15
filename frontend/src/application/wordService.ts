import type { Category, Difficulty, Word, WordFilter } from '@/domain/word';
import type { WordRepository } from '@/infrastructure/repositories/wordRepository';

export class WordService {
  constructor(private readonly words: WordRepository) {}

  list(filter: WordFilter = {}): Word[] {
    return this.words.findAll(filter);
  }

  countsByDifficulty(): Record<Difficulty, number> {
    return this.words.countByDifficulty();
  }

  /** Cards per difficulty that have not appeared yet — the remaining pool. */
  remainingByDifficulty(): Record<Difficulty, number> {
    return this.words.countUnseenByDifficulty();
  }

  categories(): Category[] {
    return this.words.listCategories();
  }

  setEnabled(id: number, enabled: boolean): void {
    this.words.setEnabled(id, enabled);
  }
}
