/**
 * Roster Convex Functions
 *
 * Queries and mutations for user rosters.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a roster by ID
 */
export const getById = query({
  args: { id: v.id("rosters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all rosters for an event
 */
export const getByEventId = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rosters")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Get all rosters for a user
 */
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rosters")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get a user's roster for a specific event
 */
export const getByUserAndEvent = query({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const rosters = await ctx.db
      .query("rosters")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", args.userId).eq("eventId", args.eventId)
      )
      .collect();

    return rosters[0] || null;
  },
});

/**
 * Create a new roster
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    fighters: v.array(
      v.object({
        fighterId: v.id("fighters"),
        fightId: v.id("fights"),
        salary: v.number(),
        isCaptain: v.boolean(),
      })
    ),
    totalSalary: v.number(),
    powerUps: v.array(
      v.object({
        powerUpCardId: v.id("powerUpCards"),
        appliedToFighterId: v.id("fighters"),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if roster already exists for this user/event
    const existing = await ctx.db
      .query("rosters")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", args.userId).eq("eventId", args.eventId)
      )
      .first();

    if (existing) {
      throw new Error("Roster already exists for this event");
    }

    return await ctx.db.insert("rosters", args);
  },
});

/**
 * Update a roster
 */
export const update = mutation({
  args: {
    id: v.id("rosters"),
    fighters: v.optional(
      v.array(
        v.object({
          fighterId: v.id("fighters"),
          fightId: v.id("fights"),
          salary: v.number(),
          isCaptain: v.boolean(),
        })
      )
    ),
    totalSalary: v.optional(v.number()),
    powerUps: v.optional(
      v.array(
        v.object({
          powerUpCardId: v.id("powerUpCards"),
          appliedToFighterId: v.id("fighters"),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

/**
 * Update roster score and rank after event completion
 */
export const updateScore = mutation({
  args: {
    id: v.id("rosters"),
    finalScore: v.number(),
    breakdown: v.any(),
    rank: v.optional(v.number()),
    xpEarned: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

/**
 * Delete a roster
 */
export const remove = mutation({
  args: { id: v.id("rosters") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
