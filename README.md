# Clinched - MMA Fantasy Platform

Professional MMA Fantasy Engine with RPG-style mechanics, squad synergies, and strategic power-ups.

## 🏗️ Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/          # 🟢 Pure business logic (NO external dependencies)
├── application/     # 🔵 Use cases & orchestration
├── infrastructure/  # 🟡 External services (Convex, Scrapers, Auth)
└── presentation/    # 🟣 React components & UI
```

### Layer Rules

- **Domain**: Pure TypeScript, all business rules and scoring logic
- **Application**: Orchestrates domain + infrastructure via use cases
- **Infrastructure**: Implements domain interfaces (repositories, APIs)
- **Presentation**: React components that consume DTOs from application layer

📖 See [Clean Architecture Plan](./docs/CLEAN_ARCHITECTURE_PLAN.md) for detailed documentation.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Convex account](https://convex.dev)
- [Clerk account](https://clerk.com)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or select existing)
   - Generate `.env.local` with Convex credentials
   - Start the Convex dev server

3. **Set up Clerk**
   - Go to [clerk.com](https://clerk.com) and create an application
   - Copy your publishable and secret keys
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🧪 Testing (TDD)

We use **Vitest** for unit testing with a TDD approach.

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── domain/services/     # Business logic tests (ScoringEngine, etc.)
├── application/         # Use case tests
└── infrastructure/      # Repository tests
```

## 📁 Project Structure

```
fight-deck/
├── src/
│   ├── domain/                    # Business logic
│   │   ├── entities/              # Domain models
│   │   ├── value-objects/         # Immutable values
│   │   ├── services/              # Business services
│   │   ├── repositories/          # Repository interfaces
│   │   └── errors/                # Domain errors
│   │
│   ├── application/               # Use cases
│   │   ├── use-cases/             # Application workflows
│   │   ├── dto/                   # Data transfer objects
│   │   └── mappers/               # Domain ↔ DTO
│   │
│   ├── infrastructure/            # External integrations
│   │   ├── convex/                # Convex repositories
│   │   ├── scrapers/              # Web scrapers
│   │   └── auth/                  # Clerk auth
│   │
│   ├── presentation/              # UI layer
│   │   ├── components/            # React components
│   │   ├── hooks/                 # Custom hooks
│   │   └── pages/                 # Page components
│   │
│   └── shared/                    # Shared utilities
│       ├── types/
│       ├── utils/
│       └── constants/
│
├── convex/                        # Convex backend
│   ├── schema.ts                  # Database schema
│   ├── functions/                 # Queries & mutations
│   ├── crons/                     # Scheduled jobs
│   └── webhooks/                  # External webhooks
│
├── tests/                         # Test files
└── docs/                          # Documentation
```

## 📚 Documentation

- [Project Specifications](./docs/SPECS.md) - Game rules and mechanics
- [Scoring Rules](./docs/SCORING_RULES.md) - Complete scoring engine documentation
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Tech stack and features
- [Clean Architecture Plan](./docs/CLEAN_ARCHITECTURE_PLAN.md) - Architecture details
- [MVP Checklist](./docs/MVP_IMPLEMENTATION_CHECKLIST.md) - Step-by-step implementation guide

## 🎯 Core Features (MVP)

- ✅ User authentication (Clerk with social logins)
- ✅ Event discovery (upcoming UFC events)
- ✅ Roster building (6 fighters, $10k cap, 1 captain)
- ✅ Fighter classes + synergies (Striker, Grappler, All-Rounder, Veteran)
- ✅ Power-up cards (Hype Train, Resilience, Blitz, Red Mist)
- ✅ Complete scoring engine
- ✅ Global leaderboard per event
- ✅ User XP tracking
- ✅ Web scraping for UFC data (Sherdog/Tapology)

## 🔧 Available Scripts

```bash
npm run dev           # Start Next.js dev server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm test              # Run Vitest tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run convex:dev    # Start Convex dev server (separate terminal)
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Backend**: Convex (real-time database + backend functions)
- **Auth**: Clerk (social logins + user management)
- **Styling**: Tailwind CSS, shadcn/ui
- **Testing**: Vitest, Testing Library
- **Validation**: Zod
- **Web Scraping**: Puppeteer / Cheerio

## 🌐 Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

## 🤝 Contributing

This project follows TDD (Test-Driven Development):

1. Write a failing test first
2. Implement the minimum code to pass the test
3. Refactor while keeping tests green

## 📝 License

Private project - All rights reserved

## 🎮 Game Overview

Clinched is a gamified MMA Fantasy platform where users:
1. Build a roster of 6 fighters for each UFC event
2. Designate a captain (1.5x multiplier)
3. Apply power-up cards for strategic advantages
4. Compete on global leaderboards
5. Earn XP and level up their profile

### Scoring System

Points are awarded based on:
- **Victory** (100 pts) + **Method multiplier** (KO=2.0x, Sub=1.8x, Decision=1.2x)
- **Volume** (Knockdowns, Takedowns, Strikes)
- **Round bonuses** (R1=+100, R2=+60, R3=+30)
- **UFC bonuses** (FOTN/POTN = +100)
- **Synergies** (3+ same class = +15% bonus)
- **Captain** (1.5x multiplier)
- **Power-ups** (various effects)

See [Scoring Rules](./docs/SCORING_RULES.md) for complete details.

---

Built with ❤️ for MMA fans
