/**
 * Synergy Calculator
 *
 * Determines synergy bonuses based on roster composition and fight outcomes.
 *
 * Synergy Types:
 * - Striker: 3+ Strikers + won by KO/TKO → 1.15× multiplier
 * - Grappler: 3+ Grapplers + won by Submission → 1.15× multiplier
 * - All-Rounder: 3+ All-Rounders + won by Decision → +10 flat bonus
 * - Veteran: 3+ age 35+ + lost by split decision → negates penalty
 */

import { Roster, countFightersByClass } from "@/domain/entities/Roster";
import { Fight, didFighterWin } from "@/domain/entities/Fight";
import { SYNERGY_MULTIPLIERS } from "@/shared/constants/scoring-constants";

export interface SynergyResult {
  multiplier: number;
  flatBonus: number;
  type: string | null;
}

export class SynergyCalculator {
  /**
   * Calculate synergy bonus for a fighter
   * Returns both a multiplier and flat bonus (All-Rounder uses flat bonus)
   */
  calculateSynergy(roster: Roster, fight: Fight, fighterId: string): SynergyResult {
    const classCounts = countFightersByClass(roster);
    const won = didFighterWin(fight, fighterId);

    // Striker Synergy: 3+ Strikers + won by KO/TKO
    if (classCounts.Striker >= 3 && won && fight.method === "KO/TKO") {
      return {
        multiplier: SYNERGY_MULTIPLIERS.STRIKER,
        flatBonus: 0,
        type: "Striker",
      };
    }

    // Grappler Synergy: 3+ Grapplers + won by Submission
    if (classCounts.Grappler >= 3 && won && fight.method === "Submission") {
      return {
        multiplier: SYNERGY_MULTIPLIERS.GRAPPLER,
        flatBonus: 0,
        type: "Grappler",
      };
    }

    // All-Rounder Synergy: 3+ All-Rounders + won by Decision
    if (classCounts["All-Rounder"] >= 3 && won && fight.method === "Decision") {
      return {
        multiplier: SYNERGY_MULTIPLIERS.NONE,
        flatBonus: SYNERGY_MULTIPLIERS.ALL_ROUNDER_BONUS,
        type: "All-Rounder",
      };
    }

    // Veteran Synergy: 3+ Veterans + lost by split decision
    // TODO: Implement in later cycle (negates penalty)
    // For now, this doesn't apply to current tests

    // No synergy
    return {
      multiplier: SYNERGY_MULTIPLIERS.NONE,
      flatBonus: 0,
      type: null,
    };
  }
}
