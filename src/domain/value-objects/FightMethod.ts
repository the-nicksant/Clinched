/**
 * Fight Method Value Objects
 *
 * Represents the method by which a fight was finished or decided.
 * Used for calculating method multipliers in the scoring system.
 */

export type FightMethod =
  | "KO/TKO"
  | "Submission"
  | "Decision"
  | "DQ"
  | "No Contest"
  | "Draw";

export type DecisionType = "Unanimous" | "Split" | "Majority";

/**
 * All valid fight methods
 */
export const FIGHT_METHODS: ReadonlyArray<FightMethod> = [
  "KO/TKO",
  "Submission",
  "Decision",
  "DQ",
  "No Contest",
  "Draw",
] as const;

/**
 * All valid decision types
 */
export const DECISION_TYPES: ReadonlyArray<DecisionType> = [
  "Unanimous",
  "Split",
  "Majority",
] as const;

/**
 * Type guard to check if a string is a valid FightMethod
 */
export function isFightMethod(value: unknown): value is FightMethod {
  return (
    typeof value === "string" && FIGHT_METHODS.includes(value as FightMethod)
  );
}

/**
 * Type guard to check if a string is a valid DecisionType
 */
export function isDecisionType(value: unknown): value is DecisionType {
  return (
    typeof value === "string" &&
    DECISION_TYPES.includes(value as DecisionType)
  );
}
