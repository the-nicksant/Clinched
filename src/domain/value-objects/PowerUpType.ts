/**
 * Power-Up Type Value Object
 *
 * Represents the four strategic power-up cards users can apply to fighters.
 * Each power-up modifies scoring in different ways.
 */

export type PowerUpType = "Hype Train" | "Resilience" | "Blitz" | "Red Mist";

/**
 * All valid power-up types
 */
export const POWER_UP_TYPES: ReadonlyArray<PowerUpType> = [
  "Hype Train",
  "Resilience",
  "Blitz",
  "Red Mist",
] as const;

/**
 * Type guard to check if a string is a valid PowerUpType
 */
export function isPowerUpType(value: unknown): value is PowerUpType {
  return (
    typeof value === "string" &&
    POWER_UP_TYPES.includes(value as PowerUpType)
  );
}

/**
 * Power-Up interface for roster assignments
 */
export interface PowerUp {
  type: PowerUpType;
  appliedToFighterId: string;
}
