/**
 * Power-Up Applicator
 *
 * Applies power-up effects to fighter scores.
 *
 * Power-Up Types:
 * - Hype Train: 2× win / -2× loss (multiplier on final score)
 * - Resilience: Loss + FOTN → treat as Unanimous Decision win
 * - Blitz: 3× if R1 finish (multiplier on final score)
 * - Red Mist: +50 per UFC bonus (flat bonus on final score)
 */

import { Roster, getPowerUpForFighter } from "@/domain/entities/Roster";
import { Fight, didFighterWin, receivedPerformanceBonus } from "@/domain/entities/Fight";
import { POWER_UP_EFFECTS } from "@/shared/constants/scoring-constants";

export interface PowerUpResult {
  multiplier: number;
  flatBonus: number;
}

export class PowerUpApplicator {
  /**
   * Check if Resilience power-up should convert a loss to a win
   * Resilience activates when: fighter lost + has FOTN bonus
   */
  shouldResilienceActivate(
    roster: Roster,
    fight: Fight,
    fighterId: string
  ): boolean {
    const powerUp = getPowerUpForFighter(roster, fighterId);
    if (!powerUp || powerUp.type !== "Resilience") {
      return false;
    }

    // Must have lost
    if (didFighterWin(fight, fighterId)) {
      return false;
    }

    // Must have FOTN
    if (!fight.bonuses.fightOfTheNight) {
      return false;
    }

    return true;
  }

  /**
   * Apply power-up effect to the final score
   * This is called AFTER synergy and captain multipliers
   */
  applyPowerUp(
    roster: Roster,
    fight: Fight,
    fighterId: string,
    currentScore: number
  ): PowerUpResult {
    const powerUp = getPowerUpForFighter(roster, fighterId);

    if (!powerUp) {
      return {
        multiplier: 1.0,
        flatBonus: 0,
      };
    }

    switch (powerUp.type) {
      case "Hype Train":
        return this.applyHypeTrain(fight, fighterId, currentScore);

      case "Resilience":
        // Resilience is handled early in calculation (modifies victory points)
        // No additional effect here
        return {
          multiplier: 1.0,
          flatBonus: 0,
        };

      case "Blitz":
        return this.applyBlitz(fight, fighterId);

      case "Red Mist":
        return this.applyRedMist(fight, fighterId);

      default:
        return {
          multiplier: 1.0,
          flatBonus: 0,
        };
    }
  }

  /**
   * Hype Train: 2× on win, -2× on loss
   */
  private applyHypeTrain(
    fight: Fight,
    fighterId: string,
    currentScore: number
  ): PowerUpResult {
    const won = didFighterWin(fight, fighterId);

    if (won) {
      return {
        multiplier: POWER_UP_EFFECTS.HYPE_TRAIN.WIN_MULTIPLIER,
        flatBonus: 0,
      };
    } else {
      // Loss: -2× multiplier (negative)
      return {
        multiplier: POWER_UP_EFFECTS.HYPE_TRAIN.LOSS_MULTIPLIER,
        flatBonus: 0,
      };
    }
  }

  /**
   * Blitz: 3× if finished in Round 1
   */
  private applyBlitz(fight: Fight, fighterId: string): PowerUpResult {
    const won = didFighterWin(fight, fighterId);
    const isRound1 = fight.round === 1;
    const isFinish = fight.method !== "Decision" && fight.method !== "Draw";

    if (won && isRound1 && isFinish) {
      return {
        multiplier: POWER_UP_EFFECTS.BLITZ.ROUND_1_MULTIPLIER,
        flatBonus: 0,
      };
    }

    return {
      multiplier: 1.0,
      flatBonus: 0,
    };
  }

  /**
   * Red Mist: +50 per UFC bonus (POTN or FOTN)
   */
  private applyRedMist(fight: Fight, fighterId: string): PowerUpResult {
    let bonusCount = 0;

    // Count POTN
    if (receivedPerformanceBonus(fight, fighterId)) {
      bonusCount++;
    }

    // Count FOTN
    if (fight.bonuses.fightOfTheNight) {
      bonusCount++;
    }

    const flatBonus = bonusCount * POWER_UP_EFFECTS.RED_MIST.BONUS_PER_UFC_BONUS;

    return {
      multiplier: 1.0,
      flatBonus,
    };
  }
}
