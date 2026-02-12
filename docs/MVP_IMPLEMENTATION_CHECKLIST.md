# OctoDraft MVP: Implementation Checklist

This is a practical, step-by-step checklist for building the MVP following clean architecture principles.

---

## Phase 1: Project Setup & Foundation

### 1.1. Initialize Project
- [ ] Create Next.js 14 project with TypeScript and App Router
  ```bash
  npx create-next-app@latest fight-deck --typescript --app --tailwind
  ```
- [ ] Initialize Convex backend
  ```bash
  npx convex init
  ```
- [ ] Set up folder structure (see CLEAN_ARCHITECTURE_PLAN.md)
- [ ] Configure TypeScript paths in `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/domain/*": ["./src/domain/*"],
        "@/application/*": ["./src/application/*"],
        "@/infrastructure/*": ["./src/infrastructure/*"],
        "@/presentation/*": ["./src/presentation/*"],
        "@/shared/*": ["./src/shared/*"]
      }
    }
  }
  ```
- [ ] Install core dependencies:
  ```bash
  npm install zod date-fns
  npm install -D @types/node vitest
  ```

### 1.2. Convex Setup
- [ ] Create Convex schema in `convex/schema.ts` (copy from IMPLEMENTATION_PLAN.md)
- [ ] Define core tables:
  - [ ] `users` table
  - [ ] `fighters` table
  - [ ] `events` table
  - [ ] `fights` table
  - [ ] `rosters` table
  - [ ] `leaderboards` table
- [ ] Set up indexes for each table
- [ ] Test schema with `npx convex dev`

### 1.3. Clerk Authentication
- [ ] Sign up for Clerk account
- [ ] Create new Clerk application
- [ ] Install Clerk SDK:
  ```bash
  npm install @clerk/nextjs
  ```
- [ ] Configure environment variables in `.env.local`:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  ```
- [ ] Wrap app with `ClerkProvider` in `app/layout.tsx`
- [ ] Create sign-in and sign-up pages
- [ ] Set up Clerk webhook for user sync with Convex
- [ ] Create `convex/webhooks/clerk.ts` for user creation/update

### 1.4. UI Foundation
- [ ] Install shadcn/ui:
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Install core UI components:
  - [ ] Button
  - [ ] Card
  - [ ] Input
  - [ ] Select
  - [ ] Dialog (Modal)
  - [ ] Toast
  - [ ] Badge
  - [ ] Skeleton (loading states)
- [ ] Create basic app layout (`app/layout.tsx`)
- [ ] Create navigation header component
- [ ] Set up Tailwind config with custom colors for OctoDraft theme

---

## Phase 2: Domain Layer (Business Logic)

### 2.1. Domain Entities
- [ ] Create `src/domain/entities/Fighter.ts`
  - [ ] Properties: id, name, fighterClass, age, weightClass, record
  - [ ] Methods: `isVeteran()`, `hasWinStreak()`
- [ ] Create `src/domain/entities/Event.ts`
  - [ ] Properties: id, name, eventDate, location, status, rosterLockTime
  - [ ] Methods: `isLocked()`, `isUpcoming()`
- [ ] Create `src/domain/entities/Fight.ts`
  - [ ] Properties: id, eventId, fighter1Id, fighter2Id, salaries, result, stats
  - [ ] Methods: `getWinner()`, `isFinished()`
- [ ] Create `src/domain/entities/Roster.ts`
  - [ ] Properties: id, userId, eventId, fighters, powerUps
  - [ ] Methods: `addFighter()`, `removeFighter()`, `setCaptain()`, `getTotalSalary()`, `getCaptain()`
- [ ] Create `src/domain/entities/User.ts`
  - [ ] Properties: id, clerkId, username, totalXP, level
  - [ ] Methods: `addXP()`, `calculateLevel()`

### 2.2. Value Objects
- [ ] Create `src/domain/value-objects/FighterClass.ts`
  - [ ] Enum: Striker, Grappler, All-Rounder, Veteran
  - [ ] Static factory methods
- [ ] Create `src/domain/value-objects/PowerUp.ts`
  - [ ] Types: Hype Train, Resilience, Blitz, Red Mist
- [ ] Create `src/domain/value-objects/Money.ts`
  - [ ] Immutable value object for salary calculations
  - [ ] Constants: SALARY_CAP = 10000
- [ ] Create `src/domain/value-objects/Score.ts`
  - [ ] Properties: total, breakdown
  - [ ] Factory: `Score.zero()`
- [ ] Create `src/domain/value-objects/FightStats.ts`
  - [ ] Properties: knockdowns, takedowns, submissionAttempts, significantStrikes

### 2.3. Repository Interfaces (Contracts)
- [ ] Create `src/domain/repositories/IFighterRepository.ts`
  - [ ] Methods: `findById()`, `findByEvent()`, `findAll()`, `save()`
- [ ] Create `src/domain/repositories/IEventRepository.ts`
  - [ ] Methods: `findById()`, `findUpcoming()`, `findByStatus()`, `save()`
- [ ] Create `src/domain/repositories/IFightRepository.ts`
  - [ ] Methods: `findById()`, `findByEvent()`, `save()`
- [ ] Create `src/domain/repositories/IRosterRepository.ts`
  - [ ] Methods: `findById()`, `findByUserAndEvent()`, `save()`, `update()`
- [ ] Create `src/domain/repositories/IUserRepository.ts`
  - [ ] Methods: `findById()`, `findByClerkId()`, `save()`, `updateXP()`
- [ ] Create `src/domain/repositories/ILeaderboardRepository.ts`
  - [ ] Methods: `findByEvent()`, `upsert()`, `updateRankings()`

### 2.4. Domain Services (Core Business Logic)

#### 2.4.1. Scoring Engine
- [ ] Create `src/domain/services/ScoringEngine.ts`
- [ ] Implement `calculateFighterScore()` method:
  - [ ] Step 1: Calculate victory points (V)
  - [ ] Step 2: Calculate method multiplier (M)
  - [ ] Step 3: Calculate volume points (Vol)
  - [ ] Step 4: Calculate round bonus (R)
  - [ ] Step 5: Calculate UFC bonus (B)
  - [ ] Step 6: Calculate base score: (V × M) + Vol + R + B
  - [ ] Step 7: Apply synergy multiplier (Syn)
  - [ ] Step 8: Apply captain multiplier (Cap)
  - [ ] Step 9: Apply power-up effects (PU)
  - [ ] Step 10: Subtract penalties (P)
- [ ] Implement `calculateRosterScore()` method (sum of all fighter scores)
- [ ] Write unit tests for scoring engine with examples from SCORING_RULES.md

#### 2.4.2. Synergy Calculator
- [ ] Create `src/domain/services/SynergyCalculator.ts`
- [ ] Implement `calculate()` method:
  - [ ] Count fighter classes in roster
  - [ ] Check Striker synergy (3+ Strikers, won by KO/TKO)
  - [ ] Check Grappler synergy (3+ Grapplers, won by Submission)
  - [ ] Check All-Rounder synergy (3+ All-Rounders, won by Decision)
  - [ ] Check Veteran synergy (3+ Veterans, lost by split decision)
  - [ ] Return appropriate multiplier
- [ ] Write unit tests for all synergy combinations

#### 2.4.3. Power-Up Applicator
- [ ] Create `src/domain/services/PowerUpApplicator.ts`
- [ ] Implement `apply()` method:
  - [ ] Hype Train: 2x on win, -2x volume on loss
  - [ ] Resilience: Full points if loss + FOTN
  - [ ] Blitz: 3x if finished in Round 1
  - [ ] Red Mist: +50 per UFC bonus
- [ ] Write unit tests for each power-up scenario

#### 2.4.4. Roster Validator
- [ ] Create `src/domain/services/RosterValidator.ts`
- [ ] Implement `validate()` method:
  - [ ] Check exactly 6 fighters
  - [ ] Check salary cap (≤ $10,000)
  - [ ] Check exactly 1 captain
  - [ ] Check max 2 power-ups
  - [ ] Check no duplicate fighters
  - [ ] Check no both fighters from same bout
- [ ] Return `ValidationResult` with errors array
- [ ] Write unit tests for all validation rules

#### 2.4.5. Salary Calculator
- [ ] Create `src/domain/services/SalaryCalculator.ts`
- [ ] Implement dynamic salary calculation:
  - [ ] Base salary by ranking (Champion, Top 5, Top 10, etc.)
  - [ ] Adjust for opponent strength
  - [ ] Clamp to range: $1,000 - $2,500
- [ ] Write unit tests

#### 2.4.6. XP Calculator
- [ ] Create `src/domain/services/XPCalculator.ts`
- [ ] Implement `calculate()` method:
  - [ ] Base XP: 50 for participation
  - [ ] Captain win bonus: +100
  - [ ] Method bonus: KO/TKO (+50), Submission (+40), Decision (+20)
- [ ] Implement `calculateLevel()` method (exponential XP curve)
- [ ] Write unit tests

### 2.5. Domain Errors
- [ ] Create `src/domain/errors/RosterValidationError.ts`
- [ ] Create `src/domain/errors/SalaryCapExceededError.ts`
- [ ] Create `src/domain/errors/EventLockedError.ts`
- [ ] Create `src/domain/errors/DomainError.ts` (base class)

---

## Phase 3: Infrastructure Layer

### 3.1. Convex Repositories (Implement Domain Interfaces)

#### 3.1.1. Fighter Repository
- [ ] Create `src/infrastructure/convex/repositories/ConvexFighterRepository.ts`
- [ ] Implement `IFighterRepository` interface
- [ ] Create mapper: `FighterConvexMapper.ts` (Convex schema ↔ Domain entity)
- [ ] Implement methods:
  - [ ] `findById()` - calls `convex/functions/fighters.ts:get`
  - [ ] `findByEvent()` - calls `convex/functions/fighters.ts:listByEvent`
  - [ ] `save()` - calls `convex/functions/fighters.ts:create`

#### 3.1.2. Event Repository
- [ ] Create `src/infrastructure/convex/repositories/ConvexEventRepository.ts`
- [ ] Implement `IEventRepository` interface
- [ ] Create mapper: `EventConvexMapper.ts`
- [ ] Implement methods:
  - [ ] `findById()`
  - [ ] `findUpcoming()`
  - [ ] `findByStatus()`
  - [ ] `save()`

#### 3.1.3. Fight Repository
- [ ] Create `src/infrastructure/convex/repositories/ConvexFightRepository.ts`
- [ ] Implement `IFightRepository` interface
- [ ] Create mapper: `FightConvexMapper.ts`
- [ ] Implement methods:
  - [ ] `findById()`
  - [ ] `findByEvent()`
  - [ ] `save()`
  - [ ] `updateResults()`

#### 3.1.4. Roster Repository
- [ ] Create `src/infrastructure/convex/repositories/ConvexRosterRepository.ts`
- [ ] Implement `IRosterRepository` interface
- [ ] Create mapper: `RosterConvexMapper.ts`
- [ ] Implement methods:
  - [ ] `findById()` (with all relations: fighters, fights)
  - [ ] `findByUserAndEvent()`
  - [ ] `save()`
  - [ ] `update()`

#### 3.1.5. User Repository
- [ ] Create `src/infrastructure/convex/repositories/ConvexUserRepository.ts`
- [ ] Implement `IUserRepository` interface
- [ ] Create mapper: `UserConvexMapper.ts`
- [ ] Implement methods:
  - [ ] `findById()`
  - [ ] `findByClerkId()`
  - [ ] `save()`
  - [ ] `updateXP()`

#### 3.1.6. Leaderboard Repository
- [ ] Create `src/infrastructure/convex/repositories/ConvexLeaderboardRepository.ts`
- [ ] Implement `ILeaderboardRepository` interface
- [ ] Implement methods:
  - [ ] `findByEvent()` (paginated, top 100)
  - [ ] `upsert()`
  - [ ] `updateRankings()`

### 3.2. Convex Backend Functions

#### 3.2.1. Fighter Functions
- [ ] Create `convex/functions/fighters.ts`
- [ ] Implement queries:
  - [ ] `get(id)` - Get fighter by ID
  - [ ] `list()` - List all active fighters
  - [ ] `listByEvent(eventId)` - Get fighters in an event
- [ ] Implement mutations:
  - [ ] `create(data)` - Create new fighter
  - [ ] `update(id, data)` - Update fighter

#### 3.2.2. Event Functions
- [ ] Create `convex/functions/events.ts`
- [ ] Implement queries:
  - [ ] `get(id)` - Get event by ID
  - [ ] `listUpcoming()` - Get upcoming events (next 30 days)
  - [ ] `listByStatus(status)` - Filter by status
- [ ] Implement mutations:
  - [ ] `create(data)` - Create new event
  - [ ] `update(id, data)` - Update event
  - [ ] `lockRosters(eventId)` - Lock event for roster submissions

#### 3.2.3. Fight Functions
- [ ] Create `convex/functions/fights.ts`
- [ ] Implement queries:
  - [ ] `get(id)` - Get fight by ID
  - [ ] `listByEvent(eventId)` - Get all fights for an event
- [ ] Implement mutations:
  - [ ] `create(data)` - Create new fight
  - [ ] `updateResults(id, results)` - Update fight results post-event

#### 3.2.4. Roster Functions
- [ ] Create `convex/functions/rosters.ts`
- [ ] Implement queries:
  - [ ] `get(id)` - Get roster by ID (with all relations)
  - [ ] `getByUserAndEvent(userId, eventId)` - Get user's roster for event
  - [ ] `listByEvent(eventId)` - Get all rosters for event
- [ ] Implement mutations:
  - [ ] `create(data)` - Create new roster
  - [ ] `update(id, data)` - Update roster
  - [ ] `delete(id)` - Delete roster

#### 3.2.5. Scoring Functions
- [ ] Create `convex/functions/scoring.ts`
- [ ] Implement mutations:
  - [ ] `calculateRosterScore(rosterId)` - Trigger score calculation
  - [ ] `calculateAllScores(eventId)` - Calculate scores for all rosters in event
- [ ] These should call the domain `ScoringEngine` service

#### 3.2.6. Leaderboard Functions
- [ ] Create `convex/functions/leaderboard.ts`
- [ ] Implement queries:
  - [ ] `getByEvent(eventId)` - Get leaderboard (paginated, top 100)
  - [ ] `getUserRank(eventId, userId)` - Get specific user's rank
- [ ] Implement mutations:
  - [ ] `updateRankings(eventId)` - Recalculate all rankings

#### 3.2.7. User Functions
- [ ] Create `convex/functions/users.ts`
- [ ] Implement queries:
  - [ ] `get(id)` - Get user by ID
  - [ ] `getByClerkId(clerkId)` - Get user by Clerk ID
- [ ] Implement mutations:
  - [ ] `create(data)` - Create new user (from Clerk webhook)
  - [ ] `updateXP(userId, xp)` - Add XP to user

### 3.3. Convex Scheduled Functions (Crons)
- [ ] Create `convex/crons/scrapeEvents.ts`
  - [ ] Schedule: Daily at 6 AM UTC
  - [ ] Task: Scrape upcoming events from Sherdog/Tapology
- [ ] Create `convex/crons/updateRankings.ts`
  - [ ] Schedule: Post-event (triggered manually or 2 hours after event end)
  - [ ] Task: Calculate all scores and update leaderboard

### 3.4. Web Scrapers

#### 3.4.1. Scraper Interfaces
- [ ] Create `src/infrastructure/scrapers/interfaces/IFightDataScraper.ts`
- [ ] Define methods: `scrapeEvents()`, `scrapeFighters()`, `scrapeResults()`

#### 3.4.2. Sherdog Scrapers
- [ ] Research Sherdog HTML structure (inspect pages manually)
- [ ] Create `src/infrastructure/scrapers/sherdog/SherdogEventScraper.ts`
  - [ ] Scrape event listings from https://www.sherdog.com/organizations/Ultimate-Fighting-Championship-UFC-2
  - [ ] Extract: event name, date, location
  - [ ] Extract fight card (fighter names, weight class)
- [ ] Create `src/infrastructure/scrapers/sherdog/SherdogFighterScraper.ts`
  - [ ] Scrape fighter profiles
  - [ ] Extract: name, age, record, weight class
- [ ] Create `src/infrastructure/scrapers/sherdog/SherdogResultsScraper.ts`
  - [ ] Scrape completed event results
  - [ ] Extract: winner, method, round, decision type
  - [ ] Extract fight stats (KDs, TDs, strikes)
- [ ] Install scraping dependencies:
  ```bash
  npm install puppeteer cheerio axios
  ```

#### 3.4.3. Tapology Scraper (Optional Fallback)
- [ ] Create `src/infrastructure/scrapers/tapology/TapologyEventScraper.ts`
- [ ] Use as backup data source if Sherdog fails

#### 3.4.4. Fighter Classification Logic
- [ ] Create `src/infrastructure/scrapers/classifiers/FighterClassifier.ts`
- [ ] Implement heuristics:
  - [ ] Striker: 70%+ striking stats
  - [ ] Grappler: 60%+ takedowns/submissions
  - [ ] All-Rounder: Balanced
  - [ ] Veteran: Age 35+

---

## Phase 4: Application Layer (Use Cases)

### 4.1. DTOs (Data Transfer Objects)
- [ ] Create `src/application/dto/FighterDTO.ts`
- [ ] Create `src/application/dto/EventDTO.ts`
- [ ] Create `src/application/dto/FightDTO.ts`
- [ ] Create `src/application/dto/RosterDTO.ts`
- [ ] Create `src/application/dto/UserDTO.ts`
- [ ] Create `src/application/dto/LeaderboardEntryDTO.ts`
- [ ] Create `src/application/dto/ScoreBreakdownDTO.ts`

### 4.2. Mappers (Domain ↔ DTO)
- [ ] Create `src/application/mappers/FighterMapper.ts`
  - [ ] `toDTO(fighter: Fighter): FighterDTO`
  - [ ] `toDomain(dto: FighterDTO): Fighter`
- [ ] Create `src/application/mappers/RosterMapper.ts`
- [ ] Create `src/application/mappers/ScoreMapper.ts`
- [ ] Create `src/application/mappers/EventMapper.ts`

### 4.3. Roster Use Cases
- [ ] Create `src/application/use-cases/roster/BuildRosterUseCase.ts`
  - [ ] Initialize empty roster for user + event
  - [ ] Return `RosterDTO`
- [ ] Create `src/application/use-cases/roster/UpdateRosterUseCase.ts`
  - [ ] Add/remove fighters
  - [ ] Update captain
  - [ ] Apply power-ups
  - [ ] Validate on each change
- [ ] Create `src/application/use-cases/roster/SubmitRosterUseCase.ts`
  - [ ] Final validation
  - [ ] Check if event is locked
  - [ ] Save roster to repository
  - [ ] Return `RosterDTO` or error
- [ ] Create `src/application/use-cases/roster/GetUserRosterUseCase.ts`
  - [ ] Fetch roster by user + event
  - [ ] Return `RosterDTO` or null

### 4.4. Scoring Use Cases
- [ ] Create `src/application/use-cases/scoring/CalculateRosterScoreUseCase.ts`
  - [ ] Fetch roster with all relations (fighters, fights)
  - [ ] Call `ScoringEngine.calculateRosterScore()`
  - [ ] Update roster with final score
  - [ ] Calculate and award XP
  - [ ] Return `ScoreBreakdownDTO`
- [ ] Create `src/application/use-cases/scoring/CalculateAllScoresUseCase.ts`
  - [ ] Fetch all rosters for event
  - [ ] Calculate score for each
  - [ ] Update leaderboard rankings
  - [ ] Trigger via Convex cron post-event
- [ ] Create `src/application/use-cases/scoring/AwardXPUseCase.ts`
  - [ ] Calculate XP from roster results
  - [ ] Update user XP
  - [ ] Recalculate user level

### 4.5. Event Use Cases
- [ ] Create `src/application/use-cases/events/GetUpcomingEventsUseCase.ts`
  - [ ] Fetch events with status "upcoming"
  - [ ] Sort by date (soonest first)
  - [ ] Return `EventDTO[]`
- [ ] Create `src/application/use-cases/events/GetEventDetailsUseCase.ts`
  - [ ] Fetch event by ID
  - [ ] Include all fights and fighters
  - [ ] Return `EventDTO` with populated fights
- [ ] Create `src/application/use-cases/events/LockEventRostersUseCase.ts`
  - [ ] Update event status to "live"
  - [ ] Prevent new roster submissions

### 4.6. Leaderboard Use Cases
- [ ] Create `src/application/use-cases/leaderboard/GetLeaderboardUseCase.ts`
  - [ ] Fetch leaderboard by event (top 100)
  - [ ] Return `LeaderboardEntryDTO[]`
- [ ] Create `src/application/use-cases/leaderboard/UpdateRankingsUseCase.ts`
  - [ ] Fetch all rosters for event
  - [ ] Sort by score (descending)
  - [ ] Assign ranks (handle ties)
  - [ ] Update leaderboard table

### 4.7. User Use Cases
- [ ] Create `src/application/use-cases/user/GetUserProfileUseCase.ts`
  - [ ] Fetch user by Clerk ID
  - [ ] Include stats (events participated, best finish, avg score)
  - [ ] Return `UserDTO`
- [ ] Create `src/application/use-cases/user/UpdateUserXPUseCase.ts`
  - [ ] Add XP to user
  - [ ] Recalculate level
  - [ ] Return updated `UserDTO`

### 4.8. Dependency Injection Setup
- [ ] Create `src/shared/di/container.ts` (simple DI container)
- [ ] Register all services and repositories
- [ ] Create factory functions for use cases

---

## Phase 5: Presentation Layer (UI)

### 5.1. Custom Hooks

#### 5.1.1. Roster Builder Hook
- [ ] Create `src/presentation/hooks/useRosterBuilder.ts`
- [ ] State management:
  - [ ] `roster: RosterDTO | null`
  - [ ] `selectedFighters: FighterDTO[]`
  - [ ] `totalSalary: number`
  - [ ] `captain: FighterDTO | null`
  - [ ] `powerUps: PowerUpDTO[]`
  - [ ] `validationErrors: string[]`
- [ ] Actions:
  - [ ] `addFighter(fighter, fight, salary)`
  - [ ] `removeFighter(fighterId)`
  - [ ] `setCaptain(fighterId)`
  - [ ] `addPowerUp(type, fighterId)`
  - [ ] `removePowerUp(type)`
  - [ ] `submitRoster()`
- [ ] Real-time validation on each change
- [ ] Calls `SubmitRosterUseCase` on submit

#### 5.1.2. Event Data Hook
- [ ] Create `src/presentation/hooks/useEventData.ts`
- [ ] Fetch upcoming events
- [ ] Fetch event details with fights
- [ ] Use Convex `useQuery` for real-time updates

#### 5.1.3. Leaderboard Hook
- [ ] Create `src/presentation/hooks/useLeaderboard.ts`
- [ ] Subscribe to leaderboard updates (Convex subscriptions)
- [ ] Real-time ranking changes during live events
- [ ] Pagination support

#### 5.1.4. User Profile Hook
- [ ] Create `src/presentation/hooks/useUserProfile.ts`
- [ ] Fetch user data (XP, level, stats)
- [ ] Update user profile

#### 5.1.5. Score Calculation Hook
- [ ] Create `src/presentation/hooks/useScoreCalculation.ts`
- [ ] Fetch score breakdown for roster
- [ ] Display fighter-by-fighter scores

### 5.2. Shared UI Components
- [ ] Create `src/presentation/components/shared/Button.tsx`
- [ ] Create `src/presentation/components/shared/Card.tsx`
- [ ] Create `src/presentation/components/shared/Modal.tsx`
- [ ] Create `src/presentation/components/shared/LoadingSpinner.tsx`
- [ ] Create `src/presentation/components/shared/ErrorBoundary.tsx`

### 5.3. Event Components
- [ ] Create `src/presentation/components/events/EventList.tsx`
  - [ ] Display list of upcoming events
  - [ ] Filter by status (upcoming, live, completed)
  - [ ] "Build Roster" CTA button
- [ ] Create `src/presentation/components/events/EventCard.tsx`
  - [ ] Event name, date, location
  - [ ] Main event fighters
  - [ ] Status badge
- [ ] Create `src/presentation/components/events/FightCard.tsx`
  - [ ] Display individual fight
  - [ ] Fighter names, classes, salaries
  - [ ] "Add to Roster" button

### 5.4. Roster Builder Components
- [ ] Create `src/presentation/components/roster/RosterBuilder.tsx`
  - [ ] Main roster building interface
  - [ ] Left panel: Available fights
  - [ ] Right panel: Current roster (6 slots)
  - [ ] Bottom: Submit button
- [ ] Create `src/presentation/components/roster/FighterCard.tsx`
  - [ ] Fighter name, class, salary
  - [ ] Add/remove button
  - [ ] Captain toggle
- [ ] Create `src/presentation/components/roster/SalaryCounter.tsx`
  - [ ] Display: "$7,200 / $10,000"
  - [ ] Color-coded: green (under cap), red (over cap)
  - [ ] Progress bar
- [ ] Create `src/presentation/components/roster/PowerUpSelector.tsx`
  - [ ] Dropdown to select power-up type
  - [ ] Apply to specific fighter
  - [ ] Display power-up effects tooltip
- [ ] Create `src/presentation/components/roster/SynergyIndicator.tsx`
  - [ ] Display active synergies
  - [ ] Badges: "3 Strikers - +15% KO Bonus"
  - [ ] Highlight fighters contributing to synergy
- [ ] Create `src/presentation/components/roster/CaptainToggle.tsx`
  - [ ] Star icon to designate captain
  - [ ] Only one allowed

### 5.5. Leaderboard Components
- [ ] Create `src/presentation/components/leaderboard/LeaderboardTable.tsx`
  - [ ] Table with columns: Rank, Username, Score, Captain, Power-Ups
  - [ ] Highlight current user's entry
  - [ ] Pagination (top 100)
- [ ] Create `src/presentation/components/leaderboard/LeaderboardEntry.tsx`
  - [ ] Single row in leaderboard
  - [ ] Click to view roster details
- [ ] Create `src/presentation/components/leaderboard/RankBadge.tsx`
  - [ ] Special styling for top 3 (gold, silver, bronze)

### 5.6. Scoring Components
- [ ] Create `src/presentation/components/scoring/ScoreBreakdown.tsx`
  - [ ] Display total roster score
  - [ ] List of all 6 fighters with individual scores
  - [ ] Expandable details per fighter
- [ ] Create `src/presentation/components/scoring/FighterScoreCard.tsx`
  - [ ] Fighter name, final score
  - [ ] Breakdown: Victory, Method, Volume, Round, Bonus, Synergy, Captain, Power-Up
  - [ ] Visual indicators (icons, colors)
- [ ] Create `src/presentation/components/scoring/SynergyBadge.tsx`
  - [ ] Badge showing synergy bonus applied

### 5.7. User Profile Components
- [ ] Create `src/presentation/components/user/UserProfile.tsx`
  - [ ] Display username, avatar
  - [ ] Total XP, current level
  - [ ] Stats: Events participated, best finish, avg score
  - [ ] Event history (list of past rosters)
- [ ] Create `src/presentation/components/user/XPBar.tsx`
  - [ ] Progress bar showing XP progress to next level
  - [ ] Label: "Level 5 - 450 / 600 XP"
- [ ] Create `src/presentation/components/user/LevelBadge.tsx`
  - [ ] Badge displaying user level

### 5.8. Next.js Pages (App Router)
- [ ] Create `src/app/page.tsx` (Home)
  - [ ] Display upcoming events
  - [ ] Hero section with CTA
  - [ ] Recent leaderboard winners
- [ ] Create `src/app/events/[id]/page.tsx` (Event Detail + Roster Builder)
  - [ ] Event details (name, date, location)
  - [ ] Roster builder interface
  - [ ] Submit roster form
- [ ] Create `src/app/leaderboard/[eventId]/page.tsx` (Event Leaderboard)
  - [ ] Leaderboard table
  - [ ] Filter options (Friends, Overall)
- [ ] Create `src/app/profile/page.tsx` (User Profile)
  - [ ] User stats and XP
  - [ ] Event history
- [ ] Create `src/app/sign-in/[[...sign-in]]/page.tsx` (Clerk sign-in)
- [ ] Create `src/app/sign-up/[[...sign-up]]/page.tsx` (Clerk sign-up)

---

## Phase 6: Data Ingestion (Web Scraping)

### 6.1. Manual Scraper Testing
- [ ] Test Sherdog event scraper with real UFC events
- [ ] Test fighter scraper with real fighter profiles
- [ ] Test results scraper with completed events
- [ ] Verify data accuracy

### 6.2. Automated Scraping
- [ ] Set up Convex scheduled function for daily scraping
- [ ] Configure cron: Every day at 6 AM UTC
- [ ] Implement error handling and retries
- [ ] Add logging for scraper runs

### 6.3. Admin Dashboard (Fallback)
- [ ] Create admin page: `src/app/admin/page.tsx`
- [ ] Restrict access to admin users (Clerk roles)
- [ ] Manual data entry forms:
  - [ ] Create event
  - [ ] Add fighters to event
  - [ ] Enter fight results
  - [ ] Trigger score calculation
- [ ] Display scraper logs and status

### 6.4. Initial Data Seeding
- [ ] Manually seed database with:
  - [ ] Top 50 UFC fighters (current rankings)
  - [ ] Next 2-3 upcoming UFC events
  - [ ] Fighter salaries (calculated)
- [ ] Test roster building with real data

---

## Phase 7: Scoring & Leaderboard (Post-Event)

### 7.1. Score Calculation Flow
- [ ] Create Convex mutation: `calculateAllScores(eventId)`
- [ ] Trigger manually or via scheduled function (2 hours post-event)
- [ ] For each roster in event:
  - [ ] Call `CalculateRosterScoreUseCase`
  - [ ] Save final score and breakdown
  - [ ] Award XP to user
- [ ] Update leaderboard rankings
- [ ] Send notifications to users (optional)

### 7.2. Real-Time Leaderboard
- [ ] Set up Convex subscription in `useLeaderboard` hook
- [ ] Subscribe to leaderboard updates during live events
- [ ] Display ranking changes in real-time
- [ ] Animate rank changes

### 7.3. Score Breakdown UI
- [ ] Display score breakdown for user's roster after event
- [ ] Show fighter-by-fighter scores
- [ ] Highlight synergies, power-ups, captain bonus
- [ ] Allow users to compare rosters with others

### 7.4. XP & Level System
- [ ] Award XP after each event based on captain performance
- [ ] Update user level automatically
- [ ] Display XP progress bar in UI
- [ ] (No unlocks in MVP - all power-ups available from start)

---

## Phase 8: Testing & Quality Assurance

### 8.1. Unit Tests
- [ ] Domain layer (business logic):
  - [ ] `ScoringEngine.test.ts` - All scoring scenarios from SCORING_RULES.md
  - [ ] `SynergyCalculator.test.ts` - All synergy combinations
  - [ ] `PowerUpApplicator.test.ts` - All 4 power-ups
  - [ ] `RosterValidator.test.ts` - All validation rules
  - [ ] `XPCalculator.test.ts` - XP calculation
- [ ] Application layer (use cases):
  - [ ] `SubmitRosterUseCase.test.ts`
  - [ ] `CalculateRosterScoreUseCase.test.ts`
- [ ] Infrastructure layer:
  - [ ] Repository tests (with mock Convex client)

### 8.2. Integration Tests
- [ ] Full roster submission flow (UI → Use Case → Repository → Convex)
- [ ] Score calculation flow (trigger → calculate → update leaderboard)
- [ ] Clerk webhook → User creation in Convex

### 8.3. End-to-End Tests
- [ ] User signs up → Clerk account created → User in Convex
- [ ] User builds roster → Validates → Submits → Saved to Convex
- [ ] Event completes → Results scraped → Scores calculated → Leaderboard updated
- [ ] Use Playwright or Cypress for E2E tests

### 8.4. Manual Testing Checklist
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Test all validation errors (over budget, no captain, etc.)
- [ ] Test power-up interactions
- [ ] Test synergy indicators
- [ ] Test leaderboard real-time updates
- [ ] Test score breakdown display

---

## Phase 9: Performance & Optimization

### 9.1. Frontend Optimization
- [ ] Implement Next.js Image component for fighter photos
- [ ] Code splitting (dynamic imports for heavy components)
- [ ] Lazy load leaderboard entries (pagination)
- [ ] Optimize Convex query subscriptions (only subscribe when needed)
- [ ] Add loading skeletons for better UX

### 9.2. Backend Optimization
- [ ] Index optimization in Convex schema
- [ ] Batch score calculations (process rosters in parallel)
- [ ] Cache fighter data (reduce repeated queries)
- [ ] Optimize leaderboard queries (pagination, indexes)

### 9.3. Monitoring & Analytics
- [ ] Set up Vercel Analytics
- [ ] Track key events:
  - [ ] User sign-ups
  - [ ] Roster submissions
  - [ ] Leaderboard views
  - [ ] Score calculations
- [ ] Error tracking (Sentry or similar)

---

## Phase 10: Deployment & Launch

### 10.1. Production Environment Setup
- [ ] Deploy to Vercel (Next.js)
- [ ] Deploy Convex to production
- [ ] Set up production environment variables:
  - [ ] Clerk production keys
  - [ ] Convex production URL
- [ ] Configure custom domain (if applicable)

### 10.2. Pre-Launch Checklist
- [ ] All critical features working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SEO metadata (title, description, Open Graph)
- [ ] Privacy policy and terms of service pages
- [ ] Error handling and user feedback (toasts)

### 10.3. Beta Testing
- [ ] Invite 10-20 beta testers
- [ ] Collect feedback on:
  - [ ] User experience
  - [ ] Bugs and errors
  - [ ] Performance issues
  - [ ] Feature requests
- [ ] Iterate based on feedback

### 10.4. Launch
- [ ] Announce on social media (Twitter, Reddit r/MMA)
- [ ] Create launch blog post explaining the game
- [ ] Monitor server load and errors
- [ ] Provide support for early users

---

## Phase 11: Post-MVP Enhancements (Future)

### 11.1. Power-Up Unlocks
- [ ] Implement unlock system based on user level
- [ ] Gate power-ups behind level requirements
- [ ] Update UI to show locked/unlocked state

### 11.2. Friends & Private Leagues
- [ ] Allow users to create private leagues
- [ ] Invite friends to compete
- [ ] Separate leaderboards per league

### 11.3. Notifications
- [ ] Email notifications for roster reminders
- [ ] Push notifications for event results
- [ ] In-app notifications for rank changes

### 11.4. Advanced Analytics
- [ ] Fighter stats trends (historical performance)
- [ ] User performance analytics (best classes, avg scores)
- [ ] Leaderboard history (seasonal rankings)

### 11.5. Mobile App
- [ ] React Native or Flutter mobile app
- [ ] Push notifications
- [ ] Offline roster building

---

## Summary: MVP Scope

### What's Included in MVP:
✅ User authentication (Clerk)
✅ Event discovery (upcoming UFC events)
✅ Roster building (6 fighters, $10k cap, 1 captain)
✅ All 4 fighter classes + synergies
✅ All 4 power-up cards
✅ Complete scoring engine
✅ Global leaderboard per event
✅ User XP tracking (no unlocks)
✅ Web scraping for data
✅ Responsive UI

### What's Deferred to Post-MVP:
❌ Power-up unlocks
❌ Private leagues
❌ Notifications
❌ Advanced analytics
❌ Mobile app

---

## Estimated Timeline
- **Phase 1-2:** 2 weeks (Setup + Domain Layer)
- **Phase 3:** 2 weeks (Infrastructure)
- **Phase 4:** 1 week (Application Layer)
- **Phase 5:** 3 weeks (Presentation Layer)
- **Phase 6:** 1 week (Web Scrapers)
- **Phase 7:** 1 week (Scoring + Leaderboard)
- **Phase 8-9:** 1 week (Testing + Optimization)
- **Phase 10:** 1 week (Deployment)

**Total: ~12 weeks** to MVP launch.

---

This checklist provides a clear, actionable roadmap for building OctoDraft MVP following clean architecture principles.
