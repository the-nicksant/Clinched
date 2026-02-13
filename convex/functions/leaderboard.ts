/**
 * Leaderboard Convex Functions
 *
 * Queries and mutations for leaderboard data.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get leaderboard entries for an event
 */
export const getByEventId = query({
  args: {
    eventId: v.id("events"),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = args.page || 1;
    const pageSize = args.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const allEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_event_rank", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Sort by rank
    const sorted = allEntries.sort((a, b) => a.rank - b.rank);

    return {
      entries: sorted.slice(skip, skip + pageSize),
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.ceil(sorted.length / pageSize),
    };
  },
});

/**
 * Get a user's entry on the leaderboard
 */
export const getUserEntry = query({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboards")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return entries[0] || null;
  },
});

/**
 * Update or create a leaderboard entry
 */
export const upsert = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    rosterId: v.id("rosters"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if entry exists
    const existing = await ctx.db
      .query("leaderboards")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        rosterId: args.rosterId,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    // Create new entry with temporary rank (will be recalculated)
    const id = await ctx.db.insert("leaderboards", {
      eventId: args.eventId,
      userId: args.userId,
      rosterId: args.rosterId,
      score: args.score,
      rank: 9999, // Temporary rank
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Recalculate all ranks for an event
 */
export const recalculateRanks = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboards")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Sort by score descending
    const sorted = entries.sort((a, b) => b.score - a.score);

    // Update ranks
    for (let i = 0; i < sorted.length; i++) {
      await ctx.db.patch(sorted[i]._id, {
        rank: i + 1,
        updatedAt: Date.now(),
      });
    }

    return sorted.length;
  },
});

/**
 * Get participant count for an event
 */
export const getParticipantCount = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboards")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return entries.length;
  },
});

/**
 * Get leaderboard statistics for an event
 */
export const getStats = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboards")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (entries.length === 0) {
      return null;
    }

    const scores = entries.map((e) => e.score).sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);

    return {
      totalParticipants: entries.length,
      averageScore: Math.round(sum / entries.length),
      highestScore: scores[scores.length - 1],
      lowestScore: scores[0],
      medianScore: scores[Math.floor(scores.length / 2)],
    };
  },
});
