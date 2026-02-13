/**
 * Calculate User XP Use Case
 *
 * Orchestrates XP calculation for a user after an event.
 * Awards XP based on captain performance and updates user level.
 */

import { XPCalculator } from "@/domain/services/XPCalculator";
import { IRosterRepository } from "@/domain/repositories/IRosterRepository";
import { IEventRepository } from "@/domain/repositories/IEventRepository";
import { IUserRepository, User } from "@/domain/repositories/IUserRepository";
import { didFighterWin } from "@/domain/entities/Fight";
import { FightMethod } from "@/domain/value-objects/FightMethod";

export interface CalculateUserXPInput {
  rosterId: string;
  userId: string;
}

export interface XPResultDTO {
  userId: string;
  rosterId: string;
  eventId: string;

  // XP breakdown
  baseXP: number;
  captainWinBonus: number;
  methodBonus: number;
  totalXPEarned: number;

  // Level progression
  previousLevel: number;
  newLevel: number;
  previousTotalXP: number;
  newTotalXP: number;
  xpToNextLevel: number;
  levelProgress: number;

  // Flags
  leveledUp: boolean;
}

export interface CalculateUserXPOutput {
  success: boolean;
  data?: XPResultDTO;
  error?: string;
}

export class CalculateUserXPUseCase {
  constructor(
    private xpCalculator: XPCalculator,
    private rosterRepository: IRosterRepository,
    private eventRepository: IEventRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: CalculateUserXPInput): Promise<CalculateUserXPOutput> {
    try {
      // 1. Fetch roster
      const roster = await this.rosterRepository.getById(input.rosterId);
      if (!roster) {
        return { success: false, error: "Roster not found" };
      }

      if (roster.userId !== input.userId) {
        return { success: false, error: "Roster does not belong to this user" };
      }

      // 2. Fetch user
      const user = await this.userRepository.getById(input.userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // 3. Fetch fight results
      const fightResults = await this.eventRepository.getFightResults(
        roster.eventId
      );

      // 4. Find captain's fight
      const captain = roster.fighters.find((f) => f.id === roster.captainId);
      if (!captain) {
        return { success: false, error: "Captain not found in roster" };
      }

      const captainFight = fightResults.find(
        (f) => f.fighter1Id === captain.id || f.fighter2Id === captain.id
      );

      // 5. Calculate XP
      let captainWon = false;
      let captainMethod: FightMethod | null = null;

      if (captainFight) {
        captainWon = didFighterWin(captainFight, captain.id);
        captainMethod = captainWon ? captainFight.method : null;
      }

      const xpEarned = this.xpCalculator.calculateEventXP({
        captainWon,
        captainMethod,
      });

      // 6. Calculate XP breakdown
      const baseXP = 50;
      const captainWinBonus = captainWon ? 100 : 0;
      const methodBonus = captainWon
        ? this.getMethodBonus(captainMethod)
        : 0;

      // 7. Update user XP and level
      const previousTotalXP = user.totalXP;
      const previousLevel = this.xpCalculator.calculateLevel(previousTotalXP);

      const newTotalXP = previousTotalXP + xpEarned;
      const newLevel = this.xpCalculator.calculateLevel(newTotalXP);

      await this.userRepository.updateXP(input.userId, xpEarned, newLevel);

      // 8. Build result DTO
      const result: XPResultDTO = {
        userId: input.userId,
        rosterId: input.rosterId,
        eventId: roster.eventId,

        baseXP,
        captainWinBonus,
        methodBonus,
        totalXPEarned: xpEarned,

        previousLevel,
        newLevel,
        previousTotalXP,
        newTotalXP,
        xpToNextLevel: this.xpCalculator.xpToNextLevel(newTotalXP),
        levelProgress: this.xpCalculator.levelProgress(newTotalXP),

        leveledUp: newLevel > previousLevel,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private getMethodBonus(method: FightMethod | null): number {
    switch (method) {
      case "KO/TKO":
        return 50;
      case "Submission":
        return 40;
      case "Decision":
        return 20;
      default:
        return 0;
    }
  }
}
