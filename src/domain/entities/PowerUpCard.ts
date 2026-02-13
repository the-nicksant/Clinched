/**
 * Power-Up Card Entity
 *
 * Represents a configurable power-up card that can be applied to fighters.
 * Cards are data-driven - you can change names, descriptions, and effect
 * parameters without modifying code.
 */

import { PowerUpEffectType, PowerUpEffectConfig } from "@/domain/value-objects/PowerUpEffectType";

export interface PowerUpCard {
  /** Unique identifier */
  id: string;

  /** Display name (e.g., "Hype Train") - easily updatable */
  name: string;

  /** User-facing description of what the card does */
  description: string;

  /** The type of effect this card applies (determines which logic to use) */
  effectType: PowerUpEffectType;

  /** Configuration parameters for the effect */
  effectConfig: PowerUpEffectConfig;

  /** Whether this card is currently available for use */
  isActive: boolean;

  /** Optional: Cost for roster building (future feature) */
  cost?: number;

  /** Optional: Image URL or asset key */
  imageUrl?: string;
}

/**
 * Helper function to create a power-up card for testing
 */
export function createPowerUpCard(params: {
  id: string;
  name: string;
  description: string;
  effectType: PowerUpEffectType;
  effectConfig: PowerUpEffectConfig;
  isActive?: boolean;
  cost?: number;
  imageUrl?: string;
}): PowerUpCard {
  return {
    id: params.id,
    name: params.name,
    description: params.description,
    effectType: params.effectType,
    effectConfig: params.effectConfig,
    isActive: params.isActive ?? true,
    cost: params.cost,
    imageUrl: params.imageUrl,
  };
}
