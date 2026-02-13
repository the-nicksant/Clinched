/**
 * Scoring Convex Functions
 *
 * Mutations for calculating and updating roster scores.
 * These are called after an event completes.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Calculate and store the score for a single roster
 * Called after fight results are available
 */
export const calculateRosterScore = mutation({
  args: {
    rosterId: v.id("rosters"),
  },
  handler: async (ctx, args) => {
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      throw new Error("Roster not found");
    }

    const event = await ctx.db.get(roster.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Get all fight results for this event
    const fights = await ctx.db
      .query("fights")
      .withIndex("by_event", (q) => q.eq("eventId", roster.eventId))
      .collect();

    // Filter to only completed fights
    const completedFights = fights.filter((f) => f.winnerId !== undefined);

    // Note: Actual scoring calculation would be done client-side
    // using the ScoringEngine, then stored here
    // This is a placeholder for the server-side storage

    return {
      rosterId: args.rosterId,
      eventId: roster.eventId,
      fightsProcessed: completedFights.length,
    };
  },
});

/**
 * Calculate scores for all rosters in an event
 * Called when event status changes to "completed"
 */
export const calculateAllScores = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status !== "completed") {
      throw new Error("Event is not yet completed");
    }

    // Get all rosters for this event
    const rosters = await ctx.db
      .query("rosters")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Note: In practice, scoring would be calculated client-side
    // and then stored. This function is for batch processing.

    return {
      eventId: args.eventId,
      rostersToProcess: rosters.length,
    };
  },
});

/**
 * Store calculated score breakdown for a roster
 */
export const storeScoreBreakdown = mutation({
  args: {
    rosterId: v.id("rosters"),
    finalScore: v.number(),
    breakdown: v.any(), // RosterScoreBreakdownDTO
    xpEarned: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rosterId, {
      finalScore: args.finalScore,
      breakdown: args.breakdown,
      xpEarned: args.xpEarned,
    });

    return await ctx.db.get(args.rosterId);
  },
});

/**
 * Get score breakdown for a roster
 */
export const getScoreBreakdown = query({
  args: { rosterId: v.id("rosters") },
  handler: async (ctx, args) => {
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      return null;
    }

    return {
      rosterId: args.rosterId,
      finalScore: roster.finalScore,
      breakdown: roster.breakdown,
      xpEarned: roster.xpEarned,
      rank: roster.rank,
    };
  },
});
