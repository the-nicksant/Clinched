/**
 * Fighter Repository Interface
 *
 * Defines the contract for fighter data access.
 * Implemented by infrastructure layer (ConvexFighterRepository).
 */

import { Fighter } from "@/domain/entities/Fighter";
import { FighterClass } from "@/domain/value-objects/FighterClass";

export interface FighterFilter {
  weightClass?: string;
  fighterClass?: FighterClass;
  minRank?: number;
  maxRank?: number;
  isRanked?: boolean;
  searchName?: string;
}

export interface IFighterRepository {
  /**
   * Get a fighter by ID
   */
  getById(id: string): Promise<Fighter | null>;

  /**
   * Get multiple fighters by IDs
   */
  getByIds(ids: string[]): Promise<Fighter[]>;

  /**
   * Get all fighters for a specific event
   */
  getByEventId(eventId: string): Promise<Fighter[]>;

  /**
   * Search fighters with filters
   */
  search(filter: FighterFilter): Promise<Fighter[]>;

  /**
   * Get fighter's opponent for a specific event
   */
  getOpponent(fighterId: string, eventId: string): Promise<Fighter | null>;
}
