/**
 * Scraper Runner
 *
 * Main script to run the Sherdog scraper and store data in Convex.
 *
 * Usage:
 *   npx tsx scripts/scraper/run-scraper.ts
 *
 * Options:
 *   --event <url>    Scrape a specific event URL
 *   --all            Scrape all events from events-config.json
 *   --fighters-only  Only scrape fighters (skip event creation)
 *   --dry-run        Show what would be scraped without storing
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { scrapeEvent, scrapeEventFighters, delay } from "./sherdog-scraper";
import { ScrapedEvent, ScrapedFighter, EventConfig } from "./types";
import * as fs from "fs";
import * as path from "path";

// Load environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const isDryRun = process.argv.includes("--dry-run");

// Only require Convex URL if not in dry-run mode
let client: ConvexHttpClient | null = null;
if (!isDryRun) {
  if (!CONVEX_URL) {
    console.error("Error: NEXT_PUBLIC_CONVEX_URL environment variable not set");
    console.error("Make sure you have a .env.local file with your Convex URL");
    console.error("Or use --dry-run mode to test without storing data");
    process.exit(1);
  }
  client = new ConvexHttpClient(CONVEX_URL);
}

/**
 * Calculate fighter salary based on ranking and weight class
 */
function calculateSalary(
  fighter: ScrapedFighter,
  isChampion: boolean = false
): number {
  // Base salary ranges from game-config
  if (isChampion) return 2400;

  const ranking = fighter.ranking;
  if (ranking && ranking <= 5) return 2150;
  if (ranking && ranking <= 10) return 1850;
  if (ranking && ranking <= 15) return 1550;
  return 1200; // Unranked
}

/**
 * Store event in Convex
 */
async function storeEvent(event: ScrapedEvent): Promise<string> {
  if (!client) throw new Error("Convex client not initialized");
  console.log(`Storing event: ${event.name}`);

  const eventId = await client.mutation(api.functions.scraper.upsertEvent, {
    name: event.name,
    eventDate: event.eventDate.getTime(),
    location: event.location || event.venue || "TBD",
    status: "upcoming",
    isMainCard: true,
    rosterLockTime: event.eventDate.getTime() - 60 * 60 * 1000, // 1 hour before
    sherdogUrl: event.sherdogUrl,
    tapologyUrl: event.tapologyUrl,
  });

  console.log(`  Event stored with ID: ${eventId}`);
  return eventId;
}

/**
 * Store fighter in Convex
 */
async function storeFighter(fighter: ScrapedFighter): Promise<string> {
  if (!client) throw new Error("Convex client not initialized");
  console.log(`Storing fighter: ${fighter.name}`);

  const fighterId = await client.mutation(api.functions.scraper.upsertFighter, {
    name: fighter.name,
    nickname: fighter.nickname,
    weightClass: fighter.weightClass || "Unknown",
    record: fighter.record,
    fighterClass: fighter.fighterClass || "All-Rounder",
    age: fighter.age || 30,
    imageUrl: fighter.imageUrl,
    sherdogUrl: fighter.sherdogUrl,
    sherdogId: fighter.sherdogId,
    tapologyUrl: fighter.tapologyUrl,
    tapologyId: fighter.tapologyId,
    isActive: true,
  });

  console.log(`  Fighter stored with ID: ${fighterId}`);
  return fighterId;
}

/**
 * Store fight in Convex
 */
async function storeFight(
  eventId: string,
  fighter1Id: string,
  fighter2Id: string,
  fight: ScrapedEvent["fights"][0],
  fighter1Salary: number,
  fighter2Salary: number
): Promise<string> {
  if (!client) throw new Error("Convex client not initialized");
  console.log(
    `Storing fight: ${fight.fighter1.name} vs ${fight.fighter2.name}`
  );

  const fightId = await client.mutation(api.functions.scraper.upsertFight, {
    eventId: eventId as any,
    fighter1Id: fighter1Id as any,
    fighter2Id: fighter2Id as any,
    fighter1Salary,
    fighter2Salary,
    weightClass: fight.weightClass,
    isMainEvent: fight.tier === "Main Event",
    isTitleFight: fight.isTitleFight,
    cardPosition: fight.cardPosition,
  });

  console.log(`  Fight stored with ID: ${fightId}`);
  return fightId;
}

/**
 * Get fighter ID from fight reference (supports both Sherdog and Tapology)
 */
function getFighterId(fighterRef: ScrapedEvent["fights"][0]["fighter1"]): string {
  return fighterRef.sherdogId || fighterRef.tapologyId || "";
}

/**
 * Process a single event
 */
async function processEvent(
  eventUrl: string,
  options: { dryRun?: boolean; fightersOnly?: boolean }
): Promise<void> {
  console.log("\n========================================");
  console.log(`Processing event: ${eventUrl}`);
  console.log("========================================\n");

  // Step 1: Scrape event data
  const eventResult = await scrapeEvent(eventUrl);

  if (!eventResult.success || !eventResult.data) {
    console.error(`Failed to scrape event: ${eventResult.error}`);
    return;
  }

  const event = eventResult.data;
  console.log(`\nEvent: ${event.name}`);
  console.log(`Date: ${event.dateString || event.eventDate.toDateString()}`);
  console.log(`Location: ${event.location || event.venue}`);
  console.log(`Fights found: ${event.fights.length}`);

  if (options.dryRun) {
    console.log("\n[DRY RUN] Would store event:");
    console.log(JSON.stringify(event, null, 2));
    return;
  }

  // Step 2: Scrape all fighters
  console.log("\nScraping fighters...");
  const fighters = await scrapeEventFighters(event);
  console.log(`Scraped ${fighters.size} fighters`);

  // Step 3: Store fighters in Convex
  const fighterIdMap = new Map<string, string>(); // sherdogId/tapologyId -> convexId

  for (const [scraperId, fighter] of fighters) {
    try {
      const fighterId = await storeFighter(fighter);
      fighterIdMap.set(scraperId, fighterId);
      await delay(100); // Small delay between writes
    } catch (error) {
      console.error(`Failed to store fighter ${fighter.name}:`, error);
    }
  }

  if (options.fightersOnly) {
    console.log("\nFighters-only mode: skipping event and fight creation");
    return;
  }

  // Step 4: Store event
  let eventId: string;
  try {
    eventId = await storeEvent(event);
  } catch (error) {
    console.error("Failed to store event:", error);
    return;
  }

  // Step 5: Store fights
  console.log("\nStoring fights...");
  for (const fight of event.fights) {
    const fighter1Id = getFighterId(fight.fighter1);
    const fighter2Id = getFighterId(fight.fighter2);

    const fighter1ConvexId = fighterIdMap.get(fighter1Id);
    const fighter2ConvexId = fighterIdMap.get(fighter2Id);

    if (!fighter1ConvexId || !fighter2ConvexId) {
      console.warn(
        `Skipping fight - missing fighter IDs: ${fight.fighter1.name} vs ${fight.fighter2.name}`
      );
      continue;
    }

    // Get fighter data for salary calculation
    const fighter1 = fighters.get(fighter1Id);
    const fighter2 = fighters.get(fighter2Id);

    const fighter1Salary = fighter1 ? calculateSalary(fighter1) : 1200;
    const fighter2Salary = fighter2 ? calculateSalary(fighter2) : 1200;

    try {
      await storeFight(
        eventId,
        fighter1ConvexId,
        fighter2ConvexId,
        fight,
        fighter1Salary,
        fighter2Salary
      );
      await delay(100);
    } catch (error) {
      console.error(
        `Failed to store fight ${fight.fighter1.name} vs ${fight.fighter2.name}:`,
        error
      );
    }
  }

  console.log("\nEvent processing complete!");
}

/**
 * Load events configuration
 */
function loadEventsConfig(): EventConfig[] {
  const configPath = path.join(__dirname, "events-config.json");

  if (!fs.existsSync(configPath)) {
    console.error(`Events config not found: ${configPath}`);
    return [];
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return config.events || [];
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes("--dry-run"),
    fightersOnly: args.includes("--fighters-only"),
    all: args.includes("--all"),
    eventUrl: "",
  };

  // Check for specific event URL
  const eventIndex = args.indexOf("--event");
  if (eventIndex !== -1 && args[eventIndex + 1]) {
    options.eventUrl = args[eventIndex + 1];
  }

  console.log("Sherdog Scraper");
  console.log("===============\n");

  if (options.dryRun) {
    console.log("Running in DRY RUN mode - no data will be stored\n");
  }

  if (options.eventUrl) {
    // Process single event
    await processEvent(options.eventUrl, options);
  } else if (options.all) {
    // Process all events from config
    const events = loadEventsConfig();
    console.log(`Found ${events.length} events in config\n`);

    for (const event of events) {
      await processEvent(event.url, options);
      await delay(2000); // Delay between events
    }
  } else {
    // Show usage
    console.log("Usage:");
    console.log(
      "  npx tsx scripts/scraper/run-scraper.ts --event <url>  # Scrape specific event"
    );
    console.log(
      "  npx tsx scripts/scraper/run-scraper.ts --all          # Scrape all events from config"
    );
    console.log("");
    console.log("Options:");
    console.log("  --dry-run        Show what would be scraped without storing");
    console.log("  --fighters-only  Only scrape and store fighters");
    console.log("");
    console.log("Configure events in: scripts/scraper/events-config.json");
  }
}

// Run
main().catch(console.error);
