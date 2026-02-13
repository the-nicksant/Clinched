/**
 * Roster DTO
 *
 * Data Transfer Object for roster information in the presentation layer.
 * Contains all data needed to display a roster and its composition.
 */

import { FighterClass } from "@/domain/value-objects/FighterClass";

export interface FighterDTO {
  id: string;
  name: string;
  fighterClass: FighterClass;
  rank: number | null;
  salary: number;
  imageUrl?: string;
}

export interface PowerUpDTO {
  id: string;
  powerUpCardId: string;
  name: string;
  description: string;
  appliedToFighterId: string;
  appliedToFighterName: string;
}

export interface RosterDTO {
  id: string;
  userId: string;
  eventId: string;
  fighters: FighterDTO[];
  captainId: string;
  captainName: string;
  powerUps: PowerUpDTO[];
  totalSalary: number;
  salaryCap: number;
  remainingBudget: number;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RosterSummaryDTO {
  id: string;
  eventId: string;
  eventName: string;
  fighterCount: number;
  totalSalary: number;
  captainName: string;
  powerUpCount: number;
  isValid: boolean;
  score?: number;
  rank?: number;
}
