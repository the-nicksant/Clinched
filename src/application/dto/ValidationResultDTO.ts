/**
 * Validation Result DTO
 *
 * Data Transfer Object for roster validation results.
 * Provides detailed feedback on validation errors for the UI.
 */

export type ValidationErrorCode =
  | "INVALID_FIGHTER_COUNT"
  | "SALARY_CAP_EXCEEDED"
  | "NO_CAPTAIN"
  | "MULTIPLE_CAPTAINS"
  | "CAPTAIN_NOT_IN_ROSTER"
  | "TOO_MANY_POWERUPS"
  | "POWERUP_INVALID_TARGET"
  | "DUPLICATE_FIGHTERS"
  | "BOUT_CONFLICT";

export interface ValidationErrorDTO {
  code: ValidationErrorCode;
  message: string;
  field?: string;
  details?: {
    expected?: number | string;
    actual?: number | string;
    conflictingIds?: string[];
  };
}

export interface ValidationResultDTO {
  isValid: boolean;
  errors: ValidationErrorDTO[];

  // Summary for UI indicators
  fighterCountValid: boolean;
  salaryCapValid: boolean;
  captainValid: boolean;
  powerUpsValid: boolean;
  noDuplicates: boolean;
  noBoutConflicts: boolean;
}

export interface RealTimeValidationDTO {
  /** Can the user submit this roster? */
  canSubmit: boolean;

  /** Validation summary */
  validation: ValidationResultDTO;

  /** Current roster stats */
  stats: {
    fighterCount: number;
    maxFighters: number;
    totalSalary: number;
    salaryCap: number;
    remainingBudget: number;
    hasCaptain: boolean;
    powerUpCount: number;
    maxPowerUps: number;
  };

  /** Suggestions for fixing errors */
  suggestions: string[];
}
