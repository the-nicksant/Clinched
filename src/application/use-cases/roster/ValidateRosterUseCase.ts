/**
 * Validate Roster Use Case
 *
 * Orchestrates roster validation for real-time feedback during roster building.
 * Returns detailed validation results with suggestions for the UI.
 */

import { RosterValidator } from "@/domain/services/RosterValidator";
import { Roster } from "@/domain/entities/Roster";
import {
  ValidationResultDTO,
  ValidationErrorDTO,
  ValidationErrorCode,
  RealTimeValidationDTO,
} from "@/application/dto/ValidationResultDTO";
import { GAME_CONFIG } from "@/shared/constants/game-config";

export interface ValidateRosterInput {
  roster: Roster;
}

export interface ValidateRosterOutput {
  success: boolean;
  data?: RealTimeValidationDTO;
  error?: string;
}

export class ValidateRosterUseCase {
  constructor(private rosterValidator: RosterValidator) {}

  execute(input: ValidateRosterInput): ValidateRosterOutput {
    try {
      const { roster } = input;

      // 1. Run domain validation
      const validationResult = this.rosterValidator.validate(roster);

      // 2. Map errors to DTOs
      const errors: ValidationErrorDTO[] = validationResult.errors.map(
        (error) => this.mapErrorToDTO(error, roster)
      );

      // 3. Calculate stats
      const totalSalary = roster.fighters.reduce(
        (sum, f) => sum + (f.salary || 0),
        0
      );
      const salaryCap = GAME_CONFIG.SALARY_CAP;

      // 4. Build validation result DTO
      const validation: ValidationResultDTO = {
        isValid: validationResult.isValid,
        errors,
        fighterCountValid: roster.fighters.length === 6,
        salaryCapValid: totalSalary <= salaryCap,
        captainValid:
          roster.captainId !== "" &&
          roster.fighters.some((f) => f.id === roster.captainId),
        powerUpsValid: roster.powerUps.length <= 2,
        noDuplicates:
          new Set(roster.fighters.map((f) => f.id)).size ===
          roster.fighters.length,
        noBoutConflicts: true, // Requires event context, validated separately
      };

      // 5. Generate suggestions
      const suggestions = this.generateSuggestions(roster, validation);

      // 6. Build real-time validation DTO
      const data: RealTimeValidationDTO = {
        canSubmit: validationResult.isValid,
        validation,
        stats: {
          fighterCount: roster.fighters.length,
          maxFighters: 6,
          totalSalary,
          salaryCap,
          remainingBudget: salaryCap - totalSalary,
          hasCaptain:
            roster.captainId !== "" &&
            roster.fighters.some((f) => f.id === roster.captainId),
          powerUpCount: roster.powerUps.length,
          maxPowerUps: 2,
        },
        suggestions,
      };

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private mapErrorToDTO(
    errorMessage: string,
    roster: Roster
  ): ValidationErrorDTO {
    // Map error messages to typed error codes
    if (errorMessage.includes("6 fighters")) {
      return {
        code: "INVALID_FIGHTER_COUNT",
        message: errorMessage,
        field: "fighters",
        details: {
          expected: 6,
          actual: roster.fighters.length,
        },
      };
    }

    if (errorMessage.includes("captain")) {
      if (errorMessage.includes("not in roster")) {
        return {
          code: "CAPTAIN_NOT_IN_ROSTER",
          message: errorMessage,
          field: "captainId",
        };
      }
      return {
        code: "NO_CAPTAIN",
        message: errorMessage,
        field: "captainId",
      };
    }

    if (errorMessage.includes("power-up")) {
      if (errorMessage.includes("maximum")) {
        return {
          code: "TOO_MANY_POWERUPS",
          message: errorMessage,
          field: "powerUps",
          details: {
            expected: 2,
            actual: roster.powerUps.length,
          },
        };
      }
      return {
        code: "POWERUP_INVALID_TARGET",
        message: errorMessage,
        field: "powerUps",
      };
    }

    if (errorMessage.includes("duplicate")) {
      const fighterIds = roster.fighters.map((f) => f.id);
      const duplicates = fighterIds.filter(
        (id, index) => fighterIds.indexOf(id) !== index
      );
      return {
        code: "DUPLICATE_FIGHTERS",
        message: errorMessage,
        field: "fighters",
        details: {
          conflictingIds: duplicates,
        },
      };
    }

    // Default mapping
    return {
      code: "INVALID_FIGHTER_COUNT",
      message: errorMessage,
    };
  }

  private generateSuggestions(
    roster: Roster,
    validation: ValidationResultDTO
  ): string[] {
    const suggestions: string[] = [];

    if (!validation.fighterCountValid) {
      const count = roster.fighters.length;
      if (count < 6) {
        suggestions.push(`Add ${6 - count} more fighter(s) to complete your roster`);
      } else {
        suggestions.push(`Remove ${count - 6} fighter(s) from your roster`);
      }
    }

    if (!validation.salaryCapValid) {
      suggestions.push(
        "Consider replacing high-salary fighters with lower-ranked alternatives"
      );
    }

    if (!validation.captainValid) {
      suggestions.push("Select one of your fighters as captain for bonus points");
    }

    if (!validation.powerUpsValid) {
      suggestions.push("Remove a power-up to meet the maximum of 2 allowed");
    }

    if (!validation.noDuplicates) {
      suggestions.push("Remove duplicate fighters from your roster");
    }

    return suggestions;
  }
}
