/**
 * Power-Up Effect Types
 *
 * Defines the different types of effects that power-up cards can have.
 * Each effect type has its own configuration schema.
 *
 * When adding a new effect type:
 * 1. Add the type to PowerUpEffectType union
 * 2. Add its config interface to PowerUpEffectConfig
 * 3. Implement the logic in PowerUpApplicator
 */

/**
 * Available effect types
 */
export type PowerUpEffectType =
  | "multiplier_win_loss"        // Different multipliers for win vs loss
  | "loss_to_win_with_bonus"     // Convert loss to win if has specific bonus
  | "multiplier_round_finish"    // Multiplier if finished in specific round
  | "flat_bonus_per_ufc_bonus";  // Flat points per UFC bonus received

/**
 * Configuration for multiplier_win_loss effect
 * Example: Hype Train (2× win, -2× loss)
 */
export interface MultiplierWinLossConfig {
  winMultiplier: number;
  lossMultiplier: number;
}

/**
 * Configuration for loss_to_win_with_bonus effect
 * Example: Resilience (loss + FOTN → treat as decision win)
 */
export interface LossToWinWithBonusConfig {
  requiredBonus: "FOTN" | "POTN" | "ANY";
  treatAsMethodMultiplier: number; // e.g., 1.2 for unanimous decision
}

/**
 * Configuration for multiplier_round_finish effect
 * Example: Blitz (3× if R1 finish)
 */
export interface MultiplierRoundFinishConfig {
  targetRound: number;
  multiplier: number;
  mustBeFinish: boolean; // If true, decisions don't count
}

/**
 * Configuration for flat_bonus_per_ufc_bonus effect
 * Example: Red Mist (+50 per UFC bonus)
 */
export interface FlatBonusPerUFCBonusConfig {
  bonusPerUFCBonus: number;
}

/**
 * Union of all effect configurations
 * TypeScript will ensure type safety based on effectType
 */
export type PowerUpEffectConfig =
  | MultiplierWinLossConfig
  | LossToWinWithBonusConfig
  | MultiplierRoundFinishConfig
  | FlatBonusPerUFCBonusConfig;

/**
 * Type guard helpers
 */
export function isMultiplierWinLossConfig(
  config: PowerUpEffectConfig
): config is MultiplierWinLossConfig {
  return "winMultiplier" in config && "lossMultiplier" in config;
}

export function isLossToWinWithBonusConfig(
  config: PowerUpEffectConfig
): config is LossToWinWithBonusConfig {
  return "requiredBonus" in config && "treatAsMethodMultiplier" in config;
}

export function isMultiplierRoundFinishConfig(
  config: PowerUpEffectConfig
): config is MultiplierRoundFinishConfig {
  return "targetRound" in config && "multiplier" in config && "mustBeFinish" in config;
}

export function isFlatBonusPerUFCBonusConfig(
  config: PowerUpEffectConfig
): config is FlatBonusPerUFCBonusConfig {
  return "bonusPerUFCBonus" in config;
}
