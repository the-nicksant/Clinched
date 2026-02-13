/**
 * Leaderboard Entry DTO
 *
 * Data Transfer Object for leaderboard display.
 * Contains all data needed to render leaderboard rows.
 */

export interface LeaderboardEntryDTO {
  rank: number;
  previousRank?: number;
  rankChange: number; // positive = moved up, negative = moved down, 0 = no change

  userId: string;
  username: string;
  avatarUrl?: string;

  rosterId: string;
  totalScore: number;

  // Quick stats
  wins: number;
  losses: number;
  captainName: string;
  captainWon: boolean;

  // Highlights
  topScorerName: string;
  topScorerScore: number;
  powerUpsUsed: number;
  synergiesActivated: number;

  // User level/XP info
  userLevel: number;
  xpEarned: number;
}

export interface LeaderboardDTO {
  eventId: string;
  eventName: string;
  eventDate: Date;

  entries: LeaderboardEntryDTO[];
  totalParticipants: number;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;

  // Current user's position (if logged in)
  currentUserEntry?: LeaderboardEntryDTO;

  // Timestamps
  lastUpdated: Date;
  isLive: boolean;
}

export interface LeaderboardFilterDTO {
  eventId: string;
  page?: number;
  pageSize?: number;
  searchUsername?: string;
  minLevel?: number;
  maxLevel?: number;
}

export interface LeaderboardStatsDTO {
  eventId: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;

  // Distribution
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];

  // Top performers
  topCaptains: {
    fighterName: string;
    timesSelected: number;
    averageScore: number;
  }[];

  topPowerUps: {
    powerUpName: string;
    timesUsed: number;
    averageImpact: number;
  }[];
}
