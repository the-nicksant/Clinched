/**
 * Fighter Entity
 *
 * Represents a UFC fighter in the domain model.
 * This is a minimal version with ONLY properties needed for scoring.
 *
 * NOTE: This does NOT include salary, ranking, career stats, etc.
 * Those properties will be added when needed by other services.
 */

import { FighterClass } from "@/domain/value-objects/FighterClass";

export interface Fighter {
  /** Unique identifier */
  id: string;

  /** Fighter's full name */
  name: string;

  /** Primary fighting style (used for synergy calculations) */
  fighterClass: FighterClass;

  /** Age in years (used for Veteran synergy - 35+ is veteran) */
  age: number;
}

/**
 * Helper function to check if a fighter is a veteran (age 35+)
 */
export function isVeteran(fighter: Fighter): boolean {
  return fighter.age >= 35;
}

/**
 * Create a fighter for testing purposes
 */
export function createFighter(params: {
  id: string;
  name: string;
  fighterClass: FighterClass;
  age: number;
}): Fighter {
  return {
    id: params.id,
    name: params.name,
    fighterClass: params.fighterClass,
    age: params.age,
  };
}
