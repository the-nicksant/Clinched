/**
 * Power-Up Card Repository Interface
 *
 * Defines the contract for power-up card data access.
 * Implemented by infrastructure layer (ConvexPowerUpCardRepository).
 */

import { PowerUpCard } from "@/domain/entities/PowerUpCard";
import { PowerUpEffectType } from "@/domain/value-objects/PowerUpEffectType";

export interface IPowerUpCardRepository {
  /**
   * Get a power-up card by ID
   */
  getById(id: string): Promise<PowerUpCard | null>;

  /**
   * Get multiple power-up cards by IDs
   */
  getByIds(ids: string[]): Promise<PowerUpCard[]>;

  /**
   * Get all active power-up cards
   */
  getActive(): Promise<PowerUpCard[]>;

  /**
   * Get power-up cards by effect type
   */
  getByEffectType(effectType: PowerUpEffectType): Promise<PowerUpCard[]>;

  /**
   * Save a power-up card (create or update)
   */
  save(card: PowerUpCard): Promise<PowerUpCard>;

  /**
   * Deactivate a power-up card
   */
  deactivate(id: string): Promise<void>;
}
