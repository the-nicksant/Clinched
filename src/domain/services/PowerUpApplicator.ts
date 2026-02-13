/**
 * Power-Up Applicator (Refactored)
 *
 * Applies power-up effects to fighter scores using data-driven PowerUpCard entities.
 * Effect logic is determined by the card's effectType, making it easy to add
 * new cards without modifying this class.
 *
 * Power-Up Effect Types:
 * - multiplier_win_loss: Different multipliers for win vs loss (e.g., Hype Train)
 * - loss_to_win_with_bonus: Convert loss to win if has bonus (e.g., Resilience)
 * - multiplier_round_finish: Multiplier if finished in target round (e.g., Blitz)
 * - flat_bonus_per_ufc_bonus: Flat points per UFC bonus (e.g., Red Mist)
 */

import { PowerUpCard } from "@/domain/entities/PowerUpCard";
import { Fight, didFighterWin, receivedPerformanceBonus } from "@/domain/entities/Fight";
import {
  isMultiplierWinLossConfig,
  isLossToWinWithBonusConfig,
  isMultiplierRoundFinishConfig,
  isFlatBonusPerUFCBonusConfig,
} from "@/domain/value-objects/PowerUpEffectType";

export interface PowerUpResult {
  multiplier: number;
  flatBonus: number;
}

export class PowerUpApplicator {
  /**
   * Check if a loss-to-win power-up should activate
   * (e.g., Resilience: loss + FOTN → treat as win)
   */
  shouldLossToWinActivate(
    card: PowerUpCard | null,
    fight: Fight,
    fighterId: string
  ): boolean {
    if (!card || card.effectType !== "loss_to_win_with_bonus") {
      return false;
    }

    // Must have lost
    if (didFighterWin(fight, fighterId)) {
      return false;
    }

    // Check required bonus
    if (!isLossToWinWithBonusConfig(card.effectConfig)) {
      return false;
    }

    const { requiredBonus } = card.effectConfig;

    switch (requiredBonus) {
      case "FOTN":
        return fight.bonuses.fightOfTheNight;
      case "POTN":
        return receivedPerformanceBonus(fight, fighterId);
      case "ANY":
        return (
          fight.bonuses.fightOfTheNight ||
          receivedPerformanceBonus(fight, fighterId)
        );
      default:
        return false;
    }
  }

  /**
   * Get the method multiplier to use when loss-to-win is active
   */
  getLossToWinMethodMultiplier(card: PowerUpCard): number {
    if (card.effectType !== "loss_to_win_with_bonus") {
      return 1.0;
    }

    if (!isLossToWinWithBonusConfig(card.effectConfig)) {
      return 1.0;
    }

    return card.effectConfig.treatAsMethodMultiplier;
  }

  /**
   * Apply power-up effect to the final score
   * This is called AFTER synergy and captain multipliers
   */
  applyPowerUp(
    card: PowerUpCard | null,
    fight: Fight,
    fighterId: string,
    currentScore: number
  ): PowerUpResult {
    if (!card) {
      return {
        multiplier: 1.0,
        flatBonus: 0,
      };
    }

    switch (card.effectType) {
      case "multiplier_win_loss":
        return this.applyMultiplierWinLoss(card, fight, fighterId);

      case "loss_to_win_with_bonus":
        // This is handled early in calculation (modifies victory points)
        // No additional effect here
        return {
          multiplier: 1.0,
          flatBonus: 0,
        };

      case "multiplier_round_finish":
        return this.applyMultiplierRoundFinish(card, fight, fighterId);

      case "flat_bonus_per_ufc_bonus":
        return this.applyFlatBonusPerUFCBonus(card, fight, fighterId);

      default:
        return {
          multiplier: 1.0,
          flatBonus: 0,
        };
    }
  }

  /**
   * Apply multiplier_win_loss effect
   * Example: Hype Train (2× win, -2× loss)
   */
  private applyMultiplierWinLoss(
    card: PowerUpCard,
    fight: Fight,
    fighterId: string
  ): PowerUpResult {
    if (!isMultiplierWinLossConfig(card.effectConfig)) {
      return { multiplier: 1.0, flatBonus: 0 };
    }

    const won = didFighterWin(fight, fighterId);
    const { winMultiplier, lossMultiplier } = card.effectConfig;

    return {
      multiplier: won ? winMultiplier : lossMultiplier,
      flatBonus: 0,
    };
  }

  /**
   * Apply multiplier_round_finish effect
   * Example: Blitz (3× if R1 finish)
   */
  private applyMultiplierRoundFinish(
    card: PowerUpCard,
    fight: Fight,
    fighterId: string
  ): PowerUpResult {
    if (!isMultiplierRoundFinishConfig(card.effectConfig)) {
      return { multiplier: 1.0, flatBonus: 0 };
    }

    const { targetRound, multiplier, mustBeFinish } = card.effectConfig;
    const won = didFighterWin(fight, fighterId);
    const isTargetRound = fight.round === targetRound;
    const isFinish = fight.method !== "Decision" && fight.method !== "Draw";

    // Check all conditions
    if (!won) {
      return { multiplier: 1.0, flatBonus: 0 };
    }

    if (!isTargetRound) {
      return { multiplier: 1.0, flatBonus: 0 };
    }

    if (mustBeFinish && !isFinish) {
      return { multiplier: 1.0, flatBonus: 0 };
    }

    return {
      multiplier,
      flatBonus: 0,
    };
  }

  /**
   * Apply flat_bonus_per_ufc_bonus effect
   * Example: Red Mist (+50 per UFC bonus)
   */
  private applyFlatBonusPerUFCBonus(
    card: PowerUpCard,
    fight: Fight,
    fighterId: string
  ): PowerUpResult {
    if (!isFlatBonusPerUFCBonusConfig(card.effectConfig)) {
      return { multiplier: 1.0, flatBonus: 0 };
    }

    const { bonusPerUFCBonus } = card.effectConfig;
    let bonusCount = 0;

    // Count POTN
    if (receivedPerformanceBonus(fight, fighterId)) {
      bonusCount++;
    }

    // Count FOTN
    if (fight.bonuses.fightOfTheNight) {
      bonusCount++;
    }

    return {
      multiplier: 1.0,
      flatBonus: bonusCount * bonusPerUFCBonus,
    };
  }
}
