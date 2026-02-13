/**
 * Scraper Convex Functions
 *
 * Mutations for storing scraped data from Tapology.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create or update an event from scraped data
 */
export const upsertEvent = mutation({
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
    sherdogUrl: v.optional(v.string()),
    tapologyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if event already exists by name and date
    const existing = await ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("eventDate"), args.eventDate)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("events", args);
  },
});

/**
 * Create or update a fighter from scraped data
 */
export const upsertFighter = mutation({
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
    sherdogId: v.optional(v.string()),
    tapologyUrl: v.optional(v.string()),
    tapologyId: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if fighter already exists by name
    const existing = await ctx.db
      .query("fighters")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("fighters", args);
  },
});

/**
 * Create or update a fight from scraped data
 */
export const upsertFight = mutation({
  args: {
    eventId: v.id("events"),
    fighter1Id: v.id("fighters"),
    fighter2Id: v.id("fighters"),
    fighter1Salary: v.number(),
    fighter2Salary: v.number(),
    weightClass: v.string(),
    isMainEvent: v.boolean(),
    isTitleFight: v.boolean(),
    cardPosition: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if fight already exists
    const existing = await ctx.db
      .query("fights")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("fighter1Id"), args.fighter1Id),
            q.eq(q.field("fighter2Id"), args.fighter2Id)
          ),
          q.and(
            q.eq(q.field("fighter1Id"), args.fighter2Id),
            q.eq(q.field("fighter2Id"), args.fighter1Id)
          )
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("fights", args);
  },
});

/**
 * Get fighter by name
 */
export const getFighterByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fighters")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

/**
 * Get event by name and date
 */
export const getEventByNameAndDate = query({
  args: { name: v.string(), eventDate: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("eventDate"), args.eventDate)
        )
      )
      .first();
  },
});

/**
 * Batch create fighters
 */
export const batchCreateFighters = mutation({
  args: {
    fighters: v.array(
      v.object({
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
        tapologyUrl: v.optional(v.string()),
        tapologyId: v.optional(v.string()),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: string[] = [];

    for (const fighter of args.fighters) {
      // Check if fighter exists
      const existing = await ctx.db
        .query("fighters")
        .withIndex("by_name", (q) => q.eq("name", fighter.name))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, fighter);
        results.push(existing._id);
      } else {
        const id = await ctx.db.insert("fighters", fighter);
        results.push(id);
      }
    }

    return results;
  },
});
