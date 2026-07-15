import type { Team, TeamInput, TeamStanding } from '@/domain/team';
import type { SessionRepository } from '@/infrastructure/repositories/sessionRepository';
import type { SettingsRepository } from '@/infrastructure/repositories/settingsRepository';
import type { TeamRepository } from '@/infrastructure/repositories/teamRepository';

const LAST_DESCRIBER_KEY = 'lastDescriber';
const LAST_GUESSER_KEY = 'lastGuesser';

export class TeamService {
  constructor(
    private readonly teams: TeamRepository,
    private readonly sessions: SessionRepository,
    private readonly settings: SettingsRepository,
  ) {}

  /**
   * Normalizes the entered names, finds or creates the team, and remembers
   * it so the next game preselects the same players.
   */
  getOrCreate(input: TeamInput): Team {
    const describer = input.describer.trim();
    const guesser = input.guesser.trim();
    if (!describer || !guesser) {
      throw new Error('Both a describer and a guesser name are required');
    }
    const team = this.teams.findOrCreate(describer, guesser);
    this.settings.set(LAST_DESCRIBER_KEY, team.describer);
    this.settings.set(LAST_GUESSER_KEY, team.guesser);
    return team;
  }

  /** The last team that played, to prefill the new-game form. */
  lastTeam(): TeamInput | null {
    const describer = this.settings.get(LAST_DESCRIBER_KEY);
    const guesser = this.settings.get(LAST_GUESSER_KEY);
    return describer && guesser ? { describer, guesser } : null;
  }

  /** Teams ordered best-first by total points (cards won). */
  leaderboard(): TeamStanding[] {
    return this.teams.leaderboard();
  }

  /**
   * Erases all previous results: every recorded game session and every team.
   * The last-used player names are kept so the next game form stays prefilled.
   */
  clearLeaderboard(): void {
    this.sessions.deleteAll();
    this.teams.deleteAll();
  }
}
