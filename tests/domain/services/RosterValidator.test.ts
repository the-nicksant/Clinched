/**
 * RosterValidator Tests
 *
 * Tests roster validation rules using TDD approach.
 * Validation Rules:
 * 1. Must have exactly 6 fighters
 * 2. Total salary must be ≤ $10,000
 * 3. Must have exactly 1 captain
 * 4. Maximum 2 power-ups
 * 5. No duplicate fighters
 * 6. Cannot select both fighters from the same bout
 */

import { describe, it, expect } from "vitest";
import { RosterValidator, ValidationResult } from "@/domain/services/RosterValidator";
import { Fighter, createFighter } from "@/domain/entities/Fighter";
import { Roster, createRoster } from "@/domain/entities/Roster";

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a valid baseline roster for testing
 */
function createValidRoster(overrides?: Partial<Roster>): Roster {
  const fighters: Fighter[] = [
    createFighter({ id: "f1", name: "Fighter 1", fighterClass: "Striker", age: 28 }),
    createFighter({ id: "f2", name: "Fighter 2", fighterClass: "Grappler", age: 30 }),
    createFighter({ id: "f3", name: "Fighter 3", fighterClass: "All-Rounder", age: 25 }),
    createFighter({ id: "f4", name: "Fighter 4", fighterClass: "Striker", age: 32 }),
    createFighter({ id: "f5", name: "Fighter 5", fighterClass: "Grappler", age: 27 }),
    createFighter({ id: "f6", name: "Fighter 6", fighterClass: "All-Rounder", age: 29 }),
  ];

  return createRoster({
    id: "roster-1",
    fighters,
    captainId: "f1",
    powerUps: [],
    ...overrides,
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("RosterValidator", () => {
  describe("Valid Roster", () => {
    it("should validate a correct roster with 6 fighters, 1 captain, no power-ups", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const roster = createValidRoster();

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate a roster with 2 power-ups (max allowed)", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const roster = createValidRoster({
        powerUps: [
          { powerUpCardId: "card-1", type: "Hype Train", appliedToFighterId: "f1" },
          { powerUpCardId: "card-2", type: "Resilience", appliedToFighterId: "f2" },
        ],
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Fighter Count Validation", () => {
    it("should reject roster with less than 6 fighters", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const fighters = [
        createFighter({ id: "f1", name: "Fighter 1", fighterClass: "Striker", age: 28 }),
        createFighter({ id: "f2", name: "Fighter 2", fighterClass: "Grappler", age: 30 }),
        createFighter({ id: "f3", name: "Fighter 3", fighterClass: "All-Rounder", age: 25 }),
        createFighter({ id: "f4", name: "Fighter 4", fighterClass: "Striker", age: 32 }),
        createFighter({ id: "f5", name: "Fighter 5", fighterClass: "Grappler", age: 27 }),
      ];

      const roster = createRoster({
        id: "roster-1",
        fighters,
        captainId: "f1",
        powerUps: [],
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Roster must have exactly 6 fighters");
    });

    it("should reject roster with more than 6 fighters", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const fighters = [
        createFighter({ id: "f1", name: "Fighter 1", fighterClass: "Striker", age: 28 }),
        createFighter({ id: "f2", name: "Fighter 2", fighterClass: "Grappler", age: 30 }),
        createFighter({ id: "f3", name: "Fighter 3", fighterClass: "All-Rounder", age: 25 }),
        createFighter({ id: "f4", name: "Fighter 4", fighterClass: "Striker", age: 32 }),
        createFighter({ id: "f5", name: "Fighter 5", fighterClass: "Grappler", age: 27 }),
        createFighter({ id: "f6", name: "Fighter 6", fighterClass: "All-Rounder", age: 29 }),
        createFighter({ id: "f7", name: "Fighter 7", fighterClass: "Striker", age: 26 }),
      ];

      const roster = createRoster({
        id: "roster-1",
        fighters,
        captainId: "f1",
        powerUps: [],
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Roster must have exactly 6 fighters");
    });
  });

  describe("Captain Validation", () => {
    it("should reject roster with no captain", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const roster = createValidRoster({
        captainId: "", // No captain
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Roster must have exactly 1 captain");
    });

    it("should reject roster where captain is not in the fighter list", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const roster = createValidRoster({
        captainId: "non-existent-fighter", // Captain not in roster
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Captain must be one of the fighters in the roster");
    });
  });

  describe("Power-Up Validation", () => {
    it("should reject roster with more than 2 power-ups", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const roster = createValidRoster({
        powerUps: [
          { powerUpCardId: "card-1", type: "Hype Train", appliedToFighterId: "f1" },
          { powerUpCardId: "card-2", type: "Resilience", appliedToFighterId: "f2" },
          { powerUpCardId: "card-3", type: "Blitz", appliedToFighterId: "f3" },
        ],
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Roster can have maximum 2 power-ups");
    });

    it("should reject roster where power-up is applied to fighter not in roster", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const roster = createValidRoster({
        powerUps: [
          { powerUpCardId: "card-1", type: "Hype Train", appliedToFighterId: "non-existent-fighter" },
        ],
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Power-up applied to fighter not in roster");
    });
  });

  describe("Uniqueness Validation", () => {
    it("should reject roster with duplicate fighters", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const fighter1 = createFighter({ id: "f1", name: "Fighter 1", fighterClass: "Striker", age: 28 });

      const roster = createRoster({
        id: "roster-1",
        fighters: [
          fighter1,
          fighter1, // Duplicate
          createFighter({ id: "f3", name: "Fighter 3", fighterClass: "All-Rounder", age: 25 }),
          createFighter({ id: "f4", name: "Fighter 4", fighterClass: "Striker", age: 32 }),
          createFighter({ id: "f5", name: "Fighter 5", fighterClass: "Grappler", age: 27 }),
          createFighter({ id: "f6", name: "Fighter 6", fighterClass: "All-Rounder", age: 29 }),
        ],
        captainId: "f1",
        powerUps: [],
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Roster contains duplicate fighters");
    });
  });

  describe("Multiple Errors", () => {
    it("should return all validation errors", () => {
      // ARRANGE
      const validator = new RosterValidator();
      const fighters = [
        createFighter({ id: "f1", name: "Fighter 1", fighterClass: "Striker", age: 28 }),
        createFighter({ id: "f2", name: "Fighter 2", fighterClass: "Grappler", age: 30 }),
        createFighter({ id: "f3", name: "Fighter 3", fighterClass: "All-Rounder", age: 25 }),
      ]; // Only 3 fighters

      const roster = createRoster({
        id: "roster-1",
        fighters,
        captainId: "non-existent", // Invalid captain
        powerUps: [
          { powerUpCardId: "card-1", type: "Hype Train", appliedToFighterId: "f1" },
          { powerUpCardId: "card-2", type: "Resilience", appliedToFighterId: "f2" },
          { powerUpCardId: "card-3", type: "Blitz", appliedToFighterId: "f3" },
        ], // Too many power-ups
      });

      // ACT
      const result = validator.validate(roster);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain("Roster must have exactly 6 fighters");
      expect(result.errors).toContain("Captain must be one of the fighters in the roster");
      expect(result.errors).toContain("Roster can have maximum 2 power-ups");
    });
  });
});
