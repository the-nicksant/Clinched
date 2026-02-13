/**
 * Event Repository Interface
 *
 * Defines the contract for UFC event data access.
 * Implemented by infrastructure layer (ConvexEventRepository).
 */

import { Fight } from "@/domain/entities/Fight";

export interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
  fights: EventFight[];
  status: EventStatus;
  isComplete: boolean;
}

export interface EventFight {
  id: string;
  fighter1Id: string;
  fighter2Id: string;
  weightClass: string;
  isMainEvent: boolean;
  isTitleFight: boolean;
  order: number;
}

export type EventStatus = "upcoming" | "live" | "completed";

export interface IEventRepository {
  /**
   * Get an event by ID
   */
  getById(id: string): Promise<Event | null>;

  /**
   * Get all upcoming events
   */
  getUpcoming(): Promise<Event[]>;

  /**
   * Get completed events
   */
  getCompleted(limit?: number): Promise<Event[]>;

  /**
   * Get fight results for an event
   */
  getFightResults(eventId: string): Promise<Fight[]>;

  /**
   * Check if two fighters are in the same bout
   */
  areInSameBout(
    eventId: string,
    fighter1Id: string,
    fighter2Id: string
  ): Promise<boolean>;
}
