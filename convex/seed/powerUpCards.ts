/**
 * Seed Power-Up Cards
 *
 * Initial power-up cards for the game.
 * Run this once to populate the database with the default cards.
 *
 * To seed: Run `npx convex run seed/powerUpCards:seedPowerUpCards`
 */

import { mutation } from "../_generated/server";

export const seedPowerUpCards = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if cards already exist
    const existing = await ctx.db.query("powerUpCards").collect();
    if (existing.length > 0) {
      console.log("Power-up cards already seeded");
      return { message: "Cards already exist", count: existing.length };
    }

    // Seed the 4 default power-up cards
    const cards = [
      {
        name: "Hype Train",
        description:
          "All aboard! Double your score on a win, but lose double on a loss. High risk, high reward!",
        effectType: "multiplier_win_loss" as const,
        effectConfig: {
          winMultiplier: 2.0,
          lossMultiplier: -2.0,
        },
        isActive: true,
        cost: 0,
        imageUrl: undefined,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Resilience",
        description:
          "Turn defeat into victory! If your fighter loses but receives Fight of the Night, treat it as a decision win.",
        effectType: "loss_to_win_with_bonus" as const,
        effectConfig: {
          requiredBonus: "FOTN",
          treatAsMethodMultiplier: 1.2, // Unanimous decision equivalent
        },
        isActive: true,
        cost: 0,
        imageUrl: undefined,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Blitz",
        description:
          "Lightning fast! Triple your score if your fighter finishes the fight in Round 1.",
        effectType: "multiplier_round_finish" as const,
        effectConfig: {
          targetRound: 1,
          multiplier: 3.0,
          mustBeFinish: true,
        },
        isActive: true,
        cost: 0,
        imageUrl: undefined,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Red Mist",
        description:
          "See red and earn more! Gain +50 points for each UFC bonus your fighter receives (POTN or FOTN).",
        effectType: "flat_bonus_per_ufc_bonus" as const,
        effectConfig: {
          bonusPerUFCBonus: 50,
        },
        isActive: true,
        cost: 0,
        imageUrl: undefined,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Insert all cards
    const insertedIds = [];
    for (const card of cards) {
      const id = await ctx.db.insert("powerUpCards", card);
      insertedIds.push(id);
      console.log(`Inserted: ${card.name} (${id})`);
    }

    return {
      message: "Successfully seeded power-up cards",
      count: insertedIds.length,
      ids: insertedIds,
    };
  },
});

/**
 * Get all active power-up cards
 */
export const getActivePowerUpCards = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("powerUpCards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return cards;
  },
});
