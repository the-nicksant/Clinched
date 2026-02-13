/**
 * Update Leaderboard Use Case
 *
 * Orchestrates the leaderboard update after an event completes.
 * Calculates scores for all rosters and updates rankings.
 */

import { ScoringEngine } from "@/domain/services/ScoringEngine";
import { SynergyCalculator } from "@/domain/services/SynergyCalculator";
import { IRosterRepository } from "@/domain/repositories/IRosterRepository";
import { IEventRepository } from "@/domain/repositories/IEventRepository";
import { ILeaderboardRepository, LeaderboardEntry } from "@/domain/repositories/ILeaderboardRepository";
import { didFighterWin } from "@/domain/entities/Fight";
import { isCaptain } from "@/domain/entities/Roster";

export interface UpdateLeaderboardInput {
  eventId: string;
}

export interface UpdateLeaderboardOutput {
  success: boolean;
  rostersProcessed?: number;
  error?: string;
}

export class UpdateLeaderboardUseCase {
  constructor(
    private scoringEngine: ScoringEngine,
    private synergyCalculator: SynergyCalculator,
    private rosterRepository: IRosterRepository,
    private eventRepository: IEventRepository,
    private leaderboardRepository: ILeaderboardRepository
  ) {}

  async execute(input: UpdateLeaderboardInput): Promise<UpdateLeaderboardOutput> {
    try {
      // 1. Verify event exists and is complete
      const event = await this.eventRepository.getById(input.eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      if (!event.isComplete) {
        return { success: false, error: "Event is not yet complete" };
      }

      // 2. Fetch all fight results
      const fightResults = await this.eventRepository.getFightResults(input.eventId);
      if (fightResults.length === 0) {
        return { success: false, error: "No fight results available" };
      }

      // 3. Fetch all rosters for this event
      const rosters = await this.rosterRepository.getByEventId(input.eventId);
      if (rosters.length === 0) {
        return { success: true, rostersProcessed: 0 };
      }

      // 4. Calculate scores for each roster
      for (const roster of rosters) {
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
            continue; // Fighter's fight not found
          }

          // Calculate score
          const score = this.scoringEngine.calculateFighterScore(
            fighter,
            fight,
            roster
          );
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

        // 5. Update leaderboard entry
        const entry: Omit<LeaderboardEntry, "rank"> = {
          rosterId: roster.id,
          userId: roster.userId,
          eventId: input.eventId,
          totalScore,
          wins,
          losses,
          captainWon,
          updatedAt: new Date(),
        };

        await this.leaderboardRepository.upsert(entry);
      }

      // 6. Recalculate all ranks
      await this.leaderboardRepository.recalculateRanks(input.eventId);

      return { success: true, rostersProcessed: rosters.length };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
