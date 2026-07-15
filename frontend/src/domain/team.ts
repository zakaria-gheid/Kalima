/** A team of two players: one describes the word, the other guesses it. */
export interface Team {
  id: number;
  describer: string;
  guesser: string;
}

/** Player names as entered before a game; normalized into a Team on start. */
export interface TeamInput {
  describer: string;
  guesser: string;
}

/** One leaderboard row: a team with its accumulated points (cards won). */
export interface TeamStanding {
  teamId: number;
  describer: string;
  guesser: string;
  totalPoints: number;
  gamesPlayed: number;
}
