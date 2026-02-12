/**
 * Scoring Engine
 *
 * Core service that calculates fighter scores using the formula:
 * S = [((V × M) + Vol + R + B) × Syn] × Cap × PU - P
 *
 * Where:
 * - V = Victory Points (100 for win, 0 for loss)
 * - M = Method Multiplier (KO=2.0, Sub=1.8, UD=1.2, Split=1.0)
 * - Vol = Volume Points (knockdowns, takedowns, strikes, etc.)
 * - R = Round Bonus (R1=100, R2=60, R3=30, R4/5=50)
 * - B = UFC Bonus (POTN/FOTN = 100 each)
 * - Syn = Synergy Multiplier (1.15 for class synergies)
 * - Cap = Captain Multiplier (1.5 if captain)
 * - PU = Power-Up Multiplier (varies by power-up)
 * - P = Penalties (weight miss, point deductions)
 */

import { Fighter } from "@/domain/entities/Fighter";
import { Fight, didFighterWin, getStatsForFighter, getPenaltiesForFighter } from "@/domain/entities/Fight";
import { Roster, isCaptain } from "@/domain/entities/Roster";
import { Score } from "@/domain/value-objects/Score";
import {
  VICTORY_POINTS,
  METHOD_MULTIPLIERS,
  ROUND_BONUSES,
  VOLUME_POINTS,
  CAPTAIN_MULTIPLIER,
  UFC_BONUSES,
  POWER_UP_EFFECTS,
  PENALTIES,
} from "@/shared/constants/scoring-constants";
import { SynergyCalculator } from "@/domain/services/SynergyCalculator";
import { PowerUpApplicator } from "@/domain/services/PowerUpApplicator";

export class ScoringEngine {
  private synergyCalculator: SynergyCalculator;
  private powerUpApplicator: PowerUpApplicator;

  constructor(
    synergyCalculator?: SynergyCalculator,
    powerUpApplicator?: PowerUpApplicator
  ) {
    this.synergyCalculator = synergyCalculator || new SynergyCalculator();
    this.powerUpApplicator = powerUpApplicator || new PowerUpApplicator();
  }
  /**
   * Calculate the total score for a fighter in a fight
   */
  calculateFighterScore(
    fighter: Fighter,
    fight: Fight,
    roster: Roster
  ): Score {
    // Step 0: Check if Resilience power-up should activate (loss + FOTN → treat as win)
    const resilienceActive = this.powerUpApplicator.shouldResilienceActivate(
      roster,
      fight,
      fighter.id
    );

    // Step 1: Calculate Victory Points (V)
    const victoryPoints = this.calculateVictoryPoints(
      fight,
      fighter.id,
      resilienceActive
    );

    // Step 2: Calculate Method Multiplier (M)
    const methodMultiplier = this.calculateMethodMultiplier(
      fight,
      fighter.id,
      resilienceActive
    );

    // Step 3: Calculate Volume Points (Vol)
    const volumePoints = this.calculateVolumePoints(fight, fighter.id);

    // Step 4: Calculate Round Bonus (R)
    const roundBonus = this.calculateRoundBonus(fight, fighter.id);

    // Step 5: Calculate UFC Bonus (B)
    const ufcBonus = this.calculateUFCBonus(fight, fighter.id);

    // Step 6: Calculate base score
    const baseScore = victoryPoints * methodMultiplier + volumePoints + roundBonus + ufcBonus;

    // Step 7: Calculate Synergy (Syn)
    const synergy = this.synergyCalculator.calculateSynergy(roster, fight, fighter.id);
    const scoreWithSynergy = (baseScore * synergy.multiplier) + synergy.flatBonus;

    // Step 8: Calculate Captain Multiplier (Cap)
    const captainMultiplier = isCaptain(roster, fighter.id) ? CAPTAIN_MULTIPLIER : 1.0;
    const scoreWithCaptain = scoreWithSynergy * captainMultiplier;

    // Step 9: Apply Power-Up (PU)
    const powerUpResult = this.powerUpApplicator.applyPowerUp(
      roster,
      fight,
      fighter.id,
      scoreWithCaptain
    );
    const scoreWithPowerUp = (scoreWithCaptain * powerUpResult.multiplier) + powerUpResult.flatBonus;

    // Step 10: Subtract Penalties (P)
    const penalties = this.calculatePenalties(fight, fighter.id);
    const finalScore = scoreWithPowerUp - penalties;

    return new Score(finalScore);
  }

  /**
   * Calculate victory points
   * Win = 100, Loss = 0, Draw = 50
   * If Resilience is active, loss is converted to win
   */
  private calculateVictoryPoints(
    fight: Fight,
    fighterId: string,
    resilienceActive: boolean
  ): number {
    // Resilience converts loss to win
    if (resilienceActive) {
      return VICTORY_POINTS.WIN;
    }

    if (didFighterWin(fight, fighterId)) {
      return VICTORY_POINTS.WIN;
    }

    if (fight.method === "Draw") {
      return VICTORY_POINTS.DRAW;
    }

    return VICTORY_POINTS.LOSS;
  }

  /**
   * Calculate method multiplier
   * Only applies if fighter won (or if Resilience is active)
   * If Resilience is active, treat as Unanimous Decision
   */
  private calculateMethodMultiplier(
    fight: Fight,
    fighterId: string,
    resilienceActive: boolean
  ): number {
    // Resilience treats loss as Unanimous Decision win
    if (resilienceActive) {
      return POWER_UP_EFFECTS.RESILIENCE.DECISION_EQUIVALENT_MULTIPLIER;
    }

    // Method multiplier only applies to winners
    if (!didFighterWin(fight, fighterId)) {
      return 1.0;
    }

    switch (fight.method) {
      case "KO/TKO":
        return METHOD_MULTIPLIERS["KO/TKO"];

      case "Submission":
        return METHOD_MULTIPLIERS.Submission;

      case "Decision":
        if (fight.decisionType === "Unanimous") {
          return METHOD_MULTIPLIERS.Decision.Unanimous;
        } else if (fight.decisionType === "Split") {
          return METHOD_MULTIPLIERS.Decision.Split;
        } else if (fight.decisionType === "Majority") {
          return METHOD_MULTIPLIERS.Decision.Majority;
        }
        // Default to split if decision type not specified
        return METHOD_MULTIPLIERS.Decision.Split;

      case "DQ":
        return METHOD_MULTIPLIERS.DQ;

      case "No Contest":
        return METHOD_MULTIPLIERS["No Contest"];

      default:
        return 1.0;
    }
  }

  /**
   * Calculate round bonus
   * Only awarded if fight was finished (not decision)
   */
  private calculateRoundBonus(fight: Fight, fighterId: string): number {
    // No bonus for losses
    if (!didFighterWin(fight, fighterId)) {
      return 0;
    }

    // No bonus for decisions
    if (fight.method === "Decision") {
      return 0;
    }

    // Award bonus based on round
    switch (fight.round) {
      case 1:
        return ROUND_BONUSES.ROUND_1;
      case 2:
        return ROUND_BONUSES.ROUND_2;
      case 3:
        return ROUND_BONUSES.ROUND_3;
      case 4:
        return ROUND_BONUSES.ROUND_4;
      case 5:
        return ROUND_BONUSES.ROUND_5;
      default:
        return 0;
    }
  }

  /**
   * Calculate volume points
   * Awarded for in-fight actions (knockdowns, takedowns, strikes, etc.)
   * IMPORTANT: Volume points are awarded even when a fighter loses!
   */
  private calculateVolumePoints(fight: Fight, fighterId: string): number {
    // Get stats for this fighter (returns empty stats if none exist)
    const stats = getStatsForFighter(fight, fighterId);

    // Calculate volume based on VOLUME_POINTS constants:
    // - Knockdowns: 20 points each
    // - Takedowns: 10 points each
    // - Submission Attempts: 10 points each
    // - Significant Strikes: 0.5 points each
    const knockdownPoints = stats.knockdowns * VOLUME_POINTS.KNOCKDOWN;
    const takedownPoints = stats.takedowns * VOLUME_POINTS.TAKEDOWN;
    const submissionAttemptPoints =
      stats.submissionAttempts * VOLUME_POINTS.SUBMISSION_ATTEMPT;
    const strikePoints =
      stats.significantStrikes * VOLUME_POINTS.SIGNIFICANT_STRIKE;

    return (
      knockdownPoints +
      takedownPoints +
      submissionAttemptPoints +
      strikePoints
    );
  }

  /**
   * Calculate UFC bonus points
   * - Performance of the Night (POTN): 100 points
   * - Fight of the Night (FOTN): 100 points (awarded to both fighters)
   */
  private calculateUFCBonus(fight: Fight, fighterId: string): number {
    let bonus = 0;

    // Check for Performance of the Night
    if (fight.bonuses.performanceBonus.includes(fighterId)) {
      bonus += UFC_BONUSES.PERFORMANCE_OF_THE_NIGHT;
    }

    // Check for Fight of the Night (both fighters receive)
    if (fight.bonuses.fightOfTheNight) {
      bonus += UFC_BONUSES.FIGHT_OF_THE_NIGHT;
    }

    return bonus;
  }

  /**
   * Calculate penalty points
   * - Weight miss: -50 points
   * - Point deduction (referee foul): -25 points each
   */
  private calculatePenalties(fight: Fight, fighterId: string): number {
    const penalties = getPenaltiesForFighter(fight, fighterId);
    let totalPenalty = 0;

    // Weight miss penalty
    if (penalties.weightMiss) {
      totalPenalty += Math.abs(PENALTIES.WEIGHT_MISS); // Make positive for subtraction
    }

    // Point deduction penalties
    totalPenalty += penalties.pointDeductions * Math.abs(PENALTIES.POINT_DEDUCTION);

    return totalPenalty;
  }
}
