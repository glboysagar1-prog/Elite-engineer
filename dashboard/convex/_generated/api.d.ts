/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crm from "../crm.js";
import type * as github from "../github.js";
import type * as scores_compatibility from "../scores/compatibility.js";
import type * as scores_impact from "../scores/impact.js";
import type * as scores_recruiterMatch from "../scores/recruiterMatch.js";
import type * as scores_trust from "../scores/trust.js";
import type * as types_github from "../types/github.js";
import type * as types_github_api from "../types/github_api.js";
import type * as types_roles from "../types/roles.js";
import type * as types_scores from "../types/scores.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crm: typeof crm;
  github: typeof github;
  "scores/compatibility": typeof scores_compatibility;
  "scores/impact": typeof scores_impact;
  "scores/recruiterMatch": typeof scores_recruiterMatch;
  "scores/trust": typeof scores_trust;
  "types/github": typeof types_github;
  "types/github_api": typeof types_github_api;
  "types/roles": typeof types_roles;
  "types/scores": typeof types_scores;
  users: typeof users;
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
