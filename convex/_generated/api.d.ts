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
import type * as crons from "../crons.js";
import type * as delivery from "../delivery.js";
import type * as deliveryMath from "../deliveryMath.js";
import type * as jury from "../jury.js";
import type * as live from "../live.js";
import type * as loop from "../loop.js";
import type * as model from "../model.js";
import type * as models from "../models.js";
import type * as panel from "../panel.js";
import type * as pitchTypes from "../pitchTypes.js";
import type * as profiles from "../profiles.js";
import type * as rag from "../rag.js";
import type * as scheduler from "../scheduler.js";
import type * as seats from "../seats.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as speak from "../speak.js";
import type * as tavily from "../tavily.js";
import type * as transcript from "../transcript.js";
import type * as tuning from "../tuning.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  corpus: typeof corpus;
  crons: typeof crons;
  delivery: typeof delivery;
  deliveryMath: typeof deliveryMath;
  jury: typeof jury;
  live: typeof live;
  loop: typeof loop;
  model: typeof model;
  models: typeof models;
  panel: typeof panel;
  pitchTypes: typeof pitchTypes;
  profiles: typeof profiles;
  rag: typeof rag;
  scheduler: typeof scheduler;
  seats: typeof seats;
  seed: typeof seed;
  sessions: typeof sessions;
  speak: typeof speak;
  tavily: typeof tavily;
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
