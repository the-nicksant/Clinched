/**
 * Calculate Roster Score Use Case
 *
 * Orchestrates the scoring calculation for a roster after an event.
 * Fetches required data from repositories and delegates to domain services.
 */

import { ScoringEngine } from "@/domain/services/ScoringEngine";
import { IRosterRepository } from "@/domain/repositories/IRosterRepository";
import { IEventRepository } from "@/domain/repositories/IEventRepository";
import { IFighterRepository } from "@/domain/repositories/IFighterRepository";
import {
  RosterScoreBreakdownDTO,
  FighterScoreBreakdownDTO,
} from "@/application/dto/ScoreBreakdownDTO";
import { Fight, didFighterWin, getStatsForFighter, getPenaltiesForFighter } from "@/domain/entities/Fight";
import { Fighter } from "@/domain/entities/Fighter";
import { Roster, isCaptain, getPowerUpForFighter } from "@/domain/entities/Roster";
import { SynergyCalculator } from "@/domain/services/SynergyCalculator";

export interface CalculateRosterScoreInput {
  rosterId: string;
  eventId: string;
}

export interface CalculateRosterScoreOutput {
  success: boolean;
  data?: RosterScoreBreakdownDTO;
  error?: string;
}

export class CalculateRosterScoreUseCase {
  constructor(
    private scoringEngine: ScoringEngine,
    private synergyCalculator: SynergyCalculator,
    private rosterRepository: IRosterRepository,
    private eventRepository: IEventRepository,
    private fighterRepository: IFighterRepository
  ) {}

  async execute(
    input: CalculateRosterScoreInput
  ): Promise<CalculateRosterScoreOutput> {
    try {
      // 1. Fetch roster
      const roster = await this.rosterRepository.getById(input.rosterId);
      if (!roster) {
        return { success: false, error: "Roster not found" };
      }

      // 2. Fetch event and fight results
      const event = await this.eventRepository.getById(input.eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      const fightResults = await this.eventRepository.getFightResults(
        input.eventId
      );
      if (fightResults.length === 0) {
        return { success: false, error: "No fight results available" };
      }

      // 3. Calculate scores for each fighter
      const fighterBreakdowns: FighterScoreBreakdownDTO[] = [];
      let totalScore = 0;
      let wins = 0;
      let losses = 0;
      let captainWon = false;

      for (const fighter of roster.fighters) {
        // Find the fight for this fighter
        const fight = fightResults.find(
          (f) => f.fighter1Id === fighter.id || f.fighter2Id === fighter.id
        );

        if (!fight) {
          continue; // Fighter's fight not found in results
        }

        // Calculate score using ScoringEngine
        const score = this.scoringEngine.calculateFighterScore(
          fighter,
          fight,
          roster
        );

        // Build breakdown
        const breakdown = this.buildFighterBreakdown(
          fighter,
          fight,
          roster,
          score.value
        );
        fighterBreakdowns.push(breakdown);

        totalScore += score.value;

        // Track wins/losses
        if (didFighterWin(fight, fighter.id)) {
          wins++;
          if (isCaptain(roster, fighter.id)) {
            captainWon = true;
          }
        } else {
          losses++;
        }
      }

      // 4. Build output DTO
      const activeSynergies = this.getActiveSynergies(roster, fightResults);
      const powerUpsUsed = roster.powerUps.map((pu) => pu.type);

      const captain = roster.fighters.find((f) => f.id === roster.captainId);

      const result: RosterScoreBreakdownDTO = {
        rosterId: roster.id,
        eventId: input.eventId,
        eventName: event.name,
        fighters: fighterBreakdowns,
        totalScore,
        wins,
        losses,
        captainWon,
        activeSynergies,
        powerUpsUsed,
        calculatedAt: new Date(),
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private buildFighterBreakdown(
    fighter: Fighter,
    fight: Fight,
    roster: Roster,
    finalScore: number
  ): FighterScoreBreakdownDTO {
    const won = didFighterWin(fight, fighter.id);
    const stats = getStatsForFighter(fight, fighter.id);
    const penalties = getPenaltiesForFighter(fight, fighter.id);
    const synergy = this.synergyCalculator.calculateSynergy(
      roster,
      fight,
      fighter.id
    );
    const powerUp = getPowerUpForFighter(roster, fighter.id);

    // Calculate components
    const victoryPoints = won ? 100 : 0;
    const methodMultiplier = won ? this.getMethodMultiplier(fight) : 1.0;
    const volumePoints =
      stats.knockdowns * 20 +
      stats.takedowns * 10 +
      stats.submissionAttempts * 10 +
      stats.significantStrikes * 0.5;
    const roundBonus = won && fight.method !== "Decision" ? this.getRoundBonus(fight.round) : 0;
    const ufcBonuses = this.calculateUFCBonus(fight, fighter.id);
    const baseScore = victoryPoints * methodMultiplier + volumePoints + roundBonus + ufcBonuses;

    const penaltyReasons: string[] = [];
    if (penalties.weightMiss) penaltyReasons.push("Weight miss");
    if (penalties.pointDeductions > 0)
      penaltyReasons.push(`${penalties.pointDeductions} point deduction(s)`);

    return {
      fighterId: fighter.id,
      fighterName: fighter.name,
      fighterClass: fighter.fighterClass,
      isCaptain: isCaptain(roster, fighter.id),
      won,
      method: fight.method,
      round: fight.round,
      victoryPoints,
      methodMultiplier,
      volumePoints,
      roundBonus,
      ufcBonuses,
      baseScore,
      synergyMultiplier: synergy.multiplier,
      synergyType: synergy.type,
      captainMultiplier: isCaptain(roster, fighter.id) ? 1.5 : 1.0,
      powerUpName: powerUp?.type || null,
      powerUpEffect: 0, // Calculated by PowerUpApplicator
      penalties: penalties.weightMiss ? 50 : 0 + penalties.pointDeductions * 25,
      penaltyReasons,
      finalScore,
    };
  }

  private getMethodMultiplier(fight: Fight): number {
    switch (fight.method) {
      case "KO/TKO":
        return 2.0;
      case "Submission":
        return 1.8;
      case "Decision":
        return fight.decisionType === "Unanimous" ? 1.2 : 1.0;
      default:
        return 1.0;
    }
  }

  private getRoundBonus(round: number | null): number {
    switch (round) {
      case 1:
        return 100;
      case 2:
        return 60;
      case 3:
        return 30;
      case 4:
      case 5:
        return 50;
      default:
        return 0;
    }
  }

  private calculateUFCBonus(fight: Fight, fighterId: string): number {
    let bonus = 0;
    if (fight.bonuses.performanceBonus.includes(fighterId)) bonus += 100;
    if (fight.bonuses.fightOfTheNight) bonus += 100;
    return bonus;
  }

  private getActiveSynergies(roster: Roster, fights: Fight[]): string[] {
    const synergies: string[] = [];

    // Check each fighter for active synergies
    for (const fighter of roster.fighters) {
      const fight = fights.find(
        (f) => f.fighter1Id === fighter.id || f.fighter2Id === fighter.id
      );
      if (fight) {
        const synergy = this.synergyCalculator.calculateSynergy(
          roster,
          fight,
          fighter.id
        );
        if (synergy.type && !synergies.includes(synergy.type)) {
          synergies.push(synergy.type);
        }
      }
    }

    return synergies;
  }
}
