/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as jury from "../jury.js";
import type * as live from "../live.js";
import type * as models from "../models.js";
import type * as profiles from "../profiles.js";
import type * as rag from "../rag.js";
import type * as scheduler from "../scheduler.js";
import type * as seats from "../seats.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as speak from "../speak.js";
import type * as transcript from "../transcript.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  jury: typeof jury;
  live: typeof live;
  models: typeof models;
  profiles: typeof profiles;
  rag: typeof rag;
  scheduler: typeof scheduler;
  seats: typeof seats;
  seed: typeof seed;
  sessions: typeof sessions;
  speak: typeof speak;
  transcript: typeof transcript;
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
