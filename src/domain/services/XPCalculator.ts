/**
 * XP Calculator
 *
 * Calculates XP earned from events and manages level progression.
 *
 * XP Sources:
 * - Base XP: 50 for participating in an event
 * - Captain Win Bonus: +100 if captain wins
 * - Method Bonus (captain only): KO +50, Sub +40, Decision +20
 */

import { XP_CONFIG } from "@/shared/constants/game-config";
import { FightMethod } from "@/domain/value-objects/FightMethod";

export interface EventXPInput {
  /** Did the roster's captain win their fight? */
  captainWon: boolean;

  /** Method of victory/defeat for captain */
  captainMethod: FightMethod | null;
}

export class XPCalculator {
  /**
   * Calculate XP earned from a single event
   */
  calculateEventXP(input: EventXPInput): number {
    let totalXP = XP_CONFIG.BASE_XP;

    // Captain win bonus
    if (input.captainWon) {
      totalXP += XP_CONFIG.CAPTAIN_WIN_BONUS;

      // Method bonus (only if captain won)
      if (input.captainMethod) {
        const methodBonus = this.getMethodBonus(input.captainMethod);
        totalXP += methodBonus;
      }
    }

    return totalXP;
  }

  /**
   * Calculate level from total XP
   */
  calculateLevel(totalXP: number): number {
    const thresholds = XP_CONFIG.LEVEL_THRESHOLDS;

    // Find highest level where xpRequired <= totalXP
    let level = 1;
    for (const threshold of thresholds) {
      if (totalXP >= threshold.xpRequired) {
        level = threshold.level;
      } else {
        break;
      }
    }

    return level;
  }

  /**
   * Calculate XP needed to reach next level
   */
  xpToNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    const thresholds = XP_CONFIG.LEVEL_THRESHOLDS;

    // Find next level threshold
    const nextThreshold = thresholds.find((t) => t.level === currentLevel + 1);

    // If at max level, return 0
    if (!nextThreshold) {
      return 0;
    }

    return nextThreshold.xpRequired - currentXP;
  }

  /**
   * Calculate progress percentage within current level (0-100)
   */
  levelProgress(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    const thresholds = XP_CONFIG.LEVEL_THRESHOLDS;

    // Find current and next level thresholds
    const currentThreshold = thresholds.find((t) => t.level === currentLevel);
    const nextThreshold = thresholds.find((t) => t.level === currentLevel + 1);

    // At max level
    if (!nextThreshold || !currentThreshold) {
      return 100;
    }

    const xpInCurrentLevel = currentXP - currentThreshold.xpRequired;
    const xpRequiredForLevel = nextThreshold.xpRequired - currentThreshold.xpRequired;

    return Math.floor((xpInCurrentLevel / xpRequiredForLevel) * 100);
  }

  /**
   * Get method bonus from fight method
   */
  private getMethodBonus(method: FightMethod): number {
    switch (method) {
      case "KO/TKO":
        return XP_CONFIG.METHOD_BONUS["KO/TKO"];
      case "Submission":
        return XP_CONFIG.METHOD_BONUS["Submission"];
      case "Decision":
        return XP_CONFIG.METHOD_BONUS["Decision"];
      default:
        return 0;
    }
  }
}
