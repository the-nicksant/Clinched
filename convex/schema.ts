import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    totalXP: v.number(),
    level: v.number(),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  fighters: defineTable({
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
  })
    .index("by_name", ["name"])
    .index("by_sherdogId", ["sherdogId"])
    .index("by_tapologyId", ["tapologyId"]),

  powerUpCards: defineTable({
    name: v.string(),
    description: v.string(),
    effectType: v.union(
      v.literal("multiplier_win_loss"),
      v.literal("loss_to_win_with_bonus"),
      v.literal("multiplier_round_finish"),
      v.literal("flat_bonus_per_ufc_bonus")
    ),
    effectConfig: v.any(), // Flexible object to support different effect configs
    isActive: v.boolean(),
    cost: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_isActive", ["isActive"])
    .index("by_name", ["name"]),

  events: defineTable({
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
  })
    .index("by_eventDate", ["eventDate"])
    .index("by_status", ["status"]),

  fights: defineTable({
    eventId: v.id("events"),
    fighter1Id: v.id("fighters"),
    fighter2Id: v.id("fighters"),
    fighter1Salary: v.number(),
    fighter2Salary: v.number(),
    weightClass: v.string(),
    isMainEvent: v.boolean(),
    isTitleFight: v.boolean(),
    cardPosition: v.number(),
    winnerId: v.optional(v.id("fighters")),
    method: v.optional(
      v.union(
        v.literal("KO/TKO"),
        v.literal("Submission"),
        v.literal("Decision"),
        v.literal("DQ"),
        v.literal("No Contest")
      )
    ),
    decisionType: v.optional(
      v.union(
        v.literal("Unanimous"),
        v.literal("Split"),
        v.literal("Majority")
      )
    ),
    round: v.optional(v.number()),
    stats: v.optional(
      v.object({
        fighter1: v.object({
          knockdowns: v.number(),
          takedowns: v.number(),
          submissionAttempts: v.number(),
          significantStrikes: v.number(),
        }),
        fighter2: v.object({
          knockdowns: v.number(),
          takedowns: v.number(),
          submissionAttempts: v.number(),
          significantStrikes: v.number(),
        }),
      })
    ),
    bonuses: v.optional(
      v.object({
        fightOfTheNight: v.boolean(),
        performanceBonus: v.array(v.id("fighters")),
      })
    ),
    penalties: v.optional(
      v.object({
        fighter1: v.optional(
          v.object({
            weightMiss: v.boolean(),
            pointDeductions: v.number(),
          })
        ),
        fighter2: v.optional(
          v.object({
            weightMiss: v.boolean(),
            pointDeductions: v.number(),
          })
        ),
      })
    ),
  }).index("by_event", ["eventId"]),

  rosters: defineTable({
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
        powerUpCardId: v.id("powerUpCards"), // Now references powerUpCards table
        appliedToFighterId: v.id("fighters"),
      })
    ),
    finalScore: v.optional(v.number()),
    breakdown: v.optional(v.any()),
    rank: v.optional(v.number()),
    xpEarned: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_user_event", ["userId", "eventId"]),

  leaderboards: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    rosterId: v.id("rosters"),
    score: v.number(),
    rank: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_rank", ["eventId", "rank"]),
});
