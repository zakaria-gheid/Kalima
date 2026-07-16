/**
 * Word-specific describer hints, parsed from assets/data/word_hints.txt
 * (pipe-delimited: english|hint_en|hint_ar). These override the generic
 * per-category hints for the words they cover; words without an entry keep
 * the category hint. Extend the file to cover more words — no code changes
 * needed.
 */
export interface WordHint {
  english: string;
  hintEn: string;
  hintAr: string;
}

export function parseWordHints(raw: string): WordHint[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  return lines.map((line, index) => {
    const fields = line.split('|');
    if (fields.length !== 3) {
      throw new Error(`Hint row ${index + 1} has ${fields.length} fields, expected 3: "${line}"`);
    }
    const [english, hintEn, hintAr] = fields.map((f) => f.trim()) as [string, string, string];
    if (!english || !hintEn || !hintAr) {
      throw new Error(`Hint row ${index + 1} has an empty field: "${line}"`);
    }
    return { english, hintEn, hintAr };
  });
}
