import type { SqliteClient } from '@/infrastructure/db/database';

export class SettingsRepository {
  constructor(private readonly client: SqliteClient) {}

  get(key: string): string | null {
    const rows = this.client.query<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );
    return rows[0]?.value ?? null;
  }

  set(key: string, value: string): void {
    this.client.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }
}
