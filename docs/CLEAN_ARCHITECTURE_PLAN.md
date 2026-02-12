# Clinched: Clean Architecture Implementation Plan

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Layer Definitions](#layer-definitions)
4. [Core Abstractions](#core-abstractions)
5. [Module Breakdown](#module-breakdown)
6. [Implementation Order](#implementation-order)
7. [Code Examples](#code-examples)

---

## 1. Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│         (React Components, UI, User Interactions)        │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                      │
│        (Use Cases, Orchestration, State Management)      │
├─────────────────────────────────────────────────────────┤
│                     Domain Layer                         │
│      (Business Logic, Entities, Scoring Engine)          │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                    │
│     (Convex Client, External APIs, Web Scrapers)         │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule
**Outer layers depend on inner layers, NEVER the reverse.**

- ✅ Presentation → Application → Domain
- ✅ Infrastructure → Domain (implements domain interfaces)
- ❌ Domain → Infrastructure (NO!)
- ❌ Domain → Presentation (NO!)

### Key Principles

1. **Domain Layer is Pure**: No framework dependencies (no Convex, no React, no Next.js)
2. **Business Logic Centralized**: All scoring, validation, and game rules live in Domain
3. **Infrastructure is Pluggable**: Could swap Convex for Firebase without touching Domain
4. **Presentation is Dumb**: Components only render and delegate to Application layer
5. **Use Cases Orchestrate**: Application layer coordinates Domain + Infrastructure

---

## 2. Folder Structure

```
fight-deck/
├── src/
│   ├── domain/                          # 🟢 Core Business Logic (Pure TypeScript)
│   │   ├── entities/                    # Domain models
│   │   │   ├── Fighter.ts
│   │   │   ├── Event.ts
│   │   │   ├── Fight.ts
│   │   │   ├── Roster.ts
│   │   │   ├── User.ts
│   │   │   └── Leaderboard.ts
│   │   │
│   │   ├── value-objects/               # Immutable domain values
│   │   │   ├── FighterClass.ts
│   │   │   ├── PowerUp.ts
│   │   │   ├── FightStats.ts
│   │   │   ├── Score.ts
│   │   │   └── Money.ts
│   │   │
│   │   ├── services/                    # Domain services (business logic)
│   │   │   ├── ScoringEngine.ts         # ⭐ Core scoring algorithm
│   │   │   ├── SynergyCalculator.ts     # Synergy buff logic
│   │   │   ├── PowerUpApplicator.ts     # Power-up effects
│   │   │   ├── RosterValidator.ts       # Roster constraints
│   │   │   ├── SalaryCalculator.ts      # Dynamic pricing
│   │   │   └── XPCalculator.ts          # User progression
│   │   │
│   │   ├── repositories/                # Domain interfaces (contracts)
│   │   │   ├── IFighterRepository.ts
│   │   │   ├── IEventRepository.ts
│   │   │   ├── IRosterRepository.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── ILeaderboardRepository.ts
│   │   │
│   │   └── errors/                      # Domain-specific errors
│   │       ├── RosterValidationError.ts
│   │       ├── SalaryCapExceededError.ts
│   │       └── EventLockedError.ts
│   │
│   ├── application/                     # 🔵 Use Cases & Orchestration
│   │   ├── use-cases/
│   │   │   ├── roster/
│   │   │   │   ├── BuildRosterUseCase.ts
│   │   │   │   ├── UpdateRosterUseCase.ts
│   │   │   │   ├── SubmitRosterUseCase.ts
│   │   │   │   └── GetUserRosterUseCase.ts
│   │   │   │
│   │   │   ├── scoring/
│   │   │   │   ├── CalculateRosterScoreUseCase.ts
│   │   │   │   ├── CalculateAllScoresUseCase.ts
│   │   │   │   └── AwardXPUseCase.ts
│   │   │   │
│   │   │   ├── leaderboard/
│   │   │   │   ├── GetLeaderboardUseCase.ts
│   │   │   │   └── UpdateRankingsUseCase.ts
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── GetUpcomingEventsUseCase.ts
│   │   │   │   ├── GetEventDetailsUseCase.ts
│   │   │   │   └── LockEventRostersUseCase.ts
│   │   │   │
│   │   │   └── user/
│   │   │       ├── GetUserProfileUseCase.ts
│   │   │       └── UpdateUserXPUseCase.ts
│   │   │
│   │   ├── dto/                         # Data Transfer Objects
│   │   │   ├── RosterDTO.ts
│   │   │   ├── FighterDTO.ts
│   │   │   ├── LeaderboardEntryDTO.ts
│   │   │   └── ScoreBreakdownDTO.ts
│   │   │
│   │   └── mappers/                     # Domain ↔ DTO conversions
│   │       ├── RosterMapper.ts
│   │       ├── FighterMapper.ts
│   │       └── ScoreMapper.ts
│   │
│   ├── infrastructure/                  # 🟡 External Services & Data Access
│   │   ├── convex/
│   │   │   ├── client/                  # Convex client setup
│   │   │   │   └── ConvexClientProvider.tsx
│   │   │   │
│   │   │   ├── repositories/            # Implements domain repository interfaces
│   │   │   │   ├── ConvexFighterRepository.ts
│   │   │   │   ├── ConvexEventRepository.ts
│   │   │   │   ├── ConvexRosterRepository.ts
│   │   │   │   ├── ConvexUserRepository.ts
│   │   │   │   └── ConvexLeaderboardRepository.ts
│   │   │   │
│   │   │   └── mappers/                 # Convex schema ↔ Domain entities
│   │   │       ├── FighterConvexMapper.ts
│   │   │       ├── EventConvexMapper.ts
│   │   │       └── RosterConvexMapper.ts
│   │   │
│   │   ├── scrapers/                    # Web scraping infrastructure
│   │   │   ├── interfaces/
│   │   │   │   └── IFightDataScraper.ts
│   │   │   ├── sherdog/
│   │   │   │   ├── SherdogEventScraper.ts
│   │   │   │   ├── SherdogFighterScraper.ts
│   │   │   │   └── SherdogResultsScraper.ts
│   │   │   └── tapology/
│   │   │       └── TapologyEventScraper.ts
│   │   │
│   │   └── auth/                        # Clerk authentication
│   │       └── ClerkAuthProvider.tsx
│   │
│   ├── presentation/                    # 🟣 UI Layer (React Components)
│   │   ├── components/
│   │   │   ├── roster/
│   │   │   │   ├── RosterBuilder.tsx
│   │   │   │   ├── FighterCard.tsx
│   │   │   │   ├── SalaryCounter.tsx
│   │   │   │   ├── PowerUpSelector.tsx
│   │   │   │   ├── SynergyIndicator.tsx
│   │   │   │   └── CaptainToggle.tsx
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── EventList.tsx
│   │   │   │   ├── EventCard.tsx
│   │   │   │   └── FightCard.tsx
│   │   │   │
│   │   │   ├── leaderboard/
│   │   │   │   ├── LeaderboardTable.tsx
│   │   │   │   ├── LeaderboardEntry.tsx
│   │   │   │   └── RankBadge.tsx
│   │   │   │
│   │   │   ├── scoring/
│   │   │   │   ├── ScoreBreakdown.tsx
│   │   │   │   ├── FighterScoreCard.tsx
│   │   │   │   └── SynergyBadge.tsx
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   ├── XPBar.tsx
│   │   │   │   └── LevelBadge.tsx
│   │   │   │
│   │   │   └── shared/                  # Reusable UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   │
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useRosterBuilder.ts      # Roster state management
│   │   │   ├── useEventData.ts          # Event data fetching
│   │   │   ├── useLeaderboard.ts        # Leaderboard subscriptions
│   │   │   ├── useUserProfile.ts        # User data
│   │   │   └── useScoreCalculation.ts   # Score display logic
│   │   │
│   │   └── pages/                       # Next.js pages (thin wrappers)
│   │       ├── HomePage.tsx
│   │       ├── RosterBuilderPage.tsx
│   │       ├── LeaderboardPage.tsx
│   │       └── ProfilePage.tsx
│   │
│   ├── shared/                          # 🔶 Shared Utilities
│   │   ├── types/                       # Common TypeScript types
│   │   │   └── common.ts
│   │   │
│   │   ├── utils/                       # Pure utility functions
│   │   │   ├── date.ts
│   │   │   ├── formatting.ts
│   │   │   └── validation.ts
│   │   │
│   │   └── constants/                   # App-wide constants
│   │       ├── game-config.ts           # Salary cap, roster size, etc.
│   │       └── scoring-constants.ts     # Multipliers, bonuses
│   │
│   └── app/                             # Next.js App Router (entry points)
│       ├── layout.tsx
│       ├── page.tsx                     # Home
│       ├── events/
│       │   └── [id]/
│       │       └── page.tsx             # Event detail + roster builder
│       ├── leaderboard/
│       │   └── [eventId]/
│       │       └── page.tsx             # Event leaderboard
│       └── profile/
│           └── page.tsx                 # User profile
│
├── convex/                              # Convex backend functions
│   ├── schema.ts                        # Database schema
│   ├── functions/
│   │   ├── fighters.ts                  # Fighter queries/mutations
│   │   ├── events.ts                    # Event queries/mutations
│   │   ├── rosters.ts                   # Roster queries/mutations
│   │   ├── scoring.ts                   # Score calculation triggers
│   │   ├── leaderboard.ts               # Leaderboard queries
│   │   └── users.ts                     # User queries/mutations
│   │
│   ├── crons/                           # Scheduled functions
│   │   ├── scrapeEvents.ts              # Daily event scraping
│   │   └── updateRankings.ts            # Post-event ranking updates
│   │
│   └── webhooks/
│       └── clerk.ts                     # Clerk user sync
│
├── public/                              # Static assets
│   ├── images/
│   └── icons/
│
├── tests/                               # Tests (mirror src structure)
│   ├── domain/
│   │   └── services/
│   │       └── ScoringEngine.test.ts
│   ├── application/
│   └── infrastructure/
│
└── docs/                                # Documentation
    ├── SPECS.md
    ├── IMPLEMENTATION_PLAN.md
    ├── SCORING_RULES.md
    └── CLEAN_ARCHITECTURE_PLAN.md (this file)
```

---

## 3. Layer Definitions

### 3.1. Domain Layer (Pure Business Logic)

**Responsibilities:**
- Define core business entities (Fighter, Event, Roster, etc.)
- Implement all scoring logic
- Validate roster constraints
- Calculate synergies and power-up effects
- NO external dependencies (no Convex, no React, no npm packages except Zod for validation)

**Rules:**
- ✅ Pure TypeScript functions and classes
- ✅ All business rules encapsulated here
- ❌ NO database queries
- ❌ NO UI logic
- ❌ NO framework imports

**Example:**
```typescript
// src/domain/services/ScoringEngine.ts
export class ScoringEngine {
  // Pure function - no side effects
  calculateFighterScore(
    fighter: Fighter,
    fight: Fight,
    roster: Roster
  ): Score {
    // Business logic here
  }
}
```

---

### 3.2. Application Layer (Use Cases)

**Responsibilities:**
- Orchestrate domain services and infrastructure
- Handle application-specific workflows
- Coordinate data flow between layers
- Transform domain entities to DTOs for presentation
- Manage transactions and error handling

**Rules:**
- ✅ Depends on Domain interfaces
- ✅ Uses Infrastructure implementations (via dependency injection)
- ✅ Returns DTOs (not domain entities)
- ❌ NO direct UI logic
- ❌ NO direct database calls (delegates to repositories)

**Example:**
```typescript
// src/application/use-cases/roster/SubmitRosterUseCase.ts
export class SubmitRosterUseCase {
  constructor(
    private rosterRepo: IRosterRepository,
    private rosterValidator: RosterValidator
  ) {}

  async execute(rosterData: RosterDTO): Promise<Result<RosterDTO>> {
    // 1. Validate roster
    const validation = this.rosterValidator.validate(rosterData);
    if (!validation.isValid) {
      return Result.fail(validation.errors);
    }

    // 2. Save to repository
    const roster = await this.rosterRepo.save(rosterData);

    // 3. Return DTO
    return Result.ok(RosterMapper.toDTO(roster));
  }
}
```

---

### 3.3. Infrastructure Layer (External Services)

**Responsibilities:**
- Implement domain repository interfaces
- Handle Convex queries and mutations
- Web scraping logic
- Authentication (Clerk)
- External API calls

**Rules:**
- ✅ Implements domain interfaces (IFighterRepository, etc.)
- ✅ All Convex-specific code lives here
- ✅ Maps between Convex schema and Domain entities
- ❌ NO business logic (delegates to Domain)

**Example:**
```typescript
// src/infrastructure/convex/repositories/ConvexRosterRepository.ts
export class ConvexRosterRepository implements IRosterRepository {
  constructor(private convexClient: ConvexClient) {}

  async save(roster: Roster): Promise<Roster> {
    // Map domain entity to Convex schema
    const convexData = RosterConvexMapper.toConvex(roster);

    // Call Convex mutation
    const result = await this.convexClient.mutation(
      api.rosters.create,
      convexData
    );

    // Map back to domain entity
    return RosterConvexMapper.toDomain(result);
  }
}
```

---

### 3.4. Presentation Layer (UI)

**Responsibilities:**
- Render React components
- Handle user interactions
- Display data from Application layer
- Client-side validation (UX)
- State management (local component state)

**Rules:**
- ✅ Consumes DTOs from Application layer
- ✅ Calls use cases via hooks
- ✅ Only UI logic (rendering, events, animations)
- ❌ NO business logic
- ❌ NO direct Convex calls (goes through use cases)

**Example:**
```typescript
// src/presentation/components/roster/RosterBuilder.tsx
export function RosterBuilder({ eventId }: Props) {
  const { roster, addFighter, removeFighter, submit } = useRosterBuilder(eventId);

  const handleAddFighter = (fighter: FighterDTO) => {
    // Delegates to use case via hook
    addFighter(fighter);
  };

  return (
    <div>
      {/* Pure UI rendering */}
      <SalaryCounter current={roster.totalSalary} max={10000} />
      {/* ... */}
    </div>
  );
}
```

---

## 4. Core Abstractions

### 4.1. Domain Entities (Core Models)

#### Fighter
```typescript
// src/domain/entities/Fighter.ts
export class Fighter {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly fighterClass: FighterClass,
    public readonly age: number,
    public readonly weightClass: string,
    public readonly record: FightRecord,
    public readonly isActive: boolean
  ) {}

  isVeteran(): boolean {
    return this.age >= 35;
  }

  hasWinStreak(minWins: number): boolean {
    return this.record.recentWins >= minWins;
  }
}
```

#### Roster
```typescript
// src/domain/entities/Roster.ts
export class Roster {
  private fighters: RosterFighter[] = [];
  private powerUps: PowerUp[] = [];

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly eventId: string
  ) {}

  addFighter(fighter: RosterFighter): Result<void> {
    if (this.fighters.length >= 6) {
      return Result.fail("Roster is full");
    }
    this.fighters.push(fighter);
    return Result.ok();
  }

  getTotalSalary(): number {
    return this.fighters.reduce((sum, f) => sum + f.salary, 0);
  }

  getCaptain(): RosterFighter | null {
    return this.fighters.find(f => f.isCaptain) ?? null;
  }

  applyPowerUp(powerUp: PowerUp, fighterId: string): Result<void> {
    if (this.powerUps.length >= 2) {
      return Result.fail("Maximum 2 power-ups allowed");
    }
    this.powerUps.push(powerUp);
    return Result.ok();
  }
}
```

---

### 4.2. Value Objects (Immutable Domain Values)

#### FighterClass
```typescript
// src/domain/value-objects/FighterClass.ts
export class FighterClass {
  private constructor(public readonly value: string) {}

  static readonly STRIKER = new FighterClass("Striker");
  static readonly GRAPPLER = new FighterClass("Grappler");
  static readonly ALL_ROUNDER = new FighterClass("All-Rounder");
  static readonly VETERAN = new FighterClass("Veteran");

  static fromString(value: string): FighterClass {
    switch (value) {
      case "Striker": return FighterClass.STRIKER;
      case "Grappler": return FighterClass.GRAPPLER;
      case "All-Rounder": return FighterClass.ALL_ROUNDER;
      case "Veteran": return FighterClass.VETERAN;
      default: throw new Error(`Invalid fighter class: ${value}`);
    }
  }

  equals(other: FighterClass): boolean {
    return this.value === other.value;
  }
}
```

#### Money (Salary Cap)
```typescript
// src/domain/value-objects/Money.ts
export class Money {
  constructor(public readonly amount: number) {
    if (amount < 0) {
      throw new Error("Money cannot be negative");
    }
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  static SALARY_CAP = new Money(10000);
}
```

#### Score
```typescript
// src/domain/value-objects/Score.ts
export class Score {
  constructor(
    public readonly total: number,
    public readonly breakdown: ScoreBreakdown
  ) {}

  static zero(): Score {
    return new Score(0, {
      victory: 0,
      method: 0,
      volume: 0,
      round: 0,
      bonus: 0,
      synergy: 1.0,
      captain: 1.0,
      penalties: 0,
    });
  }
}
```

---

### 4.3. Repository Interfaces (Domain Contracts)

```typescript
// src/domain/repositories/IRosterRepository.ts
export interface IRosterRepository {
  save(roster: Roster): Promise<Roster>;
  findById(id: string): Promise<Roster | null>;
  findByUserAndEvent(userId: string, eventId: string): Promise<Roster | null>;
  update(roster: Roster): Promise<Roster>;
  delete(id: string): Promise<void>;
}

// src/domain/repositories/IFighterRepository.ts
export interface IFighterRepository {
  findById(id: string): Promise<Fighter | null>;
  findByEvent(eventId: string): Promise<Fighter[]>;
  findAll(): Promise<Fighter[]>;
  save(fighter: Fighter): Promise<Fighter>;
}

// src/domain/repositories/IEventRepository.ts
export interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findUpcoming(): Promise<Event[]>;
  findByStatus(status: EventStatus): Promise<Event[]>;
  save(event: Event): Promise<Event>;
}
```

---

### 4.4. Domain Services (Business Logic)

#### ScoringEngine
```typescript
// src/domain/services/ScoringEngine.ts
export class ScoringEngine {
  constructor(
    private synergyCalculator: SynergyCalculator,
    private powerUpApplicator: PowerUpApplicator
  ) {}

  calculateFighterScore(
    fighter: Fighter,
    fight: Fight,
    roster: Roster
  ): Score {
    // Step 1: Victory points
    const victory = this.calculateVictoryPoints(fight, fighter.id);

    // Step 2: Method multiplier
    const method = this.calculateMethodMultiplier(fight, fighter.id);

    // Step 3: Volume points
    const volume = this.calculateVolumePoints(fight, fighter.id);

    // Step 4: Round bonus
    const round = this.calculateRoundBonus(fight);

    // Step 5: UFC bonus
    const bonus = this.calculateBonusPoints(fight, fighter.id);

    // Step 6: Base score
    let baseScore = (victory * method) + volume + round + bonus;

    // Step 7: Synergy multiplier
    const synergy = this.synergyCalculator.calculate(roster, fighter, fight);
    baseScore *= synergy;

    // Step 8: Captain multiplier
    const captain = roster.getCaptain()?.fighterId === fighter.id ? 1.5 : 1.0;
    baseScore *= captain;

    // Step 9: Power-up effects
    const powerUpScore = this.powerUpApplicator.apply(
      baseScore,
      roster,
      fighter,
      fight
    );

    // Step 10: Penalties
    const penalties = this.calculatePenalties(fight, fighter.id);

    return new Score(powerUpScore - penalties, {
      victory,
      method,
      volume,
      round,
      bonus,
      synergy,
      captain,
      penalties,
    });
  }

  private calculateVictoryPoints(fight: Fight, fighterId: string): number {
    if (fight.winnerId === fighterId) return 100;
    if (fight.method === "Draw") return 50;
    return 0;
  }

  private calculateMethodMultiplier(fight: Fight, fighterId: string): number {
    if (fight.winnerId !== fighterId) return 1.0;

    switch (fight.method) {
      case "KO/TKO": return 2.0;
      case "Submission": return 1.8;
      case "Decision":
        if (fight.decisionType === "Unanimous") return 1.2;
        if (fight.decisionType === "Majority") return 1.1;
        return 1.0;
      default: return 1.0;
    }
  }

  private calculateVolumePoints(fight: Fight, fighterId: string): number {
    const stats = fight.stats[fighterId];
    if (!stats) return 0;

    return (
      stats.knockdowns * 20 +
      stats.takedowns * 10 +
      stats.submissionAttempts * 10 +
      stats.significantStrikes * 0.5
    );
  }

  // ... other private methods
}
```

#### RosterValidator
```typescript
// src/domain/services/RosterValidator.ts
export class RosterValidator {
  validate(roster: Roster): ValidationResult {
    const errors: string[] = [];

    // Rule 1: Exactly 6 fighters
    if (roster.fighters.length !== 6) {
      errors.push("Roster must have exactly 6 fighters");
    }

    // Rule 2: Salary cap
    if (roster.getTotalSalary() > Money.SALARY_CAP.amount) {
      errors.push(`Salary exceeds cap of $${Money.SALARY_CAP.amount}`);
    }

    // Rule 3: Exactly 1 captain
    const captains = roster.fighters.filter(f => f.isCaptain);
    if (captains.length !== 1) {
      errors.push("Roster must have exactly 1 captain");
    }

    // Rule 4: Max 2 power-ups
    if (roster.powerUps.length > 2) {
      errors.push("Maximum 2 power-ups allowed");
    }

    // Rule 5: No duplicate fighters
    const fighterIds = roster.fighters.map(f => f.fighterId);
    const uniqueIds = new Set(fighterIds);
    if (uniqueIds.size !== fighterIds.length) {
      errors.push("Cannot select the same fighter twice");
    }

    // Rule 6: No both fighters from same bout
    const fightIds = roster.fighters.map(f => f.fightId);
    const duplicateFights = fightIds.filter(
      (id, index) => fightIds.indexOf(id) !== index
    );
    if (duplicateFights.length > 0) {
      errors.push("Cannot select both fighters from the same bout");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

#### SynergyCalculator
```typescript
// src/domain/services/SynergyCalculator.ts
export class SynergyCalculator {
  calculate(roster: Roster, fighter: Fighter, fight: Fight): number {
    const classCounts = this.countClasses(roster);

    // Striker synergy: 3+ Strikers + fighter won by KO/TKO
    if (
      classCounts.striker >= 3 &&
      fighter.fighterClass.equals(FighterClass.STRIKER) &&
      fight.method === "KO/TKO" &&
      fight.winnerId === fighter.id
    ) {
      return 1.15;
    }

    // Grappler synergy: 3+ Grapplers + fighter won by Submission
    if (
      classCounts.grappler >= 3 &&
      fighter.fighterClass.equals(FighterClass.GRAPPLER) &&
      fight.method === "Submission" &&
      fight.winnerId === fighter.id
    ) {
      return 1.15;
    }

    // All-Rounder synergy handled separately (flat +10)
    // Veteran synergy handled in penalty calculation

    return 1.0;
  }

  private countClasses(roster: Roster): Record<string, number> {
    const counts = {
      striker: 0,
      grappler: 0,
      allRounder: 0,
      veteran: 0,
    };

    roster.fighters.forEach(rf => {
      const fighter = rf.fighter; // Assume fighter is populated
      if (fighter.fighterClass.equals(FighterClass.STRIKER)) counts.striker++;
      if (fighter.fighterClass.equals(FighterClass.GRAPPLER)) counts.grappler++;
      if (fighter.fighterClass.equals(FighterClass.ALL_ROUNDER)) counts.allRounder++;
      if (fighter.isVeteran()) counts.veteran++;
    });

    return counts;
  }
}
```

---

### 4.5. Use Cases (Application Orchestration)

```typescript
// src/application/use-cases/roster/SubmitRosterUseCase.ts
export class SubmitRosterUseCase {
  constructor(
    private rosterRepository: IRosterRepository,
    private eventRepository: IEventRepository,
    private rosterValidator: RosterValidator
  ) {}

  async execute(request: SubmitRosterRequest): Promise<Result<RosterDTO>> {
    // 1. Check if event is still open
    const event = await this.eventRepository.findById(request.eventId);
    if (!event) {
      return Result.fail("Event not found");
    }

    if (event.isLocked()) {
      return Result.fail("Event roster submissions are closed");
    }

    // 2. Build roster from request
    const roster = this.buildRosterFromRequest(request);

    // 3. Validate roster
    const validation = this.rosterValidator.validate(roster);
    if (!validation.isValid) {
      return Result.fail(validation.errors.join(", "));
    }

    // 4. Save roster
    const savedRoster = await this.rosterRepository.save(roster);

    // 5. Return DTO
    return Result.ok(RosterMapper.toDTO(savedRoster));
  }

  private buildRosterFromRequest(request: SubmitRosterRequest): Roster {
    // Map request to domain entity
    // ...
  }
}
```

```typescript
// src/application/use-cases/scoring/CalculateRosterScoreUseCase.ts
export class CalculateRosterScoreUseCase {
  constructor(
    private rosterRepository: IRosterRepository,
    private scoringEngine: ScoringEngine,
    private xpCalculator: XPCalculator
  ) {}

  async execute(rosterId: string): Promise<Result<ScoreBreakdownDTO>> {
    // 1. Fetch roster with all relations
    const roster = await this.rosterRepository.findById(rosterId);
    if (!roster) {
      return Result.fail("Roster not found");
    }

    // 2. Calculate score for each fighter
    const fighterScores = roster.fighters.map(rf => {
      return this.scoringEngine.calculateFighterScore(
        rf.fighter,
        rf.fight,
        roster
      );
    });

    // 3. Sum total score
    const totalScore = fighterScores.reduce((sum, score) => sum + score.total, 0);

    // 4. Calculate XP
    const xp = this.xpCalculator.calculate(roster, fighterScores);

    // 5. Update roster with scores
    roster.finalScore = totalScore;
    roster.xpEarned = xp;
    await this.rosterRepository.update(roster);

    // 6. Return breakdown DTO
    return Result.ok(ScoreMapper.toBreakdownDTO(fighterScores, totalScore, xp));
  }
}
```

---

### 4.6. Data Transfer Objects (DTOs)

```typescript
// src/application/dto/RosterDTO.ts
export interface RosterDTO {
  id: string;
  userId: string;
  eventId: string;
  fighters: RosterFighterDTO[];
  totalSalary: number;
  powerUps: PowerUpDTO[];
  finalScore?: number;
  rank?: number;
  xpEarned?: number;
}

export interface RosterFighterDTO {
  fighterId: string;
  fighterName: string;
  fighterClass: string;
  fightId: string;
  salary: number;
  isCaptain: boolean;
}

export interface PowerUpDTO {
  type: "Hype Train" | "Resilience" | "Blitz" | "Red Mist";
  appliedToFighterId: string;
}
```

```typescript
// src/application/dto/ScoreBreakdownDTO.ts
export interface ScoreBreakdownDTO {
  totalScore: number;
  xpEarned: number;
  fighters: FighterScoreDTO[];
}

export interface FighterScoreDTO {
  fighterId: string;
  fighterName: string;
  baseScore: number;
  victoryPoints: number;
  methodMultiplier: number;
  volumePoints: number;
  roundBonus: number;
  bonusPoints: number;
  synergyMultiplier: number;
  captainMultiplier: number;
  powerUpEffect?: string;
  penalties: number;
  finalScore: number;
}
```

---

### 4.7. Presentation Hooks (React Integration)

```typescript
// src/presentation/hooks/useRosterBuilder.ts
export function useRosterBuilder(eventId: string) {
  const [roster, setRoster] = useState<RosterDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRosterUseCase = useMemo(
    () => new SubmitRosterUseCase(
      new ConvexRosterRepository(convexClient),
      new ConvexEventRepository(convexClient),
      new RosterValidator()
    ),
    []
  );

  const addFighter = useCallback((fighter: FighterDTO, fightId: string, salary: number) => {
    setRoster(prev => {
      if (!prev) return null;
      // Add fighter logic
      return { ...prev, fighters: [...prev.fighters, { fighterId: fighter.id, ... }] };
    });
  }, []);

  const submitRoster = useCallback(async () => {
    if (!roster) return;

    setIsSubmitting(true);
    const result = await submitRosterUseCase.execute(roster);

    if (result.isSuccess) {
      toast.success("Roster submitted!");
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  }, [roster, submitRosterUseCase]);

  return {
    roster,
    addFighter,
    removeFighter: () => {},
    setCaptain: () => {},
    addPowerUp: () => {},
    submitRoster,
    isSubmitting,
  };
}
```

---

## 5. Module Breakdown

### Module 1: Roster Management
**Domain:**
- `Roster` entity
- `RosterValidator` service
- `IRosterRepository` interface

**Application:**
- `BuildRosterUseCase`
- `SubmitRosterUseCase`
- `UpdateRosterUseCase`
- `RosterDTO`

**Infrastructure:**
- `ConvexRosterRepository`
- `RosterConvexMapper`

**Presentation:**
- `RosterBuilder` component
- `useRosterBuilder` hook

---

### Module 2: Scoring System
**Domain:**
- `Score` value object
- `ScoringEngine` service
- `SynergyCalculator` service
- `PowerUpApplicator` service

**Application:**
- `CalculateRosterScoreUseCase`
- `ScoreBreakdownDTO`

**Infrastructure:**
- (none - pure business logic)

**Presentation:**
- `ScoreBreakdown` component
- `FighterScoreCard` component

---

### Module 3: Events & Fights
**Domain:**
- `Event` entity
- `Fight` entity
- `IEventRepository` interface

**Application:**
- `GetUpcomingEventsUseCase`
- `GetEventDetailsUseCase`
- `EventDTO`

**Infrastructure:**
- `ConvexEventRepository`
- `SherdogEventScraper`
- `TapologyEventScraper`

**Presentation:**
- `EventList` component
- `EventCard` component
- `FightCard` component

---

### Module 4: Leaderboard
**Domain:**
- `Leaderboard` entity
- `ILeaderboardRepository` interface

**Application:**
- `GetLeaderboardUseCase`
- `UpdateRankingsUseCase`
- `LeaderboardEntryDTO`

**Infrastructure:**
- `ConvexLeaderboardRepository`

**Presentation:**
- `LeaderboardTable` component
- `useLeaderboard` hook

---

### Module 5: User Progression
**Domain:**
- `User` entity
- `XPCalculator` service

**Application:**
- `GetUserProfileUseCase`
- `UpdateUserXPUseCase`
- `UserDTO`

**Infrastructure:**
- `ConvexUserRepository`
- `ClerkAuthProvider`

**Presentation:**
- `UserProfile` component
- `XPBar` component
- `useUserProfile` hook

---

## 6. Implementation Order

### Phase 1: Foundation (Domain + Infrastructure Setup)
**Goal:** Establish core architecture without UI

**Tasks:**
1. Set up project structure (folders)
2. Create domain entities (Fighter, Event, Fight, Roster, User)
3. Create value objects (FighterClass, Money, Score)
4. Implement repository interfaces
5. Set up Convex schema
6. Implement Convex repositories
7. Write unit tests for domain entities

**Deliverable:** Domain layer + Infrastructure layer (no UI)

---

### Phase 2: Business Logic (Domain Services)
**Goal:** Implement all scoring and validation logic

**Tasks:**
1. Implement `ScoringEngine`
   - Victory points calculation
   - Method multipliers
   - Volume points
   - Round bonuses
   - UFC bonuses
2. Implement `SynergyCalculator`
3. Implement `PowerUpApplicator`
4. Implement `RosterValidator`
5. Implement `SalaryCalculator`
6. Implement `XPCalculator`
7. Write comprehensive unit tests for all services

**Deliverable:** All business logic tested and working

---

### Phase 3: Application Layer (Use Cases)
**Goal:** Orchestrate domain + infrastructure

**Tasks:**
1. Create DTOs (RosterDTO, FighterDTO, etc.)
2. Create mappers (Domain ↔ DTO)
3. Implement roster use cases:
   - `BuildRosterUseCase`
   - `SubmitRosterUseCase`
   - `UpdateRosterUseCase`
4. Implement scoring use cases:
   - `CalculateRosterScoreUseCase`
   - `CalculateAllScoresUseCase`
5. Implement event use cases:
   - `GetUpcomingEventsUseCase`
   - `GetEventDetailsUseCase`
6. Implement leaderboard use cases:
   - `GetLeaderboardUseCase`
   - `UpdateRankingsUseCase`

**Deliverable:** All use cases ready to be consumed by UI

---

### Phase 4: Presentation Layer (UI Components)
**Goal:** Build user-facing interface

**Tasks:**
1. Set up Next.js App Router pages
2. Set up Clerk authentication
3. Create shared UI components (Button, Card, Modal)
4. Implement event discovery:
   - `EventList` component
   - `EventCard` component
5. Implement roster builder:
   - `RosterBuilder` component
   - `FighterCard` component
   - `SalaryCounter` component
   - `PowerUpSelector` component
   - `SynergyIndicator` component
6. Create `useRosterBuilder` hook
7. Implement leaderboard:
   - `LeaderboardTable` component
   - `useLeaderboard` hook
8. Implement user profile:
   - `UserProfile` component
   - `XPBar` component

**Deliverable:** Functional UI connected to use cases

---

### Phase 5: Data Ingestion (Web Scrapers)
**Goal:** Automate event and fighter data collection

**Tasks:**
1. Research Sherdog/Tapology HTML structure
2. Implement `SherdogEventScraper`
3. Implement `SherdogFighterScraper`
4. Implement `SherdogResultsScraper`
5. Set up Convex scheduled functions (crons)
6. Create admin dashboard for manual data entry (fallback)
7. Test scraping with real events

**Deliverable:** Automated data pipeline

---

### Phase 6: Scoring & Leaderboard (Post-Event Flow)
**Goal:** Calculate scores and update rankings

**Tasks:**
1. Create Convex mutation to trigger scoring for all rosters
2. Implement real-time leaderboard updates (Convex subscriptions)
3. Display score breakdowns in UI
4. Award XP to users
5. Update user levels
6. Test with mock event results

**Deliverable:** End-to-end scoring flow working

---

### Phase 7: Polish & Testing
**Goal:** Production readiness

**Tasks:**
1. E2E tests for critical flows
2. Performance optimization
3. Error handling and user feedback
4. Mobile responsive design
5. Documentation
6. Beta testing with real users

**Deliverable:** MVP ready for launch

---

## 7. Code Examples

### Example: Full Flow (Submitting a Roster)

#### 1. User Clicks "Submit Roster" (Presentation)
```typescript
// src/presentation/components/roster/RosterBuilder.tsx
export function RosterBuilder() {
  const { submitRoster, isSubmitting } = useRosterBuilder(eventId);

  return (
    <button onClick={submitRoster} disabled={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit Roster"}
    </button>
  );
}
```

#### 2. Hook Delegates to Use Case (Application)
```typescript
// src/presentation/hooks/useRosterBuilder.ts
export function useRosterBuilder(eventId: string) {
  const submitRosterUseCase = useMemo(
    () => container.resolve(SubmitRosterUseCase), // Dependency injection
    []
  );

  const submitRoster = async () => {
    const result = await submitRosterUseCase.execute({
      eventId,
      userId: currentUser.id,
      fighters: selectedFighters,
      powerUps: appliedPowerUps,
    });

    if (result.isFailure) {
      toast.error(result.error);
    } else {
      toast.success("Roster submitted!");
    }
  };

  return { submitRoster };
}
```

#### 3. Use Case Orchestrates Domain + Infrastructure (Application)
```typescript
// src/application/use-cases/roster/SubmitRosterUseCase.ts
export class SubmitRosterUseCase {
  constructor(
    private rosterRepo: IRosterRepository,
    private eventRepo: IEventRepository,
    private validator: RosterValidator
  ) {}

  async execute(request: SubmitRosterRequest): Promise<Result<RosterDTO>> {
    // Check event status
    const event = await this.eventRepo.findById(request.eventId);
    if (event.isLocked()) {
      return Result.fail("Event is locked");
    }

    // Build domain entity
    const roster = Roster.create(request);

    // Validate
    const validation = this.validator.validate(roster);
    if (!validation.isValid) {
      return Result.fail(validation.errors);
    }

    // Save
    const saved = await this.rosterRepo.save(roster);

    return Result.ok(RosterMapper.toDTO(saved));
  }
}
```

#### 4. Repository Saves to Convex (Infrastructure)
```typescript
// src/infrastructure/convex/repositories/ConvexRosterRepository.ts
export class ConvexRosterRepository implements IRosterRepository {
  async save(roster: Roster): Promise<Roster> {
    // Map domain entity to Convex schema
    const convexData = {
      userId: roster.userId,
      eventId: roster.eventId,
      fighters: roster.fighters.map(f => ({
        fighterId: f.fighterId,
        salary: f.salary,
        isCaptain: f.isCaptain,
      })),
      totalSalary: roster.getTotalSalary(),
      powerUps: roster.powerUps,
    };

    // Call Convex mutation
    const result = await this.client.mutation(api.rosters.create, convexData);

    // Map back to domain
    return RosterConvexMapper.toDomain(result);
  }
}
```

#### 5. Convex Function Persists Data (Convex Backend)
```typescript
// convex/functions/rosters.ts
export const create = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    fighters: v.array(v.object({ ... })),
    totalSalary: v.number(),
    powerUps: v.array(v.object({ ... })),
  },
  handler: async (ctx, args) => {
    // Insert into database
    const rosterId = await ctx.db.insert("rosters", {
      ...args,
      _creationTime: Date.now(),
    });

    return await ctx.db.get(rosterId);
  },
});
```

---

## 8. Key Benefits of This Architecture

### 8.1. Testability
- Domain logic is pure (easy to unit test)
- Use cases can be tested with mock repositories
- UI components can be tested with mock hooks

### 8.2. Flexibility
- Swap Convex for Firebase: Only change Infrastructure layer
- Swap React for Vue: Only change Presentation layer
- Change scoring rules: Only change Domain services

### 8.3. Maintainability
- Business logic centralized in Domain layer
- Clear separation of concerns
- Easy to find where to make changes

### 8.4. Collaboration
- Frontend devs work in Presentation layer
- Backend devs work in Infrastructure layer
- Product/domain experts work with Domain layer

### 8.5. Scalability
- Add new features by adding new use cases
- Extend domain entities without touching UI
- Add new data sources without touching business logic

---

## 9. Dependency Injection Setup

### Simple DI Container (No Library Needed)
```typescript
// src/shared/di/container.ts
class DIContainer {
  private services = new Map<string, any>();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }
    return factory();
  }
}

export const container = new DIContainer();

// Register services
container.register("RosterValidator", () => new RosterValidator());
container.register("ScoringEngine", () => new ScoringEngine(
  container.resolve("SynergyCalculator"),
  container.resolve("PowerUpApplicator")
));
container.register("SubmitRosterUseCase", () => new SubmitRosterUseCase(
  container.resolve("ConvexRosterRepository"),
  container.resolve("ConvexEventRepository"),
  container.resolve("RosterValidator")
));
```

---

## 10. Next Steps

1. **Review this architecture plan** - Ensure alignment with team
2. **Set up folder structure** - Create all directories
3. **Start with Domain layer** - Build entities and services first
4. **Write tests** - TDD approach for business logic
5. **Implement Infrastructure** - Convex repositories
6. **Build Use Cases** - Application layer
7. **Create UI** - Presentation layer last

This architecture ensures **clean separation, testability, and maintainability** while avoiding over-engineering with unnecessary abstractions.
