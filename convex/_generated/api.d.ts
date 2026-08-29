/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as corpus from "../corpus.js";
import type * as jury from "../jury.js";
import type * as live from "../live.js";
import type * as profiles from "../profiles.js";
import type * as rag from "../rag.js";
import type * as seats from "../seats.js";
import type * as sessions from "../sessions.js";
import type * as transcript from "../transcript.js";
import type * as tuning from "../tuning.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  corpus: typeof corpus;
  jury: typeof jury;
  live: typeof live;
  profiles: typeof profiles;
  rag: typeof rag;
  seats: typeof seats;
  sessions: typeof sessions;
  transcript: typeof transcript;
  tuning: typeof tuning;
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
