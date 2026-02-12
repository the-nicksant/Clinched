/**
 * Scoring Constants
 *
 * All point values, multipliers, and bonuses for the scoring engine
 */

export const VICTORY_POINTS = {
  WIN: 100,
  LOSS: 0,
  DRAW: 50,
  NO_CONTEST: 0,
} as const;

export const METHOD_MULTIPLIERS = {
  "KO/TKO": 2.0,
  Submission: 1.8,
  Decision: {
    Unanimous: 1.2,
    Split: 1.0,
    Majority: 1.1,
  },
  DQ: 1.0,
  "No Contest": 1.0,
} as const;

export const VOLUME_POINTS = {
  /** Points per knockdown */
  KNOCKDOWN: 20,

  /** Points per successful takedown */
  TAKEDOWN: 10,

  /** Points per submission attempt */
  SUBMISSION_ATTEMPT: 10,

  /** Points per significant strike */
  SIGNIFICANT_STRIKE: 0.5,
} as const;

export const ROUND_BONUSES = {
  ROUND_1: 100,
  ROUND_2: 60,
  ROUND_3: 30,
  ROUND_4: 50,
  ROUND_5: 50,
  DECISION: 0, // No bonus for decisions
} as const;

export const UFC_BONUSES = {
  /** Performance of the Night bonus */
  PERFORMANCE_OF_THE_NIGHT: 100,

  /** Fight of the Night bonus */
  FIGHT_OF_THE_NIGHT: 100,
} as const;

export const SYNERGY_MULTIPLIERS = {
  /** Striker synergy (3+ Strikers, won by KO/TKO) */
  STRIKER: 1.15,

  /** Grappler synergy (3+ Grapplers, won by Submission) */
  GRAPPLER: 1.15,

  /** All-Rounder synergy (3+ All-Rounders, won by Decision) */
  ALL_ROUNDER_BONUS: 10, // Flat bonus, not multiplier

  /** No synergy active */
  NONE: 1.0,
} as const;

export const CAPTAIN_MULTIPLIER = 1.5;

export const POWER_UP_EFFECTS = {
  HYPE_TRAIN: {
    WIN_MULTIPLIER: 2.0,
    LOSS_MULTIPLIER: -2.0, // Applied to volume points
  },
  RESILIENCE: {
    /** If fighter loses but gets FOTN, treat as decision win */
    DECISION_EQUIVALENT_MULTIPLIER: 1.2,
  },
  BLITZ: {
    /** 3x multiplier if finished in Round 1 */
    ROUND_1_MULTIPLIER: 3.0,
  },
  RED_MIST: {
    /** Bonus per UFC bonus (POTN or FOTN) */
    BONUS_PER_UFC_BONUS: 50,
  },
} as const;

export const PENALTIES = {
  /** Penalty for missing weight */
  WEIGHT_MISS: -50,

  /** Penalty per point deduction (referee foul) */
  POINT_DEDUCTION: -25,
} as const;

/**
 * Fighter class identification thresholds
 */
export const FIGHTER_CLASSIFICATION = {
  /** % of strikes vs grappling to be classified as Striker */
  STRIKER_THRESHOLD: 0.7,

  /** % of grappling attempts to be classified as Grappler */
  GRAPPLER_THRESHOLD: 0.6,

  /** Veteran age threshold */
  VETERAN_AGE: 35,
} as const;
