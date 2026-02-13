/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_events from "../functions/events.js";
import type * as functions_fighters from "../functions/fighters.js";
import type * as functions_index from "../functions/index.js";
import type * as functions_leaderboard from "../functions/leaderboard.js";
import type * as functions_powerUpCards from "../functions/powerUpCards.js";
import type * as functions_rosters from "../functions/rosters.js";
import type * as functions_scoring from "../functions/scoring.js";
import type * as functions_scraper from "../functions/scraper.js";
import type * as functions_users from "../functions/users.js";
import type * as seed_powerUpCards from "../seed/powerUpCards.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/events": typeof functions_events;
  "functions/fighters": typeof functions_fighters;
  "functions/index": typeof functions_index;
  "functions/leaderboard": typeof functions_leaderboard;
  "functions/powerUpCards": typeof functions_powerUpCards;
  "functions/rosters": typeof functions_rosters;
  "functions/scoring": typeof functions_scoring;
  "functions/scraper": typeof functions_scraper;
  "functions/users": typeof functions_users;
  "seed/powerUpCards": typeof seed_powerUpCards;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
