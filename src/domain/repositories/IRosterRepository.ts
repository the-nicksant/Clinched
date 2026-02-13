/**
 * Roster Repository Interface
 *
 * Defines the contract for roster data access.
 * Implemented by infrastructure layer (ConvexRosterRepository).
 */

import { Roster } from "@/domain/entities/Roster";

export interface IRosterRepository {
  /**
   * Get a roster by ID
   */
  getById(id: string): Promise<Roster | null>;

  /**
   * Get all rosters for a specific event
   */
  getByEventId(eventId: string): Promise<Roster[]>;

  /**
   * Get all rosters for a specific user
   */
  getByUserId(userId: string): Promise<Roster[]>;

  /**
   * Get a user's roster for a specific event
   */
  getByUserAndEvent(userId: string, eventId: string): Promise<Roster | null>;

  /**
   * Save a roster (create or update)
   */
  save(roster: Roster): Promise<Roster>;

  /**
   * Delete a roster
   */
  delete(id: string): Promise<void>;
}
