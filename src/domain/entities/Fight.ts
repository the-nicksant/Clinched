/**
 * Fight Entity
 *
 * Represents a completed or scheduled fight.
 * Contains all outcome data needed for scoring calculations.
 */

import {
  FightMethod,
  DecisionType,
} from "@/domain/value-objects/FightMethod";
import { FightStats } from "@/domain/value-objects/FightStats";

export interface Fight {
  /** Unique identifier */
  id: string;

  /** First fighter ID */
  fighter1Id: string;

  /** Second fighter ID */
  fighter2Id: string;

  /** Winner's fighter ID (null if draw or no contest) */
  winnerId: string | null;

  /** Method by which the fight ended */
  method: FightMethod;

  /** Decision type (only if method is "Decision") */
  decisionType?: DecisionType;

  /** Round in which fight ended (1-5) */
  round: number;

  /** Per-fighter statistics for volume scoring */
  stats: {
    [fighterId: string]: FightStats;
  };

  /** UFC bonuses awarded */
  bonuses: {
    /** Fight of the Night (both fighters receive if true) */
    fightOfTheNight: boolean;
    /** Performance of the Night (array of fighter IDs who received it) */
    performanceBonus: string[];
  };

  /** Penalties applied to fighters */
  penalties?: {
    [fighterId: string]: {
      /** Did fighter miss weight? */
      weightMiss: boolean;
      /** Number of point deductions for fouls */
      pointDeductions: number;
    };
  };
}

/**
 * Helper function to check if a fighter won the fight
 */
export function didFighterWin(fight: Fight, fighterId: string): boolean {
  return fight.winnerId === fighterId;
}

/**
 * Helper function to check if fight was a draw
 */
export function isDraw(fight: Fight): boolean {
  return fight.method === "Draw";
}

/**
 * Helper function to check if fight was finished (not decision)
 */
export function wasFinished(fight: Fight): boolean {
  return fight.method !== "Decision" && fight.method !== "Draw";
}

/**
 * Helper function to get stats for a specific fighter
 */
export function getStatsForFighter(
  fight: Fight,
  fighterId: string
): FightStats {
  return (
    fight.stats[fighterId] || {
      knockdowns: 0,
      takedowns: 0,
      submissionAttempts: 0,
      significantStrikes: 0,
    }
  );
}

/**
 * Helper function to check if fighter received Performance of the Night
 */
export function receivedPerformanceBonus(
  fight: Fight,
  fighterId: string
): boolean {
  return fight.bonuses.performanceBonus.includes(fighterId);
}

/**
 * Helper function to get penalties for a fighter
 */
export function getPenaltiesForFighter(
  fight: Fight,
  fighterId: string
): { weightMiss: boolean; pointDeductions: number } {
  return (
    fight.penalties?.[fighterId] || { weightMiss: false, pointDeductions: 0 }
  );
}
