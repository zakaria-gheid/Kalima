import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseSeedFile } from './seedParser';

const SEED_PATH = fileURLToPath(new URL('../../../assets/data/words_seed.txt', import.meta.url));

describe('parseSeedFile', () => {
  it('parses a valid file', () => {
    const words = parseSeedFile(
      'english|arabic|category|difficulty\nChair|كرسي|Home|easy\nLion|أسد|Animals|medium',
    );
    expect(words).toEqual([
      { english: 'Chair', arabic: 'كرسي', category: 'Home', difficulty: 'easy' },
      { english: 'Lion', arabic: 'أسد', category: 'Animals', difficulty: 'medium' },
    ]);
  });

  it('rejects a missing or wrong header', () => {
    expect(() => parseSeedFile('Chair|كرسي|Home|easy')).toThrow(/header/i);
    expect(() => parseSeedFile('')).toThrow(/header/i);
  });

  it('rejects rows with the wrong number of fields', () => {
    expect(() =>
      parseSeedFile('english|arabic|category|difficulty\nChair|كرسي|Home'),
    ).toThrow(/expected 4/);
  });

  it('rejects invalid difficulties and empty fields', () => {
    expect(() =>
      parseSeedFile('english|arabic|category|difficulty\nChair|كرسي|Home|EASY'),
    ).toThrow(/difficulty/);
    expect(() =>
      parseSeedFile('english|arabic|category|difficulty\nChair||Home|easy'),
    ).toThrow(/empty field/);
  });

  it('rejects duplicate English words', () => {
    expect(() =>
      parseSeedFile(
        'english|arabic|category|difficulty\nChair|كرسي|Home|easy\nchair|كرسي|Home|hard',
      ),
    ).toThrow(/duplicates/);
  });

  it('parses the real seed file: exactly 300 easy, 1000 medium, 300 hard', () => {
    const words = parseSeedFile(readFileSync(SEED_PATH, 'utf-8'));
    expect(words).toHaveLength(1600);
    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const word of words) counts[word.difficulty]++;
    expect(counts).toEqual({ easy: 300, medium: 1000, hard: 300 });
    // Arabic must be present and non-Latin for every row.
    for (const word of words) {
      expect(word.arabic).toMatch(/[؀-ۿ]/);
    }
  });
});
