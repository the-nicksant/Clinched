/**
 * Score Breakdown DTO
 *
 * Data Transfer Object for detailed score breakdowns.
 * Shows how each fighter's score was calculated step by step.
 */

import { FighterClass } from "@/domain/value-objects/FighterClass";
import { FightMethod } from "@/domain/value-objects/FightMethod";

export interface FighterScoreBreakdownDTO {
  fighterId: string;
  fighterName: string;
  fighterClass: FighterClass;
  isCaptain: boolean;

  // Fight outcome
  won: boolean;
  method: FightMethod | null;
  round: number | null;

  // Score components
  victoryPoints: number;
  methodMultiplier: number;
  volumePoints: number;
  roundBonus: number;
  ufcBonuses: number;
  baseScore: number;

  // Multipliers applied
  synergyMultiplier: number;
  synergyType: string | null;
  captainMultiplier: number;

  // Power-up effects
  powerUpName: string | null;
  powerUpEffect: number;

  // Penalties
  penalties: number;
  penaltyReasons: string[];

  // Final score
  finalScore: number;
}

export interface RosterScoreBreakdownDTO {
  rosterId: string;
  eventId: string;
  eventName: string;

  // Fighter breakdowns
  fighters: FighterScoreBreakdownDTO[];

  // Totals
  totalScore: number;
  rank?: number;

  // Summary stats
  wins: number;
  losses: number;
  captainWon: boolean;
  activeSynergies: string[];
  powerUpsUsed: string[];

  // Timestamps
  calculatedAt: Date;
}

export interface ScoreSummaryDTO {
  rosterId: string;
  totalScore: number;
  rank?: number;
  fighterCount: number;
  wins: number;
  losses: number;
  captainName: string;
  captainWon: boolean;
  topScorer: {
    name: string;
    score: number;
  };
}
