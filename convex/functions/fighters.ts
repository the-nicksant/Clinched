/**
 * Fighter Convex Functions
 *
 * Queries and mutations for fighter data.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a fighter by ID
 */
export const getById = query({
  args: { id: v.id("fighters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get multiple fighters by IDs
 */
export const getByIds = query({
  args: { ids: v.array(v.id("fighters")) },
  handler: async (ctx, args) => {
    const fighters = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );
    return fighters.filter((f) => f !== null);
  },
});

/**
 * Get all fighters for an event (via fights)
 */
export const getByEventId = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const fights = await ctx.db
      .query("fights")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const fighterIds = new Set<string>();
    fights.forEach((fight) => {
      fighterIds.add(fight.fighter1Id);
      fighterIds.add(fight.fighter2Id);
    });

    const fighters = await Promise.all(
      Array.from(fighterIds).map((id) => ctx.db.get(id as any))
    );

    return fighters.filter((f) => f !== null);
  },
});

/**
 * Search fighters by name
 */
export const searchByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const allFighters = await ctx.db.query("fighters").collect();
    const searchLower = args.name.toLowerCase();
    return allFighters.filter(
      (f) =>
        f.name.toLowerCase().includes(searchLower) ||
        f.nickname?.toLowerCase().includes(searchLower)
    );
  },
});

/**
 * Get all active fighters
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("fighters")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Create a new fighter
 */
export const create = mutation({
  args: {
    name: v.string(),
    nickname: v.optional(v.string()),
    weightClass: v.string(),
    record: v.object({
      wins: v.number(),
      losses: v.number(),
      draws: v.number(),
    }),
    fighterClass: v.union(
      v.literal("Striker"),
      v.literal("Grappler"),
      v.literal("All-Rounder"),
      v.literal("Veteran")
    ),
    age: v.number(),
    imageUrl: v.optional(v.string()),
    sherdogUrl: v.optional(v.string()),
    tapologyUrl: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fighters", args);
  },
});

/**
 * Update a fighter
 */
export const update = mutation({
  args: {
    id: v.id("fighters"),
    updates: v.object({
      name: v.optional(v.string()),
      nickname: v.optional(v.string()),
      weightClass: v.optional(v.string()),
      record: v.optional(
        v.object({
          wins: v.number(),
          losses: v.number(),
          draws: v.number(),
        })
      ),
      fighterClass: v.optional(
        v.union(
          v.literal("Striker"),
          v.literal("Grappler"),
          v.literal("All-Rounder"),
          v.literal("Veteran")
        )
      ),
      age: v.optional(v.number()),
      imageUrl: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
    return await ctx.db.get(args.id);
  },
});
