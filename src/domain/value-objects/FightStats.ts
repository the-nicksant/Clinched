/**
 * Fight Stats Value Object
 *
 * Represents in-fight statistics used for volume scoring.
 * Volume points are awarded even when a fighter loses.
 */

export interface FightStats {
  /** Number of knockdowns landed */
  knockdowns: number;

  /** Number of successful takedowns */
  takedowns: number;

  /** Number of submission attempts (must be legitimate, >3 seconds) */
  submissionAttempts: number;

  /** Number of significant strikes landed (head/body, not leg kicks) */
  significantStrikes: number;
}

/**
 * Create empty fight stats (all zeros)
 */
export function createEmptyFightStats(): FightStats {
  return {
    knockdowns: 0,
    takedowns: 0,
    submissionAttempts: 0,
    significantStrikes: 0,
  };
}

/**
 * Type guard to check if an object is valid FightStats
 */
export function isFightStats(value: unknown): value is FightStats {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const stats = value as Record<string, unknown>;

  return (
    typeof stats.knockdowns === "number" &&
    typeof stats.takedowns === "number" &&
    typeof stats.submissionAttempts === "number" &&
    typeof stats.significantStrikes === "number" &&
    stats.knockdowns >= 0 &&
    stats.takedowns >= 0 &&
    stats.submissionAttempts >= 0 &&
    stats.significantStrikes >= 0
  );
}
