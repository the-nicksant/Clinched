/**
 * Convex to Domain Mappers
 *
 * Maps Convex database records to domain entities.
 * These ensure a clean separation between infrastructure and domain layers.
 */

import { Fighter } from "@/domain/entities/Fighter";
import { Fight } from "@/domain/entities/Fight";
import { Roster } from "@/domain/entities/Roster";
import { FighterClass } from "@/domain/value-objects/FighterClass";
import { FightMethod, DecisionType } from "@/domain/value-objects/FightMethod";
import { PowerUp, PowerUpType } from "@/domain/value-objects/PowerUpType";
import { FightStats } from "@/domain/value-objects/FightStats";
// Note: Types are inferred from Convex function returns
// We use 'any' for Convex documents and map to domain types

// Convex document types (using any for flexibility)
type ConvexFighter = any;
type ConvexFight = any;
type ConvexRoster = any;
type ConvexPowerUpCard = any;

/**
 * Map Convex fighter to domain Fighter
 */
export function mapToFighter(convexFighter: ConvexFighter): Fighter {
  return {
    id: convexFighter._id,
    name: convexFighter.name,
    fighterClass: convexFighter.fighterClass as FighterClass,
    age: convexFighter.age,
  };
}

/**
 * Map Convex fighter with salary info to domain Fighter
 */
export function mapToFighterWithSalary(
  convexFighter: ConvexFighter,
  salary: number,
  rank?: number | null
): Fighter {
  return {
    id: convexFighter._id,
    name: convexFighter.name,
    fighterClass: convexFighter.fighterClass as FighterClass,
    age: convexFighter.age,
    salary,
    rank,
  };
}

/**
 * Map Convex fight to domain Fight
 */
export function mapToFight(convexFight: ConvexFight): Fight {
  const stats: { [fighterId: string]: FightStats } = {};

  if (convexFight.stats) {
    stats[convexFight.fighter1Id] = {
      knockdowns: convexFight.stats.fighter1.knockdowns,
      takedowns: convexFight.stats.fighter1.takedowns,
      submissionAttempts: convexFight.stats.fighter1.submissionAttempts,
      significantStrikes: convexFight.stats.fighter1.significantStrikes,
    };
    stats[convexFight.fighter2Id] = {
      knockdowns: convexFight.stats.fighter2.knockdowns,
      takedowns: convexFight.stats.fighter2.takedowns,
      submissionAttempts: convexFight.stats.fighter2.submissionAttempts,
      significantStrikes: convexFight.stats.fighter2.significantStrikes,
    };
  }

  const penalties: {
    [fighterId: string]: { weightMiss: boolean; pointDeductions: number };
  } = {};

  if (convexFight.penalties) {
    if (convexFight.penalties.fighter1) {
      penalties[convexFight.fighter1Id] = {
        weightMiss: convexFight.penalties.fighter1.weightMiss,
        pointDeductions: convexFight.penalties.fighter1.pointDeductions,
      };
    }
    if (convexFight.penalties.fighter2) {
      penalties[convexFight.fighter2Id] = {
        weightMiss: convexFight.penalties.fighter2.weightMiss,
        pointDeductions: convexFight.penalties.fighter2.pointDeductions,
      };
    }
  }

  return {
    id: convexFight._id,
    fighter1Id: convexFight.fighter1Id,
    fighter2Id: convexFight.fighter2Id,
    winnerId: convexFight.winnerId || null,
    method: (convexFight.method || "Decision") as FightMethod,
    decisionType: convexFight.decisionType as DecisionType | undefined,
    round: convexFight.round || 3,
    stats,
    bonuses: convexFight.bonuses || {
      fightOfTheNight: false,
      performanceBonus: [],
    },
    penalties,
  };
}

/**
 * Power-up type mapping from effect type to display name
 */
const EFFECT_TYPE_TO_POWER_UP: Record<string, PowerUpType> = {
  multiplier_win_loss: "Hype Train",
  loss_to_win_with_bonus: "Resilience",
  multiplier_round_finish: "Blitz",
  flat_bonus_per_ufc_bonus: "Red Mist",
};

/**
 * Map Convex roster to domain Roster
 */
export function mapToRoster(
  convexRoster: ConvexRoster,
  fighters: Fighter[],
  powerUpCards?: ConvexPowerUpCard[]
): Roster {
  // Find captain
  const captainEntry = convexRoster.fighters.find((f: any) => f.isCaptain);
  const captainId = captainEntry?.fighterId || "";

  // Map power-ups with type from card
  const powerUps: PowerUp[] = convexRoster.powerUps.map((pu: any) => {
    const card = powerUpCards?.find((c: any) => c._id === pu.powerUpCardId);
    const type = card
      ? EFFECT_TYPE_TO_POWER_UP[card.effectType] || "Hype Train"
      : "Hype Train";

    return {
      powerUpCardId: pu.powerUpCardId,
      appliedToFighterId: pu.appliedToFighterId,
      type,
    };
  });

  return {
    id: convexRoster._id,
    userId: convexRoster.userId,
    eventId: convexRoster.eventId,
    fighters,
    captainId,
    powerUps,
  };
}
