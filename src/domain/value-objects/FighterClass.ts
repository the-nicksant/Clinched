/**
 * Fighter Class Value Object
 *
 * Represents the primary fighting style of a fighter.
 * Used for synergy calculations in the scoring system.
 */

export type FighterClass = "Striker" | "Grappler" | "All-Rounder" | "Veteran";

/**
 * All valid fighter classes
 */
export const FIGHTER_CLASSES: ReadonlyArray<FighterClass> = [
  "Striker",
  "Grappler",
  "All-Rounder",
  "Veteran",
] as const;

/**
 * Type guard to check if a string is a valid FighterClass
 */
export function isFighterClass(value: unknown): value is FighterClass {
  return (
    typeof value === "string" &&
    FIGHTER_CLASSES.includes(value as FighterClass)
  );
}
