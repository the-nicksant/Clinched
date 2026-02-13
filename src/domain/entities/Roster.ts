/**
 * Roster Entity
 *
 * Represents a user's lineup of fighters for an event.
 * This is a minimal version with ONLY properties needed for scoring.
 *
 * NOTE: This does NOT include userId, eventId, validation state, etc.
 * Those properties will be added when needed by other services.
 */

import { Fighter } from "@/domain/entities/Fighter";
import { PowerUp } from "@/domain/value-objects/PowerUpType";
import { PowerUpCard } from "@/domain/entities/PowerUpCard";

export interface Roster {
  /** Unique identifier */
  id: string;

  /** User who created this roster */
  userId: string;

  /** Event this roster is for */
  eventId: string;

  /** Array of fighters in the roster (exactly 6 for a valid roster) */
  fighters: Fighter[];

  /** Fighter ID of the designated captain (receives 1.5x multiplier) */
  captainId: string;

  /** Power-ups applied to fighters (max 2) */
  powerUps: PowerUp[];

  /**
   * Resolved PowerUpCard entities (optional, loaded from database)
   * Maps powerUpCardId to the full PowerUpCard for scoring calculations
   */
  powerUpCards?: Map<string, PowerUpCard>;
}

/**
 * Helper function to get the captain fighter
 */
export function getCaptain(roster: Roster): Fighter | undefined {
  return roster.fighters.find((f) => f.id === roster.captainId);
}

/**
 * Helper function to check if a fighter is the captain
 */
export function isCaptain(roster: Roster, fighterId: string): boolean {
  return roster.captainId === fighterId;
}

/**
 * Helper function to get power-up applied to a specific fighter
 */
export function getPowerUpForFighter(
  roster: Roster,
  fighterId: string
): PowerUp | undefined {
  return roster.powerUps.find((pu) => pu.appliedToFighterId === fighterId);
}

/**
 * Helper function to get the PowerUpCard for a specific fighter
 * Returns null if no power-up is applied or card is not loaded
 */
export function getPowerUpCardForFighter(
  roster: Roster,
  fighterId: string
): PowerUpCard | null {
  const powerUp = getPowerUpForFighter(roster, fighterId);
  if (!powerUp) {
    return null;
  }

  // Look up the card from the resolved cards map
  if (roster.powerUpCards) {
    return roster.powerUpCards.get(powerUp.powerUpCardId) || null;
  }

  return null;
}

/**
 * Helper function to count fighters by class (for synergy calculations)
 */
export function countFightersByClass(
  roster: Roster
): Record<string, number> {
  const counts: Record<string, number> = {
    Striker: 0,
    Grappler: 0,
    "All-Rounder": 0,
    Veteran: 0,
  };

  roster.fighters.forEach((fighter) => {
    counts[fighter.fighterClass] = (counts[fighter.fighterClass] || 0) + 1;

    // Veterans are also counted if age 35+
    if (fighter.age >= 35) {
      counts.Veteran = (counts.Veteran || 0) + 1;
    }
  });

  return counts;
}

/**
 * Create a roster for testing purposes
 */
export function createRoster(params: {
  id: string;
  userId?: string;
  eventId?: string;
  fighters: Fighter[];
  captainId: string;
  powerUps?: PowerUp[];
}): Roster {
  return {
    id: params.id,
    userId: params.userId || "default-user",
    eventId: params.eventId || "default-event",
    fighters: params.fighters,
    captainId: params.captainId,
    powerUps: params.powerUps || [],
  };
}
