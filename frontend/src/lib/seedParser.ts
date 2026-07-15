import { isDifficulty, type Difficulty } from '@/domain/word';

export interface SeedWord {
  english: string;
  arabic: string;
  category: string;
  difficulty: Difficulty;
}

const EXPECTED_HEADER = 'english|arabic|category|difficulty';

/**
 * Parses the pipe-delimited seed file (`english|arabic|category|difficulty`,
 * one header row). Throws on malformed rows — the seed file is the single
 * source of truth and must never be silently truncated.
 */
export function parseSeedFile(raw: string): SeedWord[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const header = lines[0];
  if (header?.toLowerCase() !== EXPECTED_HEADER) {
    throw new Error(`Seed file header must be "${EXPECTED_HEADER}", got "${header ?? ''}"`);
  }

  const seen = new Set<string>();
  return lines.slice(1).map((line, index) => {
    const fields = line.split('|');
    if (fields.length !== 4) {
      throw new Error(`Seed row ${index + 2} has ${fields.length} fields, expected 4: "${line}"`);
    }
    const [english, arabic, category, difficulty] = fields.map((f) => f.trim()) as [
      string,
      string,
      string,
      string,
    ];
    if (!english || !arabic || !category || !difficulty) {
      throw new Error(`Seed row ${index + 2} has an empty field: "${line}"`);
    }
    if (!isDifficulty(difficulty)) {
      throw new Error(`Seed row ${index + 2} has invalid difficulty "${difficulty}"`);
    }
    const key = english.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Seed row ${index + 2} duplicates English word "${english}"`);
    }
    seen.add(key);
    return { english, arabic, category, difficulty };
  });
}
