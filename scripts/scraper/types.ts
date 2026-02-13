/**
 * Scraper Types
 *
 * Types for scraped data from MMA databases (Sherdog, Tapology).
 */

/**
 * Raw scraped event data
 */
export interface ScrapedEvent {
  /** Sherdog event URL */
  sherdogUrl?: string;

  /** Tapology event URL */
  tapologyUrl?: string;

  /** Event name (e.g., "UFC Fight Night: Strickland vs. Hernandez") */
  name: string;

  /** Event date as string (e.g., "Feb 21, 2026") */
  dateString: string;

  /** Parsed event date */
  eventDate: Date;

  /** City, State/Country */
  location: string;

  /** Venue name */
  venue: string;

  /** Broadcast network */
  broadcast?: string;

  /** List of fights on the card */
  fights: ScrapedFight[];
}

/**
 * Raw scraped fight data from Tapology
 */
export interface ScrapedFight {
  /** Fight position on card (1 = main event) */
  cardPosition: number;

  /** Fight tier (Main Event, Co-Main, Main Card, Prelim) */
  tier: "Main Event" | "Co-Main" | "Main Card" | "Prelim" | "Early Prelim";

  /** Weight class in pounds (e.g., 185, 170, 265) or "HW", "CW" */
  weightClass: string;

  /** Is this a title fight? */
  isTitleFight: boolean;

  /** Fighter 1 (red corner) */
  fighter1: ScrapedFighterReference;

  /** Fighter 2 (blue corner) */
  fighter2: ScrapedFighterReference;

  /** Tapology bout URL */
  boutUrl?: string;
}

/**
 * Reference to a fighter with minimal data from fight card
 */
export interface ScrapedFighterReference {
  /** Fighter name as displayed */
  name: string;

  /** Sherdog profile URL */
  sherdogUrl?: string;

  /** Sherdog fighter ID from URL */
  sherdogId?: string;

  /** Tapology profile URL */
  tapologyUrl?: string;

  /** Tapology fighter ID from URL */
  tapologyId?: string;

  /** Record at time of fight (e.g., "29-7") */
  record?: string;

  /** Ranking number if ranked (e.g., "#4") */
  ranking?: number;

  /** Country code from flag */
  country?: string;
}

/**
 * Full fighter data scraped from individual profile page
 */
export interface ScrapedFighter {
  /** Sherdog profile URL */
  sherdogUrl?: string;

  /** Sherdog fighter ID */
  sherdogId?: string;

  /** Tapology profile URL */
  tapologyUrl?: string;

  /** Tapology fighter ID */
  tapologyId?: string;

  /** Full name */
  name: string;

  /** Nickname (if any) */
  nickname?: string;

  /** Birth date */
  birthDate?: Date;

  /** Age (calculated or scraped) */
  age?: number;

  /** Height in inches */
  heightInches?: number;

  /** Weight in pounds */
  weightLbs?: number;

  /** Reach in inches */
  reachInches?: number;

  /** Win-Loss-Draw record */
  record: {
    wins: number;
    losses: number;
    draws: number;
  };

  /** Fighting stance (Orthodox, Southpaw, Switch) */
  stance?: string;

  /** Country/Nationality */
  country?: string;

  /** Primary weight class */
  weightClass?: string;

  /** Current ranking in division */
  ranking?: number;

  /** Fighter class for our scoring system */
  fighterClass?: "Striker" | "Grappler" | "All-Rounder" | "Veteran";

  /** Profile image URL */
  imageUrl?: string;
}

/**
 * Configuration for events to scrape
 */
export interface EventConfig {
  /** Tapology event URL */
  url: string;

  /** Optional override for event name */
  nameOverride?: string;

  /** Whether to scrape fight results (post-event) */
  hasResults?: boolean;
}

/**
 * Result of scraping operation
 */
export interface ScrapeResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  url: string;
}
