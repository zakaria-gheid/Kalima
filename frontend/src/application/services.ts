import { getSqliteClient } from '@/infrastructure/db/database';
import { SessionRepository } from '@/infrastructure/repositories/sessionRepository';
import { SettingsRepository } from '@/infrastructure/repositories/settingsRepository';
import { TeamRepository } from '@/infrastructure/repositories/teamRepository';
import { WordRepository } from '@/infrastructure/repositories/wordRepository';
import { GameService } from './gameService';
import { SettingsService } from './settingsService';
import { TeamService } from './teamService';
import { WordService } from './wordService';

export interface Services {
  gameService: GameService;
  wordService: WordService;
  settingsService: SettingsService;
  teamService: TeamService;
}

let servicesPromise: Promise<Services> | null = null;

/** Composition root: wires the SQLite client into repositories and services. */
export function getServices(): Promise<Services> {
  servicesPromise ??= build();
  return servicesPromise;
}

async function build(): Promise<Services> {
  const client = await getSqliteClient();
  const wordRepository = new WordRepository(client);
  const sessionRepository = new SessionRepository(client);
  const settingsRepository = new SettingsRepository(client);
  const teamRepository = new TeamRepository(client);
  return {
    gameService: new GameService(wordRepository, sessionRepository),
    wordService: new WordService(wordRepository),
    settingsService: new SettingsService(settingsRepository),
    teamService: new TeamService(teamRepository, sessionRepository, settingsRepository),
  };
}
