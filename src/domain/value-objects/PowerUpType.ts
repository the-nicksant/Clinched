/**
 * Power-Up Type Value Object
 *
 * Represents a power-up card applied to a fighter in a roster.
 * Now uses card IDs to reference PowerUpCard entities stored in the database.
 *
 * This allows power-up names, descriptions, and effects to be updated
 * without code changes.
 */

/**
 * Power-Up assignment for a roster
 * References a PowerUpCard by ID and specifies which fighter it's applied to
 */
export interface PowerUp {
  /** ID of the PowerUpCard from the database */
  powerUpCardId: string;

  /** ID of the fighter this power-up is applied to */
  appliedToFighterId: string;

  /**
   * Power-up type for quick access (denormalized from PowerUpCard)
   * Used by PowerUpApplicator for scoring calculations
   */
  type: PowerUpType;
}

/**
 * Legacy type - kept for backwards compatibility during migration
 * @deprecated Use PowerUpCard entity instead
 */
export type PowerUpType = "Hype Train" | "Resilience" | "Blitz" | "Red Mist";

/**
 * @deprecated Use PowerUpCard entity instead
 */
export const POWER_UP_TYPES: ReadonlyArray<PowerUpType> = [
  "Hype Train",
  "Resilience",
  "Blitz",
  "Red Mist",
] as const;
