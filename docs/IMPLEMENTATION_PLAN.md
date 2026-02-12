# Clinched MVP: Implementation Plan

## 1. Technology Stack

### Core Framework
- **Next.js 14+** (App Router)
  - Server Components for data fetching
  - Server Actions for mutations
  - API Routes for webhooks and scraper triggers

### Backend & Database
- **Convex**
  - Real-time database
  - TypeScript-native queries and mutations
  - Built-in subscriptions for live leaderboards
  - Scheduled functions for automated scraping

### Authentication
- **Clerk**
  - Social logins (Google, Discord, Twitter/X)
  - User management
  - Webhook integration with Convex for user sync

### Web Scraping
- **Puppeteer** or **Cheerio** + **Axios**
  - Sherdog/Tapology data extraction
  - Run as Convex scheduled functions or Next.js API routes
  - Fallback to manual data entry for critical events

### Additional Libraries
- **Zod** - Schema validation
- **Recharts** or **Chart.js** - Statistics visualization
- **Tailwind CSS** + **shadcn/ui** - UI components
- **date-fns** - Date manipulation for event scheduling
- **React Hook Form** - Roster building forms

---

## 2. Convex Schema Design

### 2.1. Core Tables

#### `users`
```typescript
{
  _id: Id<"users">,
  _creationTime: number,
  clerkId: string,              // Synced from Clerk
  username: string,
  email: string,
  avatarUrl?: string,
  totalXP: number,              // Track XP (no unlocks in MVP)
  level: number,                // Calculated from XP
  createdAt: number,
}
```

#### `fighters`
```typescript
{
  _id: Id<"fighters">,
  _creationTime: number,
  name: string,
  nickname?: string,
  weightClass: string,          // "Lightweight", "Welterweight", etc.
  record: {                     // Win-Loss-Draw
    wins: number,
    losses: number,
    draws: number,
  },
  fighterClass: "Striker" | "Grappler" | "All-Rounder" | "Veteran",
  age: number,
  imageUrl?: string,
  sherdogUrl?: string,          // Source URL for scraping updates
  tapologyUrl?: string,
  isActive: boolean,            // Retired fighters = false
}
```

#### `events`
```typescript
{
  _id: Id<"events">,
  _creationTime: number,
  name: string,                 // "UFC 300: Pereira vs. Hill"
  eventDate: number,            // Timestamp
  location: string,
  status: "upcoming" | "live" | "completed" | "cancelled",
  isMainCard: boolean,          // TRUE if this is a PPV main card
  rosterLockTime: number,       // Timestamp when roster building closes
}
```

#### `fights`
```typescript
{
  _id: Id<"fights">,
  _creationTime: number,
  eventId: Id<"events">,
  fighter1Id: Id<"fighters">,
  fighter2Id: Id<"fighters">,
  fighter1Salary: number,       // Dynamic pricing based on odds
  fighter2Salary: number,
  weightClass: string,
  isMainEvent: boolean,
  isTitleFight: boolean,
  cardPosition: number,         // Order in the card (1 = first fight)

  // Populated after fight completes
  winnerId?: Id<"fighters">,
  method?: "KO/TKO" | "Submission" | "Decision" | "DQ" | "No Contest",
  decisionType?: "Unanimous" | "Split" | "Majority",
  round?: number,

  // Fight stats (for Volume scoring)
  stats?: {
    [fighterId: string]: {
      knockdowns: number,
      takedowns: number,
      submissionAttempts: number,
      significantStrikes: number,
    }
  },

  // Bonuses
  bonuses?: {
    fightOfTheNight: boolean,
    performanceBonus: Id<"fighters">[],  // Winner(s) of POTN
  },

  // Penalties
  penalties?: {
    [fighterId: string]: {
      weightMiss: boolean,
      pointDeductions: number,
    }
  }
}
```

#### `rosters`
```typescript
{
  _id: Id<"rosters">,
  _creationTime: number,
  userId: Id<"users">,
  eventId: Id<"events">,
  fighters: {
    fighterId: Id<"fighters">,
    fightId: Id<"fights">,
    salary: number,
    isCaptain: boolean,
  }[],  // Exactly 6 fighters
  totalSalary: number,          // Must be <= 10000

  // Power-ups (max 2)
  powerUps: {
    type: "Hype Train" | "Resilience" | "Blitz" | "Red Mist",
    appliedToFighterId: Id<"fighters">,
  }[],

  // Calculated after event completes
  finalScore?: number,
  breakdown?: {                 // Per-fighter scoring details
    [fighterId: string]: {
      baseScore: number,
      methodMultiplier: number,
      volumePoints: number,
      roundBonus: number,
      bonusPoints: number,
      synergyMultiplier: number,
      captainMultiplier: number,
      powerUpEffect?: string,
      finalScore: number,
    }
  },

  rank?: number,                // Global rank for this event
  xpEarned?: number,            // XP from captain performance
}
```

#### `leaderboards`
```typescript
{
  _id: Id<"leaderboards">,
  _creationTime: number,
  eventId: Id<"events">,
  userId: Id<"users">,
  rosterId: Id<"rosters">,
  score: number,
  rank: number,
  updatedAt: number,
}
```

### 2.2. Indexes
- `users.clerkId` (unique)
- `fighters.name`
- `events.eventDate`
- `events.status`
- `fights.eventId`
- `rosters.userId + eventId` (composite, unique per user per event)
- `leaderboards.eventId + rank` (for pagination)

---

## 3. Web Scraper Architecture

### 3.1. Data Sources
- **Primary:** Sherdog (https://www.sherdog.com)
  - Fighter profiles with records, age, weight class
  - Event listings and fight results
- **Secondary:** Tapology (https://www.tapology.com)
  - More detailed event schedules
  - Fight stats and bonuses

### 3.2. Scraper Modules

#### **Module 1: Event Scraper**
- **Frequency:** Daily (Convex scheduled function)
- **Target:** Upcoming UFC events
- **Data Extracted:**
  - Event name, date, location
  - Fight card lineup
  - Main/Preliminary card distinction
- **Storage:** Upsert to `events` and `fights` tables

#### **Module 2: Fighter Scraper**
- **Frequency:** Weekly + on-demand
- **Target:** Fighter profile pages
- **Data Extracted:**
  - Name, nickname, age, weight class
  - Win-loss record
  - Fighter photos
- **Storage:** Upsert to `fighters` table
- **Classification Logic:** ML model or rule-based (striking % vs. grappling %)

#### **Module 3: Results Scraper**
- **Frequency:** Post-event (triggered manually or 2 hours after event end)
- **Target:** Completed event results pages
- **Data Extracted:**
  - Winner, method, round, decision type
  - Fight stats (knockdowns, takedowns, strikes)
  - UFC bonuses (FOTN, POTN)
  - Penalties (weight misses, point deductions)
- **Storage:** Update `fights` table with results
- **Trigger:** Convex mutation to calculate all roster scores

#### **Module 4: Odds/Salary Calculator**
- **Input:** Fighter rankings, betting odds (if available)
- **Output:** Dynamic salary (1000-2500 range)
- **Logic:**
  - Champion/Top 5 = 2200-2500
  - Contenders = 1700-2199
  - Unranked = 1000-1699
  - Adjust for opponent strength

### 3.3. Implementation Approach
```typescript
// Convex scheduled function (runs daily at 6 AM UTC)
export const scrapeUpcomingEvents = internalMutation({
  handler: async (ctx) => {
    // 1. Scrape Sherdog/Tapology for next 60 days
    // 2. Parse HTML for event details
    // 3. For each event, scrape fight card
    // 4. Upsert events and fights to Convex
    // 5. Calculate fighter salaries
  }
});

// Manual trigger for post-event results
export const scrapeEventResults = internalMutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    // 1. Fetch event fights
    // 2. Scrape results for each fight
    // 3. Update fights with results, stats, bonuses
    // 4. Trigger score calculation for all rosters
  }
});
```

### 3.4. Fallback Strategy
- **Admin Dashboard:** Manual data entry UI for critical events
- **Data Validation:** Compare scraped data across multiple sources
- **Notification System:** Alert admins when scraper fails

---

## 4. Feature Modules & Components

### 4.1. Authentication Flow
1. User visits Clinched
2. Clerk handles sign-in (Google, Discord, Email)
3. Webhook triggers Convex mutation to create/update user record
4. User profile displays username, level, total XP

### 4.2. Event Discovery
- **Home Page:** List of upcoming events (next 30 days)
- **Event Card:** Shows date, location, main event fighters
- **Filter:** Upcoming / Live / Completed
- **CTA:** "Build Roster" button (locked if past rosterLockTime)

### 4.3. Roster Builder
- **Interface:** Drag-and-drop or click-to-add fighter selection
- **Fight List:** Display all fights in the event with fighter names + salaries
- **Roster Panel:** Shows 6 slots with:
  - Fighter name, class, salary
  - Captain toggle (only one allowed)
  - Remove button
- **Salary Counter:** Real-time display (e.g., "$7,200 / $10,000")
- **Power-Up Selector:** Dropdown to assign up to 2 power-ups
- **Validation:**
  - Exactly 6 fighters
  - Total salary <= $10,000
  - 1 captain required
  - Max 2 power-ups
- **Submit:** Create roster in Convex (triggers validation mutation)

### 4.4. Synergy Indicator
- **Visual Badges:** Show active synergies based on class composition
  - Example: "3 Strikers = +15% KO/TKO Bonus Active"
- **Color Coding:** Highlight fighters contributing to synergies

### 4.5. Scoring Engine (Convex Mutations)
```typescript
export const calculateRosterScore = internalMutation({
  args: { rosterId: v.id("rosters") },
  handler: async (ctx, { rosterId }) => {
    // 1. Fetch roster with fighters and fight results
    // 2. For each fighter:
    //    a. Calculate base victory points (100 or 0)
    //    b. Apply method multiplier (KO=2.0, Sub=1.8, etc.)
    //    c. Add volume points (KD, TD, Strikes)
    //    d. Add round bonus (R1=100, R2=60, etc.)
    //    e. Add UFC bonus points (FOTN/POTN = 100)
    //    f. Apply synergy multiplier (1.15 if applicable)
    //    g. Apply captain multiplier (1.5 if captain)
    //    h. Apply power-up effects
    //    i. Subtract penalties (weight miss, deductions)
    // 3. Sum all fighter scores = Final Roster Score
    // 4. Update roster with finalScore and breakdown
    // 5. Calculate XP earned (based on captain performance)
    // 6. Update user XP and level
    // 7. Upsert leaderboard entry
  }
});
```

### 4.6. Leaderboard
- **Global View:** Top 100 rosters for an event
- **Real-time Updates:** Convex subscriptions for live scoring during events
- **User Highlight:** Show current user's rank prominently
- **Filters:** Friends, Overall, My Rank
- **Columns:** Rank, Username, Score, Captain, Power-Ups

### 4.7. User Profile
- **Stats Display:**
  - Total XP, Level
  - Events participated
  - Best finish (highest rank)
  - Average score
- **History:** List of past rosters with scores
- **No unlocks in MVP** (XP is just for progression tracking)

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up infrastructure and authentication

- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Convex backend
- [ ] Implement Clerk authentication
- [ ] Create Convex schema (all tables)
- [ ] Set up Clerk webhook for user sync
- [ ] Build basic UI layout (header, nav, footer)
- [ ] Deploy to Vercel (dev environment)

**Deliverable:** Users can sign in and see their profile

---

### Phase 2: Data Layer (Week 3-4)
**Goal:** Build scraper and populate database

- [ ] Research Sherdog/Tapology HTML structure
- [ ] Build Event Scraper
  - [ ] Extract event listings
  - [ ] Extract fight cards
  - [ ] Classify fighters (Striker/Grappler/All-Rounder/Veteran)
- [ ] Build Fighter Scraper
  - [ ] Extract fighter profiles
  - [ ] Store fighter images
- [ ] Build Results Scraper
  - [ ] Extract fight outcomes
  - [ ] Extract fight stats (volume metrics)
  - [ ] Extract bonuses and penalties
- [ ] Implement Convex scheduled functions
- [ ] Create admin dashboard for manual data entry (fallback)
- [ ] Implement salary calculation algorithm

**Deliverable:** Database populated with upcoming events and fighters

---

### Phase 3: Roster Building (Week 5-6)
**Goal:** Core gameplay mechanic

- [ ] Event Discovery Page
  - [ ] List upcoming events
  - [ ] Filter by status (upcoming/live/completed)
  - [ ] Event detail view
- [ ] Roster Builder UI
  - [ ] Display event fights with fighter details
  - [ ] Add/remove fighters to roster (6 slots)
  - [ ] Real-time salary counter
  - [ ] Captain designation
  - [ ] Power-up assignment (all 4 types)
  - [ ] Synergy indicator (live updates)
- [ ] Roster Validation
  - [ ] Convex mutation to validate constraints
  - [ ] Error handling (over budget, missing captain, etc.)
- [ ] Save roster to Convex
- [ ] Lock roster editing after rosterLockTime

**Deliverable:** Users can build and submit rosters for events

---

### Phase 4: Scoring Engine (Week 7-8)
**Goal:** Calculate scores and display results

- [ ] Implement scoring algorithm (Convex mutation)
  - [ ] Victory + Method calculation
  - [ ] Volume points (KD, TD, Strikes)
  - [ ] Round bonuses
  - [ ] UFC bonuses (FOTN/POTN)
  - [ ] Synergy multiplier logic
  - [ ] Captain multiplier
  - [ ] Power-up effects:
    - [ ] Hype Train (2x win / 2x loss)
    - [ ] Resilience (FOTN loss = full points)
    - [ ] Blitz (3x for R1 finish)
    - [ ] Red Mist (+50 for any bonus)
  - [ ] Penalties (weight miss, deductions)
- [ ] Trigger score calculation after event completes
- [ ] Display score breakdown per fighter
- [ ] Calculate and award user XP
- [ ] Update user level based on XP

**Deliverable:** Scores calculated automatically post-event

---

### Phase 5: Leaderboard & Social (Week 9-10)
**Goal:** Competitive features

- [ ] Build leaderboard system
  - [ ] Global rankings per event
  - [ ] Real-time updates via Convex subscriptions
  - [ ] Pagination (top 100)
- [ ] Leaderboard UI
  - [ ] Display rank, username, score
  - [ ] Highlight current user
  - [ ] Click to view roster details
- [ ] User profile enhancements
  - [ ] Display XP and level
  - [ ] Show event history
  - [ ] Show best finishes
- [ ] Social features (optional for MVP)
  - [ ] Share roster on Twitter/X
  - [ ] Compare rosters with friends

**Deliverable:** Functional leaderboard with rankings

---

### Phase 6: Polish & Testing (Week 11-12)
**Goal:** Refinement and launch prep

- [ ] UI/UX improvements
  - [ ] Responsive design (mobile-first)
  - [ ] Loading states and skeletons
  - [ ] Error boundaries
  - [ ] Toast notifications
- [ ] Performance optimization
  - [ ] Image optimization (Next.js Image)
  - [ ] Code splitting
  - [ ] Caching strategies
- [ ] Testing
  - [ ] Unit tests for scoring logic
  - [ ] Integration tests for roster validation
  - [ ] E2E tests for critical flows
- [ ] Documentation
  - [ ] API documentation
  - [ ] Scoring rules explanation page
  - [ ] FAQ
- [ ] Analytics setup (Vercel Analytics, PostHog, or similar)
- [ ] Production deployment

**Deliverable:** MVP ready for beta launch

---

## 6. Key Technical Decisions

### 6.1. Why Convex?
- **Real-time subscriptions:** Perfect for live leaderboards during events
- **TypeScript-native:** Type-safe queries and mutations
- **Scheduled functions:** Built-in cron for automated scraping
- **No need for Redis/PostgreSQL:** All-in-one backend solution

### 6.2. Why Clerk?
- **Social logins:** Reduces friction for new users
- **Easy integration:** Webhooks work seamlessly with Convex
- **Production-ready:** Handles email verification, 2FA out of the box

### 6.3. Fighter Class Classification
Since fighter styles aren't explicitly labeled, we'll use heuristics:
- **Striker:** 70%+ significant strikes vs. grappling attempts
- **Grappler:** 60%+ takedowns/submissions in recent fights
- **Veteran:** Age 35+
- **All-Rounder:** Balanced stats (default)

For MVP, we can manually classify top fighters and use rule-based logic for others.

### 6.4. Salary Calculation Formula
```typescript
baseSalary = 1500;
rankingBonus = (15 - ranking) * 50; // Top 15 fighters get more
oddsAdjustment = (opponentRanking > ranking) ? +200 : -100; // Underdog bonus
finalSalary = clamp(baseSalary + rankingBonus + oddsAdjustment, 1000, 2500);
```

### 6.5. XP Calculation (No Unlocks in MVP)
```typescript
baseXP = 50; // For participating
captainWinBonus = 100; // If captain wins
captainMethodBonus = {
  "KO/TKO": 50,
  "Submission": 40,
  "Decision": 20,
};
totalXP = baseXP + (isCaptainWin ? captainWinBonus + methodBonus : 0);
```

Level thresholds: 100 XP = Level 2, 300 XP = Level 3, 600 XP = Level 4, etc. (exponential curve)

---

## 7. MVP Scope Summary

### Included in MVP:
- Full authentication (Clerk with social logins)
- Event and fighter data scraping (Sherdog/Tapology)
- Roster building with all constraints (6 fighters, $10k cap, 1 captain)
- All 4 fighter classes + synergy buffs
- All 4 power-up cards
- Complete scoring engine with all bonuses and penalties
- Global leaderboard per event
- User XP tracking (no unlocks)
- Responsive UI with Tailwind + shadcn/ui

### Deferred to Post-MVP:
- Power-up unlocks (all cards available from start in MVP)
- Friends/Private leagues
- In-app notifications
- Mobile app (focus on responsive web first)
- Advanced analytics (fighter stats trends, etc.)
- Live scoring during events (scores calculated post-event only)
- Multi-event leaderboards (season rankings)

---

## 8. Database Schema Diagram (Relationships)

```
users (1) ──< (M) rosters
events (1) ──< (M) fights
events (1) ──< (M) rosters
events (1) ──< (M) leaderboards
fighters (1) ──< (M) fights (as fighter1 or fighter2)
rosters (1) ──< (M) leaderboards
rosters (M) >── (M) fighters (via roster.fighters array)
```

---

## 9. Next Steps

1. **Review this plan** with the team for feedback
2. **Set up project repository** (GitHub)
3. **Create project board** (GitHub Projects or Linear)
4. **Initialize codebase** (Phase 1)
5. **Start scraper research** (identify exact Sherdog/Tapology selectors)

---

## Appendix: Example Convex Schema (TypeScript)

```typescript
// convex/schema.ts
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
    tapologyUrl: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_name", ["name"]),

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
      v.union(v.literal("Unanimous"), v.literal("Split"), v.literal("Majority"))
    ),
    round: v.optional(v.number()),
    stats: v.optional(v.any()),
    bonuses: v.optional(v.any()),
    penalties: v.optional(v.any()),
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
        type: v.union(
          v.literal("Hype Train"),
          v.literal("Resilience"),
          v.literal("Blitz"),
          v.literal("Red Mist")
        ),
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
```
