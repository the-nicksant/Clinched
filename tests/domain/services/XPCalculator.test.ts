/**
 * XPCalculator Tests
 *
 * Tests XP calculation and level progression.
 *
 * XP Rules:
 * - Base XP: 50 for participation
 * - Captain Win Bonus: +100
 * - Method Bonus: KO +50, Sub +40, Decision +20
 *
 * Level Thresholds:
 * - Level 1: 0 XP
 * - Level 2: 100 XP
 * - Level 3: 300 XP
 * - Level 4: 600 XP
 * - Level 5: 1000 XP
 * - etc.
 */

import { describe, it, expect } from "vitest";
import { XPCalculator } from "@/domain/services/XPCalculator";

describe("XPCalculator", () => {
  describe("Base XP Calculation", () => {
    it("should award base 50 XP for participation", () => {
      const calculator = new XPCalculator();

      const xp = calculator.calculateEventXP({
        captainWon: false,
        captainMethod: null,
      });

      expect(xp).toBe(50);
    });

    it("should award +100 XP when captain wins", () => {
      const calculator = new XPCalculator();

      const xp = calculator.calculateEventXP({
        captainWon: true,
        captainMethod: "Decision",
      });

      // Base (50) + Captain Win (100) + Decision Method (20) = 170
      expect(xp).toBe(170);
    });

    it("should award +50 XP for captain KO/TKO win", () => {
      const calculator = new XPCalculator();

      const xp = calculator.calculateEventXP({
        captainWon: true,
        captainMethod: "KO/TKO",
      });

      // Base (50) + Captain Win (100) + KO Method (50) = 200
      expect(xp).toBe(200);
    });

    it("should award +40 XP for captain Submission win", () => {
      const calculator = new XPCalculator();

      const xp = calculator.calculateEventXP({
        captainWon: true,
        captainMethod: "Submission",
      });

      // Base (50) + Captain Win (100) + Sub Method (40) = 190
      expect(xp).toBe(190);
    });

    it("should not award method bonus if captain lost", () => {
      const calculator = new XPCalculator();

      const xpWithMethod = calculator.calculateEventXP({
        captainWon: false,
        captainMethod: "KO/TKO", // Lost by KO
      });

      // Only base XP, no captain or method bonus
      expect(xpWithMethod).toBe(50);
    });
  });

  describe("Level Calculation", () => {
    it("should return level 1 for 0 XP", () => {
      const calculator = new XPCalculator();
      expect(calculator.calculateLevel(0)).toBe(1);
    });

    it("should return level 1 for 99 XP", () => {
      const calculator = new XPCalculator();
      expect(calculator.calculateLevel(99)).toBe(1);
    });

    it("should return level 2 for 100 XP", () => {
      const calculator = new XPCalculator();
      expect(calculator.calculateLevel(100)).toBe(2);
    });

    it("should return level 3 for 300 XP", () => {
      const calculator = new XPCalculator();
      expect(calculator.calculateLevel(300)).toBe(3);
    });

    it("should return level 5 for 1000 XP", () => {
      const calculator = new XPCalculator();
      expect(calculator.calculateLevel(1000)).toBe(5);
    });

    it("should return level 10 for 4500+ XP", () => {
      const calculator = new XPCalculator();
      expect(calculator.calculateLevel(4500)).toBe(10);
      expect(calculator.calculateLevel(10000)).toBe(10); // Max level
    });
  });

  describe("XP to Next Level", () => {
    it("should calculate XP needed to reach next level", () => {
      const calculator = new XPCalculator();

      // At 0 XP, need 100 to reach level 2
      expect(calculator.xpToNextLevel(0)).toBe(100);

      // At 50 XP, need 50 more to reach level 2
      expect(calculator.xpToNextLevel(50)).toBe(50);

      // At 100 XP (level 2), need 200 to reach level 3
      expect(calculator.xpToNextLevel(100)).toBe(200);

      // At 250 XP (level 2), need 50 to reach level 3
      expect(calculator.xpToNextLevel(250)).toBe(50);
    });

    it("should return 0 at max level", () => {
      const calculator = new XPCalculator();

      // At max level, no more XP needed
      expect(calculator.xpToNextLevel(4500)).toBe(0);
      expect(calculator.xpToNextLevel(10000)).toBe(0);
    });
  });

  describe("Level Progress", () => {
    it("should calculate progress percentage within current level", () => {
      const calculator = new XPCalculator();

      // 0 XP = 0% of level 1 (0-99)
      expect(calculator.levelProgress(0)).toBe(0);

      // 50 XP = 50% of level 1 (need 100 for level 2)
      expect(calculator.levelProgress(50)).toBe(50);

      // 100 XP = 0% of level 2 (just started)
      expect(calculator.levelProgress(100)).toBe(0);

      // 200 XP = 50% of level 2 (100-299, need 300 for level 3)
      expect(calculator.levelProgress(200)).toBe(50);
    });
  });
});
