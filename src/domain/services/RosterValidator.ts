/**
 * Roster Validator
 *
 * Validates roster composition against game rules.
 *
 * Validation Rules:
 * 1. Must have exactly 6 fighters
 * 2. Total salary must be ≤ $10,000 (validation deferred - salary not in minimal Fighter)
 * 3. Must have exactly 1 captain
 * 4. Maximum 2 power-ups
 * 5. No duplicate fighters
 * 6. Cannot select both fighters from same bout (requires Event context - future)
 */

import { Roster } from "@/domain/entities/Roster";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class RosterValidator {
  /**
   * Validate a roster against all game rules
   */
  validate(roster: Roster): ValidationResult {
    const errors: string[] = [];

    // Rule 1: Must have exactly 6 fighters
    if (roster.fighters.length !== 6) {
      errors.push("Roster must have exactly 6 fighters");
    }

    // Rule 3: Must have exactly 1 captain
    if (!roster.captainId || roster.captainId === "") {
      errors.push("Roster must have exactly 1 captain");
    } else {
      // Captain must be one of the fighters in the roster
      const captainExists = roster.fighters.some(
        (fighter) => fighter.id === roster.captainId
      );
      if (!captainExists) {
        errors.push("Captain must be one of the fighters in the roster");
      }
    }

    // Rule 4: Maximum 2 power-ups
    if (roster.powerUps.length > 2) {
      errors.push("Roster can have maximum 2 power-ups");
    }

    // Power-ups must be applied to fighters in the roster
    for (const powerUp of roster.powerUps) {
      const fighterExists = roster.fighters.some(
        (fighter) => fighter.id === powerUp.appliedToFighterId
      );
      if (!fighterExists) {
        errors.push("Power-up applied to fighter not in roster");
        break; // Only report once
      }
    }

    // Rule 5: No duplicate fighters
    const fighterIds = roster.fighters.map((f) => f.id);
    const uniqueIds = new Set(fighterIds);
    if (fighterIds.length !== uniqueIds.size) {
      errors.push("Roster contains duplicate fighters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
