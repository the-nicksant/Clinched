# Convex Setup Instructions

## Initial Setup

1. **Sign up for Convex**: Go to [convex.dev](https://convex.dev) and create an account

2. **Initialize Convex project**:
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project
   - Generate `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`
   - Start the Convex dev server

3. **The schema is already defined** in `convex/schema.ts`

## Running Convex

- **Development**: `npx convex dev` (runs alongside Next.js)
- **Deploy to production**: `npx convex deploy`

## Project Structure

```
convex/
├── schema.ts           # Database schema (already configured)
├── functions/          # Queries and mutations
│   ├── fighters.ts
│   ├── events.ts
│   ├── rosters.ts
│   ├── scoring.ts
│   └── users.ts
├── crons/             # Scheduled functions
│   └── scrapeEvents.ts
└── webhooks/          # External webhooks (Clerk)
    └── clerk.ts
```

## Next Steps

After running `npx convex dev`, you can:
1. View your dashboard at the provided URL
2. Add Convex functions in `convex/functions/`
3. Import and use them in your Next.js app
