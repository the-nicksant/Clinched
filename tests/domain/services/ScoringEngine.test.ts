/**
 * ScoringEngine Tests
 *
 * Tests the core scoring formula: S = [((V × M) + Vol + R + B) × Syn] × Cap × PU - P
 *
 * Following TDD approach:
 * 1. Write failing test (RED)
 * 2. Make it pass with minimal code (GREEN)
 * 3. Refactor while keeping tests green (REFACTOR)
 */

import { describe, it, expect } from "vitest";
import { ScoringEngine } from "@/domain/services/ScoringEngine";
import { Fighter, createFighter } from "@/domain/entities/Fighter";
import { Fight } from "@/domain/entities/Fight";
import { Roster, createRoster } from "@/domain/entities/Roster";
import { FightStats } from "@/domain/value-objects/FightStats";

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a test fighter with sensible defaults
 */
function createTestFighter(
  overrides: Partial<Fighter> & { id: string }
): Fighter {
  return createFighter({
    name: overrides.name || `Fighter ${overrides.id}`,
    fighterClass: overrides.fighterClass || "Striker",
    age: overrides.age || 28,
    ...overrides,
  });
}

/**
 * Create a test fight with sensible defaults
 */
function createTestFight(
  overrides: Partial<Fight> & { winnerId: string | null }
): Fight {
  return {
    id: overrides.id || "fight-1",
    winnerId: overrides.winnerId,
    method: overrides.method || "KO/TKO",
    decisionType: overrides.decisionType,
    round: overrides.round || 1,
    stats: overrides.stats || {},
    bonuses: overrides.bonuses || {
      fightOfTheNight: false,
      performanceBonus: [],
    },
    penalties: overrides.penalties,
  };
}

/**
 * Create empty fight stats
 */
function createEmptyStats(): FightStats {
  return {
    knockdowns: 0,
    takedowns: 0,
    submissionAttempts: 0,
    significantStrikes: 0,
  };
}

/**
 * Create a test roster with sensible defaults
 * NOTE: By default, captainId is set to "default-captain" (not in roster)
 * to avoid applying captain multiplier in non-captain tests
 */
function createTestRoster(
  overrides: Partial<Roster> & { fighters: Fighter[] }
): Roster {
  return createRoster({
    id: overrides.id || "roster-1",
    fighters: overrides.fighters,
    captainId: overrides.captainId || "default-captain",
    powerUps: overrides.powerUps || [],
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ScoringEngine", () => {
  describe("Basic Victory Calculation (V × M)", () => {
    it("should calculate basic KO win with no volume or bonuses", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "Test Fighter",
        fighterClass: "Striker",
      });

      const fight = createTestFight({
        winnerId: "f1", // Fighter wins
        method: "KO/TKO",
        round: 2,
        stats: {
          f1: createEmptyStats(), // No volume
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
        captainId: "other-fighter", // NOT captain
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Volume = 0
      // Round bonus = 60 (Round 2)
      // UFC Bonus = 0
      // Base = 200 + 0 + 60 + 0 = 260
      // Synergy = 1.0 (no synergy active)
      // Captain = 1.0 (not captain)
      // Power-up = none
      // Penalties = 0
      // Total = 260
      expect(score.value).toBe(260);
    });

    it("should calculate basic Submission win", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        fighterClass: "Grappler",
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "Submission",
        round: 1,
        stats: {
          f1: createEmptyStats(),
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 1.8 = 180
      // Round bonus = 100 (Round 1)
      // Base = 180 + 0 + 100 + 0 = 280
      expect(score.value).toBe(280);
    });

    it("should calculate Unanimous Decision win", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        fighterClass: "All-Rounder",
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "Decision",
        decisionType: "Unanimous",
        round: 3,
        stats: {
          f1: createEmptyStats(),
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 1.2 = 120
      // Round bonus = 0 (decisions don't get round bonuses)
      // Base = 120
      expect(score.value).toBe(120);
    });

    it("should return 0 for a loss with no volume", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
      });

      const fight = createTestFight({
        winnerId: "f2", // Fighter loses
        method: "KO/TKO",
        round: 1,
        stats: {
          f1: createEmptyStats(), // No volume
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 0 (loss)
      // Volume = 0
      // Total = 0
      expect(score.value).toBe(0);
    });
  });

  describe("Volume Points (Vol)", () => {
    it("should calculate volume points even when fighter loses (Example 3: Tony Ferguson)", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      // Tony Ferguson loses but has high volume
      const fighter = createTestFighter({
        id: "tony",
        name: "Tony Ferguson",
        fighterClass: "All-Rounder",
      });

      const fight = createTestFight({
        winnerId: "opponent", // Tony loses
        method: "Decision",
        round: 3,
        stats: {
          tony: {
            knockdowns: 1, // 1 × 20 = 20
            takedowns: 3, // 3 × 10 = 30
            submissionAttempts: 1, // 1 × 10 = 10
            significantStrikes: 90, // 90 × 0.5 = 45
            // Total: 105
          },
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 0 (loss)
      // Volume = 20 + 30 + 10 + 45 = 105
      // Round bonus = 0 (decision)
      // Total = 105
      expect(score.value).toBe(105);
    });

    it("should add volume points to a winning fighter's score", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        fighterClass: "Striker",
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "KO/TKO",
        round: 2,
        stats: {
          f1: {
            knockdowns: 2, // 2 × 20 = 40
            takedowns: 0,
            submissionAttempts: 0,
            significantStrikes: 50, // 50 × 0.5 = 25
            // Total: 65
          },
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Volume = 40 + 0 + 0 + 25 = 65
      // Round bonus = 60 (Round 2)
      // Base = 200 + 65 + 60 = 325
      expect(score.value).toBe(325);
    });

    it("should calculate all volume components correctly", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
      });

      const fight = createTestFight({
        winnerId: "opponent",
        method: "Decision",
        round: 3,
        stats: {
          f1: {
            knockdowns: 4, // 4 × 20 = 80
            takedowns: 5, // 5 × 10 = 50
            submissionAttempts: 3, // 3 × 10 = 30
            significantStrikes: 100, // 100 × 0.5 = 50
            // Total: 210
          },
        },
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // Volume only (loss) = 80 + 50 + 30 + 50 = 210
      expect(score.value).toBe(210);
    });

    it("should handle missing stats gracefully (no stats for fighter)", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
      });

      const fight = createTestFight({
        winnerId: "opponent",
        method: "KO/TKO",
        round: 1,
        stats: {}, // No stats provided
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // Volume = 0 (no stats)
      expect(score.value).toBe(0);
    });
  });

  describe("Synergy System (Syn)", () => {
    describe("Striker Synergy (3+ Strikers → 1.15× on KO/TKO)", () => {
      it("should apply 1.15× multiplier when 3+ Strikers and fighter wins by KO/TKO", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "striker1",
          name: "Striker Fighter",
          fighterClass: "Striker",
        });

        // Create a roster with 3 Strikers (synergy active)
        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({ id: "striker2", fighterClass: "Striker" }),
            createTestFighter({ id: "striker3", fighterClass: "Striker" }),
            createTestFighter({ id: "grappler1", fighterClass: "Grappler" }),
            createTestFighter({ id: "grappler2", fighterClass: "Grappler" }),
            createTestFighter({
              id: "allrounder1",
              fighterClass: "All-Rounder",
            }),
          ],
        });

        const fight = createTestFight({
          winnerId: "striker1",
          method: "KO/TKO", // Must be KO/TKO for Striker synergy
          round: 2,
          stats: {
            striker1: {
              knockdowns: 2, // 40
              takedowns: 0,
              submissionAttempts: 0,
              significantStrikes: 50, // 25
              // Volume: 65
            },
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Volume = 65
        // Round = 60
        // Base = 325
        // Synergy (Striker won by KO): 325 × 1.15 = 373.75
        expect(score.value).toBe(373.75);
      });

      it("should NOT apply synergy when Striker wins by Decision (not KO/TKO)", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "striker1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({ id: "striker2", fighterClass: "Striker" }),
            createTestFighter({ id: "striker3", fighterClass: "Striker" }),
            createTestFighter({ id: "other1", fighterClass: "Grappler" }),
            createTestFighter({ id: "other2", fighterClass: "Grappler" }),
            createTestFighter({ id: "other3", fighterClass: "All-Rounder" }),
          ],
        });

        const fight = createTestFight({
          winnerId: "striker1",
          method: "Decision", // NOT KO/TKO - synergy doesn't apply
          decisionType: "Unanimous",
          round: 3,
          stats: {
            striker1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 1.2 = 120
        // Synergy: NO (wrong method) → 1.0
        // Total = 120
        expect(score.value).toBe(120);
      });

      it("should NOT apply synergy when only 2 Strikers in roster", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "striker1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({ id: "striker2", fighterClass: "Striker" }), // Only 2 Strikers
            createTestFighter({ id: "grappler1", fighterClass: "Grappler" }),
            createTestFighter({ id: "grappler2", fighterClass: "Grappler" }),
            createTestFighter({ id: "grappler3", fighterClass: "Grappler" }),
            createTestFighter({
              id: "allrounder1",
              fighterClass: "All-Rounder",
            }),
          ],
        });

        const fight = createTestFight({
          winnerId: "striker1",
          method: "KO/TKO",
          round: 1,
          stats: {
            striker1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Round = 100
        // Base = 300
        // Synergy: NO (only 2 Strikers) → 1.0
        // Total = 300
        expect(score.value).toBe(300);
      });
    });

    describe("Grappler Synergy (3+ Grapplers → 1.15× on Submission)", () => {
      it("should apply 1.15× multiplier when 3+ Grapplers and fighter wins by Submission", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "grappler1",
          name: "Grappler Fighter",
          fighterClass: "Grappler",
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({ id: "grappler2", fighterClass: "Grappler" }),
            createTestFighter({ id: "grappler3", fighterClass: "Grappler" }),
            createTestFighter({ id: "striker1", fighterClass: "Striker" }),
            createTestFighter({ id: "striker2", fighterClass: "Striker" }),
            createTestFighter({
              id: "allrounder1",
              fighterClass: "All-Rounder",
            }),
          ],
        });

        const fight = createTestFight({
          winnerId: "grappler1",
          method: "Submission", // Must be Submission for Grappler synergy
          round: 1,
          stats: {
            grappler1: {
              knockdowns: 0,
              takedowns: 1, // 10
              submissionAttempts: 2, // 20
              significantStrikes: 20, // 10
              // Volume: 40
            },
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 1.8 = 180
        // Volume = 40
        // Round = 100
        // Base = 320
        // Synergy (Grappler won by Sub): 320 × 1.15 = 368
        expect(score.value).toBe(368);
      });

      it("should NOT apply synergy when Grappler wins by KO (not Submission)", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "grappler1",
          fighterClass: "Grappler",
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({ id: "grappler2", fighterClass: "Grappler" }),
            createTestFighter({ id: "grappler3", fighterClass: "Grappler" }),
            createTestFighter({ id: "other1", fighterClass: "Striker" }),
            createTestFighter({ id: "other2", fighterClass: "Striker" }),
            createTestFighter({ id: "other3", fighterClass: "All-Rounder" }),
          ],
        });

        const fight = createTestFight({
          winnerId: "grappler1",
          method: "KO/TKO", // NOT Submission
          round: 1,
          stats: {
            grappler1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Base = 200 + 100 = 300
        // Synergy: NO (wrong method) → 1.0
        expect(score.value).toBe(300);
      });
    });

    describe("All-Rounder Synergy (3+ All-Rounders → +10 flat on Decision)", () => {
      it("should add 10 flat points when 3+ All-Rounders and fighter wins by Decision", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "allrounder1",
          name: "All-Rounder Fighter",
          fighterClass: "All-Rounder",
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({
              id: "allrounder2",
              fighterClass: "All-Rounder",
            }),
            createTestFighter({
              id: "allrounder3",
              fighterClass: "All-Rounder",
            }),
            createTestFighter({ id: "striker1", fighterClass: "Striker" }),
            createTestFighter({ id: "striker2", fighterClass: "Striker" }),
            createTestFighter({ id: "grappler1", fighterClass: "Grappler" }),
          ],
        });

        const fight = createTestFight({
          winnerId: "allrounder1",
          method: "Decision", // Must be Decision for All-Rounder synergy
          decisionType: "Unanimous",
          round: 3,
          stats: {
            allrounder1: {
              knockdowns: 0,
              takedowns: 0,
              submissionAttempts: 0,
              significantStrikes: 100, // 50
            },
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 1.2 = 120
        // Volume = 50
        // Base = 170
        // Synergy (All-Rounder won by Decision): 170 + 10 = 180 (FLAT bonus, not multiplier!)
        expect(score.value).toBe(180);
      });

      it("should NOT apply synergy when All-Rounder wins by KO", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "allrounder1",
          fighterClass: "All-Rounder",
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({
              id: "allrounder2",
              fighterClass: "All-Rounder",
            }),
            createTestFighter({
              id: "allrounder3",
              fighterClass: "All-Rounder",
            }),
            createTestFighter({ id: "other1", fighterClass: "Striker" }),
            createTestFighter({ id: "other2", fighterClass: "Striker" }),
            createTestFighter({ id: "other3", fighterClass: "Grappler" }),
          ],
        });

        const fight = createTestFight({
          winnerId: "allrounder1",
          method: "KO/TKO", // NOT Decision
          round: 1,
          stats: {
            allrounder1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Base = 200 + 100 = 300
        // Synergy: NO (wrong method) → no +10 bonus
        expect(score.value).toBe(300);
      });
    });

    describe("Veteran Synergy (3+ Veterans age 35+ → negates split decision loss)", () => {
      it("should NOT apply synergy for veteran win (only applies to split decision losses)", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "veteran1",
          name: "Veteran Fighter",
          fighterClass: "Striker",
          age: 38, // Veteran (35+)
        });

        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({
              id: "veteran2",
              fighterClass: "Grappler",
              age: 36,
            }),
            createTestFighter({
              id: "veteran3",
              fighterClass: "All-Rounder",
              age: 35,
            }),
            createTestFighter({
              id: "young1",
              fighterClass: "Striker",
              age: 28,
            }),
            createTestFighter({
              id: "young2",
              fighterClass: "Grappler",
              age: 25,
            }),
            createTestFighter({
              id: "young3",
              fighterClass: "All-Rounder",
              age: 30,
            }),
          ],
        });

        const fight = createTestFight({
          winnerId: "veteran1",
          method: "KO/TKO",
          round: 1,
          stats: {
            veteran1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Normal win calculation, veteran synergy doesn't help wins
        // Base = 200 + 100 = 300
        expect(score.value).toBe(300);
      });

      // NOTE: Veteran synergy (negating split decision loss) will be tested
      // when we implement the full example from SCORING_RULES.md
      // For now, we just need the structure in place
    });

    describe("No Synergy Active", () => {
      it("should not apply any synergy when roster has no class concentration", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          fighterClass: "Striker",
        });

        // Diverse roster - no class has 3+ fighters
        const roster = createTestRoster({
          fighters: [
            fighter,
            createTestFighter({ id: "f2", fighterClass: "Striker" }), // 2 Strikers
            createTestFighter({ id: "f3", fighterClass: "Grappler" }), // 1 Grappler
            createTestFighter({ id: "f4", fighterClass: "Grappler" }), // 2 Grapplers
            createTestFighter({ id: "f5", fighterClass: "All-Rounder" }), // 1 All-Rounder
            createTestFighter({ id: "f6", fighterClass: "All-Rounder" }), // 2 All-Rounders
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "KO/TKO",
          round: 2,
          stats: {
            f1: {
              knockdowns: 1, // 20
              takedowns: 0,
              submissionAttempts: 0,
              significantStrikes: 30, // 15
            },
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Volume = 35
        // Round = 60
        // Base = 295
        // Synergy: 1.0 (none active)
        expect(score.value).toBe(295);
      });
    });
  });

  describe("Captain Multiplier (Cap)", () => {
    it("should apply 1.5× multiplier to captain's score", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const captain = createTestFighter({
        id: "captain1",
        name: "Captain Fighter",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [
          captain,
          createTestFighter({ id: "f2", fighterClass: "Grappler" }),
          createTestFighter({ id: "f3", fighterClass: "All-Rounder" }),
          createTestFighter({ id: "f4", fighterClass: "Striker" }),
          createTestFighter({ id: "f5", fighterClass: "Grappler" }),
          createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
        ],
        captainId: "captain1", // This fighter is the captain
      });

      const fight = createTestFight({
        winnerId: "captain1",
        method: "KO/TKO",
        round: 1,
        stats: {
          captain1: createEmptyStats(),
        },
      });

      // ACT
      const score = engine.calculateFighterScore(captain, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // Base = 300
      // Captain: 300 × 1.5 = 450
      expect(score.value).toBe(450);
    });

    it("should NOT apply captain multiplier to non-captain fighter", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "regular",
        name: "Regular Fighter",
        fighterClass: "Striker",
      });

      const captain = createTestFighter({
        id: "captain1",
        name: "Captain Fighter",
        fighterClass: "Grappler",
      });

      const roster = createTestRoster({
        fighters: [
          captain,
          fighter,
          createTestFighter({ id: "f3", fighterClass: "All-Rounder" }),
          createTestFighter({ id: "f4", fighterClass: "Striker" }),
          createTestFighter({ id: "f5", fighterClass: "Grappler" }),
          createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
        ],
        captainId: "captain1", // Different fighter is captain
      });

      const fight = createTestFight({
        winnerId: "regular",
        method: "KO/TKO",
        round: 1,
        stats: {
          regular: createEmptyStats(),
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // Base = 300
      // Captain: 1.0 (NOT captain)
      // Total = 300
      expect(score.value).toBe(300);
    });

    it("should stack captain multiplier WITH synergy multiplier", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const captain = createTestFighter({
        id: "captain1",
        name: "Captain Striker",
        fighterClass: "Striker",
      });

      // Roster with 3+ Strikers (synergy active) + captain
      const roster = createTestRoster({
        fighters: [
          captain,
          createTestFighter({ id: "striker2", fighterClass: "Striker" }),
          createTestFighter({ id: "striker3", fighterClass: "Striker" }),
          createTestFighter({ id: "f4", fighterClass: "Grappler" }),
          createTestFighter({ id: "f5", fighterClass: "Grappler" }),
          createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
        ],
        captainId: "captain1", // Captain + Striker synergy
      });

      const fight = createTestFight({
        winnerId: "captain1",
        method: "KO/TKO", // Triggers Striker synergy
        round: 2,
        stats: {
          captain1: {
            knockdowns: 2, // 40
            takedowns: 0,
            submissionAttempts: 0,
            significantStrikes: 50, // 25
            // Volume: 65
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(captain, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Volume = 65
      // Round = 60
      // Base = 325
      // Synergy (Striker KO): 325 × 1.15 = 373.75
      // Captain: 373.75 × 1.5 = 560.625 ≈ 560.62 (floating point precision)
      expect(score.value).toBe(560.62);
    });

    it("should apply captain multiplier to volume-only score (loss scenario)", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const captain = createTestFighter({
        id: "captain1",
        name: "Captain Fighter",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [
          captain,
          createTestFighter({ id: "f2", fighterClass: "Grappler" }),
          createTestFighter({ id: "f3", fighterClass: "All-Rounder" }),
          createTestFighter({ id: "f4", fighterClass: "Striker" }),
          createTestFighter({ id: "f5", fighterClass: "Grappler" }),
          createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
        ],
        captainId: "captain1",
      });

      const fight = createTestFight({
        winnerId: "opponent",
        method: "Decision",
        round: 3,
        stats: {
          captain1: {
            knockdowns: 1, // 20
            takedowns: 2, // 20
            submissionAttempts: 1, // 10
            significantStrikes: 50, // 25
            // Volume: 75
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(captain, fight, roster);

      // ASSERT
      // Loss = 0 victory points
      // Volume = 75
      // Base = 75
      // Captain: 75 × 1.5 = 112.5 ≈ 112.5
      expect(score.value).toBe(112.5);
    });
  });

  describe("UFC Bonuses (B)", () => {
    it("should add 100 points for Performance of the Night (POTN)", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "POTN Fighter",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "KO/TKO",
        round: 1,
        stats: {
          f1: createEmptyStats(),
        },
        bonuses: {
          fightOfTheNight: false,
          performanceBonus: ["f1"], // This fighter received POTN
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // UFC Bonus = 100 (POTN)
      // Base = 200 + 100 + 100 = 400
      expect(score.value).toBe(400);
    });

    it("should add 100 points for Fight of the Night (FOTN)", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "FOTN Fighter",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "Decision",
        decisionType: "Split",
        round: 3,
        stats: {
          f1: createEmptyStats(),
        },
        bonuses: {
          fightOfTheNight: true, // Both fighters get FOTN
          performanceBonus: [],
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 1.0 = 100
      // Round = 0 (decision)
      // UFC Bonus = 100 (FOTN)
      // Base = 100 + 100 = 200
      expect(score.value).toBe(200);
    });

    it("should add 200 points for both POTN and FOTN", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "Double Bonus Fighter",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "Submission",
        round: 2,
        stats: {
          f1: {
            knockdowns: 0,
            takedowns: 1, // 10
            submissionAttempts: 2, // 20
            significantStrikes: 20, // 10
            // Volume: 40
          },
        },
        bonuses: {
          fightOfTheNight: true, // FOTN = 100
          performanceBonus: ["f1"], // POTN = 100
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 1.8 = 180
      // Volume = 40
      // Round = 60
      // UFC Bonus = 200 (FOTN + POTN)
      // Base = 180 + 40 + 60 + 200 = 480
      expect(score.value).toBe(480);
    });

    it("should award FOTN to losing fighter too", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "loser",
        name: "Loser with FOTN",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "winner",
        method: "Decision",
        decisionType: "Split",
        round: 3,
        stats: {
          loser: {
            knockdowns: 1, // 20
            takedowns: 0,
            submissionAttempts: 0,
            significantStrikes: 50, // 25
            // Volume: 45
          },
        },
        bonuses: {
          fightOfTheNight: true, // Both fighters get FOTN
          performanceBonus: ["winner"], // Only winner gets POTN
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // Loss = 0 victory points
      // Volume = 45
      // UFC Bonus = 100 (FOTN only, not POTN)
      // Base = 0 + 45 + 100 = 145
      expect(score.value).toBe(145);
    });

    it("should apply synergy and captain multipliers AFTER UFC bonuses", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const captain = createTestFighter({
        id: "captain1",
        name: "Captain with POTN",
        fighterClass: "Striker",
      });

      // Roster with 3+ Strikers (synergy active) + captain
      const roster = createTestRoster({
        fighters: [
          captain,
          createTestFighter({ id: "striker2", fighterClass: "Striker" }),
          createTestFighter({ id: "striker3", fighterClass: "Striker" }),
          createTestFighter({ id: "f4", fighterClass: "Grappler" }),
          createTestFighter({ id: "f5", fighterClass: "Grappler" }),
          createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
        ],
        captainId: "captain1",
      });

      const fight = createTestFight({
        winnerId: "captain1",
        method: "KO/TKO",
        round: 1,
        stats: {
          captain1: createEmptyStats(),
        },
        bonuses: {
          fightOfTheNight: false,
          performanceBonus: ["captain1"], // POTN
        },
      });

      // ACT
      const score = engine.calculateFighterScore(captain, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // UFC Bonus = 100 (POTN)
      // Base = 200 + 100 + 100 = 400
      // Synergy (Striker KO): 400 × 1.15 = 460
      // Captain: 460 × 1.5 = 690
      expect(score.value).toBe(690);
    });

    it("should not add bonuses if fighter didn't receive any", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "Decision",
        decisionType: "Unanimous",
        round: 3,
        stats: {
          f1: createEmptyStats(),
        },
        bonuses: {
          fightOfTheNight: false, // No FOTN
          performanceBonus: [], // No POTN
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 1.2 = 120
      // UFC Bonus = 0 (no bonuses)
      // Base = 120
      expect(score.value).toBe(120);
    });
  });

  describe("Power-Ups (PU)", () => {
    describe("Hype Train (2× win, -2× loss)", () => {
      it("should double the score on a win", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          name: "Hype Train Fighter",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Hype Train",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "KO/TKO",
          round: 1,
          stats: {
            f1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Round = 100
        // Base = 300
        // Hype Train (Win): 300 × 2 = 600
        expect(score.value).toBe(600);
      });

      it("should apply -2× multiplier on a loss (negative score)", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          name: "Hype Train Fighter",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Hype Train",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "opponent",
          method: "Decision",
          round: 3,
          stats: {
            f1: {
              knockdowns: 1, // 20
              takedowns: 0,
              submissionAttempts: 0,
              significantStrikes: 10, // 5
              // Volume: 25
            },
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Loss = 0 victory points
        // Volume = 25
        // Hype Train (Loss): 25 × -2 = -50
        expect(score.value).toBe(-50);
      });
    });

    describe("Resilience (Loss + FOTN → treat as win)", () => {
      it("should treat loss as decision win when fighter has FOTN", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          name: "Resilience Fighter",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Resilience",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "opponent",
          method: "Decision",
          decisionType: "Split",
          round: 3,
          stats: {
            f1: {
              knockdowns: 2, // 40
              takedowns: 1, // 10
              submissionAttempts: 0,
              significantStrikes: 50, // 25
              // Volume: 75
            },
          },
          bonuses: {
            fightOfTheNight: true, // Resilience activates!
            performanceBonus: [],
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Resilience converts loss to decision win
        // V × M = 100 × 1.2 = 120 (Unanimous Decision equivalent)
        // Volume = 75
        // FOTN = 100
        // Base = 120 + 75 + 100 = 295
        expect(score.value).toBe(295);
      });

      it("should NOT activate if fighter lost without FOTN", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Resilience",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "opponent",
          method: "KO/TKO",
          round: 1,
          stats: {
            f1: {
              knockdowns: 0,
              takedowns: 0,
              submissionAttempts: 0,
              significantStrikes: 20, // 10
            },
          },
          bonuses: {
            fightOfTheNight: false, // No FOTN, resilience doesn't activate
            performanceBonus: [],
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Loss without FOTN = just volume
        // Volume = 10
        expect(score.value).toBe(10);
      });

      it("should NOT activate if fighter won (resilience only for losses)", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Resilience",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "KO/TKO",
          round: 1,
          stats: {
            f1: createEmptyStats(),
          },
          bonuses: {
            fightOfTheNight: true,
            performanceBonus: ["f1"],
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Normal win calculation (resilience doesn't change wins)
        // V × M = 100 × 2.0 = 200
        // Round = 100
        // POTN = 100
        // FOTN = 100
        // Base = 200 + 100 + 100 + 100 = 500
        expect(score.value).toBe(500);
      });
    });

    describe("Blitz (3× if R1 finish)", () => {
      it("should triple the score for Round 1 finish", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          name: "Blitz Fighter",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Blitz",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "KO/TKO",
          round: 1, // Must be R1
          stats: {
            f1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Round = 100
        // Base = 300
        // Blitz (R1 finish): 300 × 3 = 900
        expect(score.value).toBe(900);
      });

      it("should NOT activate for Round 2 finish", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Blitz",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "KO/TKO",
          round: 2, // NOT R1
          stats: {
            f1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // Normal score (no blitz)
        // V × M = 100 × 2.0 = 200
        // Round = 60
        // Base = 260
        expect(score.value).toBe(260);
      });

      it("should NOT activate for R1 decision (must be finish)", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Blitz",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "Decision", // NOT a finish
          decisionType: "Unanimous",
          round: 3,
          stats: {
            f1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 1.2 = 120
        expect(score.value).toBe(120);
      });
    });

    describe("Red Mist (+50 per UFC bonus)", () => {
      it("should add 50 points for POTN", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          name: "Red Mist Fighter",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Red Mist",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "KO/TKO",
          round: 1,
          stats: {
            f1: createEmptyStats(),
          },
          bonuses: {
            fightOfTheNight: false,
            performanceBonus: ["f1"], // POTN
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Round = 100
        // POTN = 100
        // Base = 400
        // Red Mist: +50 (1 UFC bonus)
        // Total = 450
        expect(score.value).toBe(450);
      });

      it("should add 100 points for both POTN and FOTN", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          name: "Red Mist Fighter",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Red Mist",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "Submission",
          round: 2,
          stats: {
            f1: createEmptyStats(),
          },
          bonuses: {
            fightOfTheNight: true, // FOTN
            performanceBonus: ["f1"], // POTN
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 1.8 = 180
        // Round = 60
        // POTN = 100
        // FOTN = 100
        // Base = 440
        // Red Mist: +100 (2 UFC bonuses × 50)
        // Total = 540
        expect(score.value).toBe(540);
      });

      it("should NOT add bonus if no UFC bonuses received", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const fighter = createTestFighter({
          id: "f1",
          fighterClass: "Striker",
        });

        const roster = createTestRoster({
          fighters: [fighter],
          powerUps: [
            {
              type: "Red Mist",
              appliedToFighterId: "f1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "f1",
          method: "Decision",
          decisionType: "Unanimous",
          round: 3,
          stats: {
            f1: createEmptyStats(),
          },
          bonuses: {
            fightOfTheNight: false,
            performanceBonus: [],
          },
        });

        // ACT
        const score = engine.calculateFighterScore(fighter, fight, roster);

        // ASSERT
        // V × M = 100 × 1.2 = 120
        // Red Mist: +0 (no UFC bonuses)
        expect(score.value).toBe(120);
      });
    });

    describe("Power-Up Interaction with Synergy and Captain", () => {
      it("should apply power-up AFTER synergy and captain multipliers", () => {
        // ARRANGE
        const engine = new ScoringEngine();

        const captain = createTestFighter({
          id: "captain1",
          name: "Blitz Captain Striker",
          fighterClass: "Striker",
        });

        // Roster with 3+ Strikers (synergy) + captain + Blitz
        const roster = createTestRoster({
          fighters: [
            captain,
            createTestFighter({ id: "striker2", fighterClass: "Striker" }),
            createTestFighter({ id: "striker3", fighterClass: "Striker" }),
            createTestFighter({ id: "f4", fighterClass: "Grappler" }),
            createTestFighter({ id: "f5", fighterClass: "Grappler" }),
            createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
          ],
          captainId: "captain1",
          powerUps: [
            {
              type: "Blitz",
              appliedToFighterId: "captain1",
            },
          ],
        });

        const fight = createTestFight({
          winnerId: "captain1",
          method: "KO/TKO",
          round: 1, // Blitz activates
          stats: {
            captain1: createEmptyStats(),
          },
        });

        // ACT
        const score = engine.calculateFighterScore(captain, fight, roster);

        // ASSERT
        // V × M = 100 × 2.0 = 200
        // Round = 100
        // Base = 300
        // Synergy (Striker KO): 300 × 1.15 = 345
        // Captain: 345 × 1.5 = 517.5
        // Blitz (R1 finish): 517.5 × 3 = 1552.5
        expect(score.value).toBe(1552.5);
      });
    });
  });

  describe("Penalties (P)", () => {
    it("should subtract 50 points for weight miss", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "Fighter who missed weight",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "KO/TKO",
        round: 1,
        stats: {
          f1: createEmptyStats(),
        },
        penalties: {
          f1: {
            weightMiss: true, // Missed weight
            pointDeductions: 0,
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // Base = 300
      // Penalty (Weight Miss) = -50
      // Total = 300 - 50 = 250
      expect(score.value).toBe(250);
    });

    it("should subtract 25 points per point deduction", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "Fighter with point deductions",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "Decision",
        decisionType: "Unanimous",
        round: 3,
        stats: {
          f1: createEmptyStats(),
        },
        penalties: {
          f1: {
            weightMiss: false,
            pointDeductions: 2, // 2 point deductions for fouls
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 1.2 = 120
      // Penalty (2 deductions) = -50
      // Total = 120 - 50 = 70
      expect(score.value).toBe(70);
    });

    it("should subtract both weight miss and point deduction penalties", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        name: "Fighter with all penalties",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "opponent",
        method: "Decision",
        round: 3,
        stats: {
          f1: {
            knockdowns: 1, // 20
            takedowns: 0,
            submissionAttempts: 0,
            significantStrikes: 30, // 15
            // Volume: 35
          },
        },
        penalties: {
          f1: {
            weightMiss: true, // -50
            pointDeductions: 1, // -25
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // Loss = 0 victory points
      // Volume = 35
      // Penalty (Weight + 1 deduction) = -75
      // Total = 35 - 75 = -40
      expect(score.value).toBe(-40);
    });

    it("should not apply penalties if fighter has none", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "KO/TKO",
        round: 1,
        stats: {
          f1: createEmptyStats(),
        },
        penalties: {
          f1: {
            weightMiss: false,
            pointDeductions: 0,
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // Base = 300
      // No penalties
      expect(score.value).toBe(300);
    });

    it("should handle missing penalty data gracefully", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const fighter = createTestFighter({
        id: "f1",
        fighterClass: "Striker",
      });

      const roster = createTestRoster({
        fighters: [fighter],
      });

      const fight = createTestFight({
        winnerId: "f1",
        method: "KO/TKO",
        round: 1,
        stats: {
          f1: createEmptyStats(),
        },
        // No penalties field at all
      });

      // ACT
      const score = engine.calculateFighterScore(fighter, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Round = 100
      // Base = 300
      // No penalties (none specified)
      expect(score.value).toBe(300);
    });

    it("should apply penalties AFTER all multipliers (complete formula test)", () => {
      // ARRANGE
      const engine = new ScoringEngine();

      const captain = createTestFighter({
        id: "captain1",
        name: "Captain Striker with penalties",
        fighterClass: "Striker",
      });

      // Roster with 3+ Strikers (synergy) + captain
      const roster = createTestRoster({
        fighters: [
          captain,
          createTestFighter({ id: "striker2", fighterClass: "Striker" }),
          createTestFighter({ id: "striker3", fighterClass: "Striker" }),
          createTestFighter({ id: "f4", fighterClass: "Grappler" }),
          createTestFighter({ id: "f5", fighterClass: "Grappler" }),
          createTestFighter({ id: "f6", fighterClass: "All-Rounder" }),
        ],
        captainId: "captain1",
      });

      const fight = createTestFight({
        winnerId: "captain1",
        method: "KO/TKO",
        round: 2,
        stats: {
          captain1: {
            knockdowns: 1, // 20
            takedowns: 0,
            submissionAttempts: 0,
            significantStrikes: 10, // 5
            // Volume: 25
          },
        },
        bonuses: {
          fightOfTheNight: false,
          performanceBonus: ["captain1"], // POTN
        },
        penalties: {
          captain1: {
            weightMiss: true, // -50
            pointDeductions: 0,
          },
        },
      });

      // ACT
      const score = engine.calculateFighterScore(captain, fight, roster);

      // ASSERT
      // V × M = 100 × 2.0 = 200
      // Volume = 25
      // Round = 60
      // POTN = 100
      // Base = 385
      // Synergy (Striker KO): 385 × 1.15 = 442.75
      // Captain: 442.75 × 1.5 = 664.125 ≈ 664.12
      // Penalty (Weight Miss): 664.12 - 50 = 614.12
      expect(score.value).toBe(614.12);
    });
  });
});
