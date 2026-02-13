/**
 * Leaderboard Repository Interface
 *
 * Defines the contract for leaderboard data access.
 * Implemented by infrastructure layer (ConvexLeaderboardRepository).
 */

export interface LeaderboardEntry {
  rosterId: string;
  userId: string;
  eventId: string;
  totalScore: number;
  rank: number;
  wins: number;
  losses: number;
  captainWon: boolean;
  updatedAt: Date;
}

export interface ILeaderboardRepository {
  /**
   * Get leaderboard entries for an event
   */
  getByEventId(
    eventId: string,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<{
    entries: LeaderboardEntry[];
    total: number;
  }>;

  /**
   * Get a specific user's entry on the leaderboard
   */
  getUserEntry(
    eventId: string,
    userId: string
  ): Promise<LeaderboardEntry | null>;

  /**
   * Update or create a leaderboard entry
   */
  upsert(entry: Omit<LeaderboardEntry, "rank">): Promise<LeaderboardEntry>;

  /**
   * Recalculate all ranks for an event
   */
  recalculateRanks(eventId: string): Promise<void>;

  /**
   * Get total participant count for an event
   */
  getParticipantCount(eventId: string): Promise<number>;
}
