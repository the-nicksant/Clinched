/**
 * Event Convex Functions
 *
 * Queries and mutations for UFC events.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get an event by ID
 */
export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all upcoming events
 */
export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();

    return events.sort((a, b) => a.eventDate - b.eventDate);
  },
});

/**
 * Get completed events
 */
export const getCompleted = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "completed"));

    const events = await query.collect();
    const sorted = events.sort((a, b) => b.eventDate - a.eventDate);

    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Get live events
 */
export const getLive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();
  },
});

/**
 * Get fight results for an event
 */
export const getFightResults = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const fights = await ctx.db
      .query("fights")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Only return fights with results (winnerId or No Contest)
    return fights.filter(
      (f) => f.winnerId !== undefined || f.method === "No Contest"
    );
  },
});

/**
 * Get all fights for an event (including upcoming)
 */
export const getFights = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fights")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Check if two fighters are in the same bout
 */
export const areInSameBout = query({
  args: {
    eventId: v.id("events"),
    fighter1Id: v.id("fighters"),
    fighter2Id: v.id("fighters"),
  },
  handler: async (ctx, args) => {
    const fights = await ctx.db
      .query("fights")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return fights.some(
      (fight) =>
        (fight.fighter1Id === args.fighter1Id &&
          fight.fighter2Id === args.fighter2Id) ||
        (fight.fighter1Id === args.fighter2Id &&
          fight.fighter2Id === args.fighter1Id)
    );
  },
});

/**
 * Create a new event
 */
export const create = mutation({
  args: {
    name: v.string(),
    eventDate: v.number(),
    location: v.string(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    isMainCard: v.boolean(),
    rosterLockTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", args);
  },
});

/**
 * Update event status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("events"),
    status: v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return await ctx.db.get(args.id);
  },
});
