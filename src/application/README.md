# Application Layer

**Use cases and orchestration**

## Purpose
Coordinates domain services and infrastructure to execute application workflows.

## Rules
- ✅ Depends on Domain layer (interfaces)
- ✅ Uses Infrastructure implementations (via dependency injection)
- ✅ Returns DTOs (not domain entities)
- ❌ NO direct UI logic
- ❌ NO direct database calls (uses repositories)

## Structure

### `/use-cases`
Application workflows:
- **roster/**: BuildRoster, SubmitRoster, UpdateRoster
- **scoring/**: CalculateRosterScore, CalculateAllScores, AwardXP
- **events/**: GetUpcomingEvents, GetEventDetails
- **leaderboard/**: GetLeaderboard, UpdateRankings
- **user/**: GetUserProfile, UpdateUserXP

### `/dto`
Data Transfer Objects for presentation layer

### `/mappers`
Domain ↔ DTO conversions
