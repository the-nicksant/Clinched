# Infrastructure Layer

**External services and data access**

## Purpose
Implements domain repository interfaces and handles all external integrations.

## Rules
- ✅ Implements domain interfaces (IFighterRepository, etc.)
- ✅ All Convex-specific code lives here
- ✅ Maps between Convex schema and Domain entities
- ❌ NO business logic (delegates to Domain)

## Structure

### `/convex`
- **client/**: Convex client provider
- **repositories/**: Implement domain repository interfaces
- **mappers/**: Convex schema ↔ Domain entity conversions

### `/scrapers`
- **interfaces/**: Scraper contracts
- **sherdog/**: Sherdog scraper implementations
- **tapology/**: Tapology scraper implementations
- **classifiers/**: Fighter classification logic

### `/auth`
- Clerk authentication provider
