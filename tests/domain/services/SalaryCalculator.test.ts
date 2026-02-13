/**
 * SalaryCalculator Tests
 *
 * Tests fighter salary calculation based on ranking.
 * Salary Ranges:
 * - Champion: $2,300 - $2,500
 * - Top 5: $2,000 - $2,299
 * - Top 10: $1,700 - $1,999
 * - Top 15: $1,400 - $1,699
 * - Unranked: $1,000 - $1,399
 */

import { describe, it, expect } from "vitest";
import { SalaryCalculator } from "@/domain/services/SalaryCalculator";

describe("SalaryCalculator", () => {
  describe("Base Salary by Ranking", () => {
    it("should calculate salary for Champion (rank 0) in top range", () => {
      const calculator = new SalaryCalculator();
      const salary = calculator.calculateSalary({ rank: 0, isChampion: true });

      expect(salary).toBeGreaterThanOrEqual(2300);
      expect(salary).toBeLessThanOrEqual(2500);
    });

    it("should calculate salary for Top 5 (rank 1-5)", () => {
      const calculator = new SalaryCalculator();

      const salary1 = calculator.calculateSalary({ rank: 1 });
      expect(salary1).toBeGreaterThanOrEqual(2000);
      expect(salary1).toBeLessThanOrEqual(2299);

      const salary5 = calculator.calculateSalary({ rank: 5 });
      expect(salary5).toBeGreaterThanOrEqual(2000);
      expect(salary5).toBeLessThanOrEqual(2299);
    });

    it("should calculate salary for Top 10 (rank 6-10)", () => {
      const calculator = new SalaryCalculator();

      const salary6 = calculator.calculateSalary({ rank: 6 });
      expect(salary6).toBeGreaterThanOrEqual(1700);
      expect(salary6).toBeLessThanOrEqual(1999);

      const salary10 = calculator.calculateSalary({ rank: 10 });
      expect(salary10).toBeGreaterThanOrEqual(1700);
      expect(salary10).toBeLessThanOrEqual(1999);
    });

    it("should calculate salary for Top 15 (rank 11-15)", () => {
      const calculator = new SalaryCalculator();

      const salary11 = calculator.calculateSalary({ rank: 11 });
      expect(salary11).toBeGreaterThanOrEqual(1400);
      expect(salary11).toBeLessThanOrEqual(1699);

      const salary15 = calculator.calculateSalary({ rank: 15 });
      expect(salary15).toBeGreaterThanOrEqual(1400);
      expect(salary15).toBeLessThanOrEqual(1699);
    });

    it("should calculate salary for Unranked (rank > 15 or null)", () => {
      const calculator = new SalaryCalculator();

      const salaryNull = calculator.calculateSalary({ rank: null });
      expect(salaryNull).toBeGreaterThanOrEqual(1000);
      expect(salaryNull).toBeLessThanOrEqual(1399);

      const salary20 = calculator.calculateSalary({ rank: 20 });
      expect(salary20).toBeGreaterThanOrEqual(1000);
      expect(salary20).toBeLessThanOrEqual(1399);
    });
  });

  describe("Salary Modifiers", () => {
    it("should add opponent bonus when facing champion", () => {
      const calculator = new SalaryCalculator();

      const baseSalary = calculator.calculateSalary({ rank: 5 });
      const withChampionBonus = calculator.calculateSalary({
        rank: 5,
        opponentIsChampion: true,
      });

      expect(withChampionBonus).toBeGreaterThan(baseSalary);
    });

    it("should add title fight bonus", () => {
      const calculator = new SalaryCalculator();

      const baseSalary = calculator.calculateSalary({ rank: 3 });
      const withTitleBonus = calculator.calculateSalary({
        rank: 3,
        isTitleFight: true,
      });

      expect(withTitleBonus).toBeGreaterThan(baseSalary);
    });

    it("should add win streak bonus for 3+ wins", () => {
      const calculator = new SalaryCalculator();

      const baseSalary = calculator.calculateSalary({ rank: 10 });
      const with3Wins = calculator.calculateSalary({
        rank: 10,
        winStreak: 3,
      });
      const with5Wins = calculator.calculateSalary({
        rank: 10,
        winStreak: 5,
      });

      expect(with3Wins).toBeGreaterThan(baseSalary);
      expect(with5Wins).toBeGreaterThan(with3Wins);
    });

    it("should not exceed max salary cap ($2,500)", () => {
      const calculator = new SalaryCalculator();

      // Champion with all bonuses
      const salary = calculator.calculateSalary({
        rank: 0,
        isChampion: true,
        isTitleFight: true,
        winStreak: 10,
      });

      expect(salary).toBeLessThanOrEqual(2500);
    });
  });

  describe("Deterministic Salary", () => {
    it("should calculate consistent salary for same inputs", () => {
      const calculator = new SalaryCalculator();

      const salary1 = calculator.calculateSalary({ rank: 5 });
      const salary2 = calculator.calculateSalary({ rank: 5 });

      expect(salary1).toBe(salary2);
    });
  });
});
