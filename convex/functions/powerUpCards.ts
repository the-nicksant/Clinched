/**
 * PowerUpCard Convex Functions
 *
 * Queries and mutations for power-up card data.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a power-up card by ID
 */
export const getById = query({
  args: { id: v.id("powerUpCards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get multiple power-up cards by IDs
 */
export const getByIds = query({
  args: { ids: v.array(v.id("powerUpCards")) },
  handler: async (ctx, args) => {
    const cards = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );
    return cards.filter((c) => c !== null);
  },
});

/**
 * Get all active power-up cards
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("powerUpCards")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Get power-up cards by effect type
 */
export const getByEffectType = query({
  args: {
    effectType: v.union(
      v.literal("multiplier_win_loss"),
      v.literal("loss_to_win_with_bonus"),
      v.literal("multiplier_round_finish"),
      v.literal("flat_bonus_per_ufc_bonus")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("powerUpCards")
      .filter((q) => q.eq(q.field("effectType"), args.effectType))
      .collect();
  },
});

/**
 * Create a new power-up card
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    effectType: v.union(
      v.literal("multiplier_win_loss"),
      v.literal("loss_to_win_with_bonus"),
      v.literal("multiplier_round_finish"),
      v.literal("flat_bonus_per_ufc_bonus")
    ),
    effectConfig: v.any(),
    isActive: v.boolean(),
    cost: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("powerUpCards", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update a power-up card
 */
export const update = mutation({
  args: {
    id: v.id("powerUpCards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    effectType: v.optional(
      v.union(
        v.literal("multiplier_win_loss"),
        v.literal("loss_to_win_with_bonus"),
        v.literal("multiplier_round_finish"),
        v.literal("flat_bonus_per_ufc_bonus")
      )
    ),
    effectConfig: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
    cost: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Deactivate a power-up card
 */
export const deactivate = mutation({
  args: { id: v.id("powerUpCards") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get all power-up cards (including inactive)
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("powerUpCards").collect();
  },
});
