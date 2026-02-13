/**
 * Game Configuration Constants
 *
 * Core game rules and constraints for OctoDraft
 */

export const ROSTER_CONFIG = {
  /** Maximum number of fighters per roster */
  MAX_FIGHTERS: 6,

  /** Salary cap in virtual credits */
  SALARY_CAP: 10000,

  /** Number of captains required (exactly 1) */
  REQUIRED_CAPTAINS: 1,

  /** Maximum power-ups allowed per roster */
  MAX_POWER_UPS: 2,
} as const;

export const SALARY_RANGES = {
  MIN: 1000,
  MAX: 2500,

  /** Salary ranges by fighter ranking */
  CHAMPION: { min: 2300, max: 2500 },
  TOP_5: { min: 2000, max: 2299 },
  TOP_10: { min: 1700, max: 1999 },
  TOP_15: { min: 1400, max: 1699 },
  UNRANKED: { min: 1000, max: 1399 },
} as const;

export const XP_CONFIG = {
  /** Base XP for participating in an event */
  BASE_XP: 50,

  /** XP bonus for captain winning */
  CAPTAIN_WIN_BONUS: 100,

  /** XP bonuses by finish method */
  METHOD_BONUS: {
    "KO/TKO": 50,
    "Submission": 40,
    "Decision": 20,
  },

  /** XP thresholds for each level */
  LEVEL_THRESHOLDS: [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 100 },
    { level: 3, xpRequired: 300 },
    { level: 4, xpRequired: 600 },
    { level: 5, xpRequired: 1000 },
    { level: 6, xpRequired: 1500 },
    { level: 7, xpRequired: 2100 },
    { level: 8, xpRequired: 2800 },
    { level: 9, xpRequired: 3600 },
    { level: 10, xpRequired: 4500 },
  ],
} as const;

export const SYNERGY_CONFIG = {
  /** Minimum fighters of same class to activate synergy */
  MIN_FIGHTERS_FOR_SYNERGY: 3,

  /** Veteran age threshold */
  VETERAN_AGE: 35,
} as const;

/**
 * Unified game configuration
 * Aggregates all config for easy access
 */
export const GAME_CONFIG = {
  SALARY_CAP: ROSTER_CONFIG.SALARY_CAP,
  MAX_FIGHTERS: ROSTER_CONFIG.MAX_FIGHTERS,
  MAX_POWER_UPS: ROSTER_CONFIG.MAX_POWER_UPS,
  REQUIRED_CAPTAINS: ROSTER_CONFIG.REQUIRED_CAPTAINS,
} as const;
