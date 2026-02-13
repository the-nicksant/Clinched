/**
 * Salary Calculator
 *
 * Calculates fighter salaries based on ranking and modifiers.
 *
 * Base Salary Ranges:
 * - Champion: $2,300 - $2,500
 * - Top 5: $2,000 - $2,299
 * - Top 10: $1,700 - $1,999
 * - Top 15: $1,400 - $1,699
 * - Unranked: $1,000 - $1,399
 *
 * Modifiers:
 * - Opponent vs Champion: +$200
 * - Title Fight: +$300
 * - Win Streak 3+: +$100
 * - Win Streak 5+: +$200
 */

import { SALARY_RANGES } from "@/shared/constants/game-config";

export interface SalaryInput {
  /** Fighter's current ranking (0 = champion, null = unranked) */
  rank: number | null;

  /** Is this fighter the current champion? */
  isChampion?: boolean;

  /** Is opponent the champion? */
  opponentIsChampion?: boolean;

  /** Is this a title fight? */
  isTitleFight?: boolean;

  /** Current win streak */
  winStreak?: number;
}

export class SalaryCalculator {
  private static readonly OPPONENT_CHAMPION_BONUS = 200;
  private static readonly TITLE_FIGHT_BONUS = 300;
  private static readonly WIN_STREAK_3_BONUS = 100;
  private static readonly WIN_STREAK_5_BONUS = 200;

  /**
   * Calculate the salary for a fighter
   */
  calculateSalary(input: SalaryInput): number {
    // Step 1: Get base salary from ranking
    const baseSalary = this.getBaseSalary(input.rank, input.isChampion);

    // Step 2: Add modifiers
    let totalSalary = baseSalary;

    if (input.opponentIsChampion) {
      totalSalary += SalaryCalculator.OPPONENT_CHAMPION_BONUS;
    }

    if (input.isTitleFight) {
      totalSalary += SalaryCalculator.TITLE_FIGHT_BONUS;
    }

    if (input.winStreak) {
      if (input.winStreak >= 5) {
        totalSalary += SalaryCalculator.WIN_STREAK_5_BONUS;
      } else if (input.winStreak >= 3) {
        totalSalary += SalaryCalculator.WIN_STREAK_3_BONUS;
      }
    }

    // Step 3: Cap at max salary
    return Math.min(totalSalary, SALARY_RANGES.MAX);
  }

  /**
   * Get base salary from ranking
   */
  private getBaseSalary(rank: number | null, isChampion?: boolean): number {
    // Champion
    if (isChampion || rank === 0) {
      return this.getMidpoint(SALARY_RANGES.CHAMPION);
    }

    // Unranked
    if (rank === null || rank > 15) {
      return this.getMidpoint(SALARY_RANGES.UNRANKED);
    }

    // Top 5 (ranks 1-5)
    if (rank >= 1 && rank <= 5) {
      return this.getMidpoint(SALARY_RANGES.TOP_5);
    }

    // Top 10 (ranks 6-10)
    if (rank >= 6 && rank <= 10) {
      return this.getMidpoint(SALARY_RANGES.TOP_10);
    }

    // Top 15 (ranks 11-15)
    if (rank >= 11 && rank <= 15) {
      return this.getMidpoint(SALARY_RANGES.TOP_15);
    }

    // Default to unranked
    return this.getMidpoint(SALARY_RANGES.UNRANKED);
  }

  /**
   * Get midpoint of a salary range (deterministic)
   */
  private getMidpoint(range: { min: number; max: number }): number {
    return Math.floor((range.min + range.max) / 2);
  }
}
