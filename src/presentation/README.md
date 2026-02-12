# Presentation Layer

**React components and UI**

## Purpose
Renders the user interface and handles user interactions.

## Rules
- ✅ Consumes DTOs from Application layer
- ✅ Calls use cases via hooks
- ✅ Only UI logic (rendering, events, animations)
- ❌ NO business logic
- ❌ NO direct Convex calls (goes through use cases)

## Structure

### `/components`
- **roster/**: RosterBuilder, FighterCard, PowerUpSelector, SynergyIndicator
- **events/**: EventList, EventCard, FightCard
- **leaderboard/**: LeaderboardTable, LeaderboardEntry
- **scoring/**: ScoreBreakdown, FighterScoreCard
- **user/**: UserProfile, XPBar, LevelBadge
- **shared/**: Reusable UI components (Button, Card, Modal)

### `/hooks`
Custom React hooks that integrate with use cases:
- `useRosterBuilder.ts`
- `useEventData.ts`
- `useLeaderboard.ts`
- `useUserProfile.ts`
- `useScoreCalculation.ts`

### `/pages`
Page-level components (thin wrappers for Next.js App Router)
