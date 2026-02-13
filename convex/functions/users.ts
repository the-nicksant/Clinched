/**
 * User Convex Functions
 *
 * Queries and mutations for user data.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a user by ID
 */
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a user by Clerk ID
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();

    return users[0] || null;
  },
});

/**
 * Get a user by username
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .collect();

    return users[0] || null;
  },
});

/**
 * Create a new user
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      ...args,
      totalXP: 0,
      level: 1,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update user XP and level
 */
export const updateXP = mutation({
  args: {
    id: v.id("users"),
    xpToAdd: v.number(),
    newLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.id, {
      totalXP: user.totalXP + args.xpToAdd,
      level: args.newLevel,
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(id, filteredUpdates);
    }

    return await ctx.db.get(id);
  },
});

/**
 * Get top users by level
 */
export const getTopByLevel = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const users = await ctx.db.query("users").collect();

    return users
      .sort((a, b) => b.level - a.level || b.totalXP - a.totalXP)
      .slice(0, limit);
  },
});
