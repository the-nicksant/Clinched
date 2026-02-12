# Domain Layer

**Pure business logic - NO external dependencies**

## Purpose
Contains all core business rules, entities, and domain logic for OctoDraft.

## Rules
- ✅ Pure TypeScript (no React, Next.js, Convex)
- ✅ All business logic lives here
- ✅ Framework-agnostic
- ❌ NO external dependencies except Zod for validation
- ❌ NO database queries
- ❌ NO UI logic

## Structure

### `/entities`
Domain models (Fighter, Event, Fight, Roster, User)

### `/value-objects`
Immutable domain values (FighterClass, Money, Score, PowerUp)

### `/services`
Business logic services:
- `ScoringEngine.ts` - Core scoring algorithm
- `SynergyCalculator.ts` - Synergy buff logic
- `PowerUpApplicator.ts` - Power-up effects
- `RosterValidator.ts` - Roster constraints
- `SalaryCalculator.ts` - Dynamic pricing
- `XPCalculator.ts` - User progression

### `/repositories`
Interfaces ONLY (contracts for infrastructure layer)

### `/errors`
Domain-specific error classes
