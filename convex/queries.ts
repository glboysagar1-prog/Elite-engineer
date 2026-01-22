/**
 * Convex Query Examples for Wecraft
 * 
 * Demonstrates common query patterns using the schema.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// Engineer Queries
// ============================================================================

/**
 * Get engineer by username
 */
export const getEngineerByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("engineers")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

/**
 * Get engineers needing re-analysis (older than 24 hours)
 */
export const getEngineersNeedingAnalysis = query({
  args: {},
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("engineers")
      .withIndex("by_last_analyzed", (q) => q.lt("lastAnalyzedAt", oneDayAgo))
      .collect();
  },
});

/**
 * Get top engineers by merged PRs
 */
export const getTopEngineersByPRs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("engineers")
      .withIndex("by_total_prs")
      .order("desc")
      .take(limit);
  },
});

// ============================================================================
// Score Queries
// ============================================================================

/**
 * Get scores for an engineer
 */
export const getScoresByEngineer = query({
  args: { engineerId: v.id("engineers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scores")
      .withIndex("by_engineer", (q) => q.eq("engineerId", args.engineerId))
      .first();
  },
});

/**
 * Get scores by username (using denormalized field)
 */
export const getScoresByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scores")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

/**
 * Get top engineers by impact score
 */
export const getTopEngineersByImpact = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_impact_score")
      .order("desc")
      .take(limit);

    // Fetch engineer details
    const engineers = await Promise.all(
      scores.map((score) => ctx.db.get(score.engineerId))
    );

    return scores.map((score, i) => ({
      engineer: engineers[i],
      score,
    }));
  },
});

/**
 * Get top engineers by trust score
 */
export const getTopEngineersByTrust = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_trust_score")
      .order("desc")
      .take(limit);

    const engineers = await Promise.all(
      scores.map((score) => ctx.db.get(score.engineerId))
    );

    return scores.map((score, i) => ({
      engineer: engineers[i],
      score,
    }));
  },
});

/**
 * Get compatibility score for specific role
 */
export const getCompatibilityScore = query({
  args: {
    engineerId: v.id("engineers"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const score = await ctx.db
      .query("scores")
      .withIndex("by_engineer", (q) => q.eq("engineerId", args.engineerId))
      .first();

    if (!score) return null;

    const compatibility = score.compatibilityScores.find(
      (cs) => cs.role === args.role
    );

    return compatibility || null;
  },
});

// ============================================================================
// Evidence Queries
// ============================================================================

/**
 * Get evidence for an engineer
 */
export const getEvidenceByEngineer = query({
  args: { engineerId: v.id("engineers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidence")
      .withIndex("by_engineer", (q) => q.eq("engineerId", args.engineerId))
      .collect();
  },
});

/**
 * Get evidence by type for an engineer
 */
export const getEvidenceByType = query({
  args: {
    engineerId: v.id("engineers"),
    type: v.union(
      v.literal("merged_pr"),
      v.literal("code_review"),
      v.literal("issue"),
      v.literal("repository"),
      v.literal("collaboration")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidence")
      .withIndex("by_engineer_and_type", (q) =>
        q.eq("engineerId", args.engineerId).eq("type", args.type)
      )
      .collect();
  },
});

/**
 * Get top evidence by impact
 */
export const getTopEvidenceByImpact = query({
  args: {
    engineerId: v.id("engineers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("evidence")
      .withIndex("by_engineer", (q) => q.eq("engineerId", args.engineerId))
      .filter((q) => q.neq(q.field("data.impact"), undefined))
      .order("desc")
      .take(limit);
  },
});

// ============================================================================
// Recruiter Search Queries
// ============================================================================

/**
 * Search engineers (full-text search with filters)
 */
export const searchEngineers = query({
  args: {
    searchText: v.optional(v.string()),
    role: v.optional(v.string()),
    technologies: v.optional(v.array(v.string())),
    minImpactScore: v.optional(v.number()),
    maxImpactScore: v.optional(v.number()),
    minTrustScore: v.optional(v.number()),
    maxTrustScore: v.optional(v.number()),
    isAuthentic: v.optional(v.boolean()),
    hasHighMatch: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let query = ctx.db.query("recruiterSearchIndex");

    // Apply filters
    if (args.isAuthentic !== undefined) {
      query = query.withIndex("by_authentic", (q) =>
        q.eq("isAuthentic", args.isAuthentic)
      );
    }

    if (args.hasHighMatch !== undefined) {
      query = query.withIndex("by_high_match", (q) =>
        q.eq("hasHighMatch", args.hasHighMatch)
      );
    }

    // Full-text search
    if (args.searchText) {
      query = query.search("search_engineers", args.searchText);
    }

    let results = await query.collect();

    // Apply additional filters in memory (for complex filters)
    if (args.role) {
      results = results.filter((r) => {
        const matchScore = r.roleMatchScores[args.role as keyof typeof r.roleMatchScores];
        return matchScore !== undefined && matchScore > 50;
      });
    }

    if (args.technologies && args.technologies.length > 0) {
      results = results.filter((r) =>
        args.technologies!.some((tech) => r.technologies.includes(tech))
      );
    }

    if (args.minImpactScore !== undefined) {
      results = results.filter(
        (r) => r.impactScoreRange.min >= args.minImpactScore!
      );
    }

    if (args.maxImpactScore !== undefined) {
      results = results.filter(
        (r) => r.impactScoreRange.max <= args.maxImpactScore!
      );
    }

    if (args.minTrustScore !== undefined) {
      results = results.filter(
        (r) => r.trustScoreRange.min >= args.minTrustScore!
      );
    }

    if (args.maxTrustScore !== undefined) {
      results = results.filter(
        (r) => r.trustScoreRange.max <= args.maxTrustScore!
      );
    }

    // Sort by overall rank
    results.sort((a, b) => b.overallRank - a.overallRank);

    // Fetch engineer details
    const engineers = await Promise.all(
      results.slice(0, limit).map((r) => ctx.db.get(r.engineerId))
    );

    return results.slice(0, limit).map((result, i) => ({
      engineer: engineers[i],
      searchResult: result,
    }));
  },
});

/**
 * Get top engineers for a specific role
 */
export const getTopEngineersForRole = query({
  args: {
    role: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const results = await ctx.db
      .query("recruiterSearchIndex")
      .withIndex("by_high_match", (q) => q.eq("hasHighMatch", true))
      .collect();

    // Filter and sort by role match score
    const filtered = results
      .map((r) => ({
        result: r,
        matchScore:
          r.roleMatchScores[args.role as keyof typeof r.roleMatchScores] || 0,
      }))
      .filter((r) => r.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    const engineers = await Promise.all(
      filtered.map((f) => ctx.db.get(f.result.engineerId))
    );

    return filtered.map((f, i) => ({
      engineer: engineers[i],
      matchScore: f.matchScore,
      searchResult: f.result,
    }));
  },
});

/**
 * Get engineers by score ranges
 */
export const getEngineersByScoreRanges = query({
  args: {
    impactMin: v.optional(v.number()),
    impactMax: v.optional(v.number()),
    trustMin: v.optional(v.number()),
    trustMax: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let query = ctx.db.query("recruiterSearchIndex");

    // Use range index if available
    if (args.impactMin !== undefined || args.impactMax !== undefined) {
      query = query.withIndex("by_impact_range");
    }

    let results = await query.collect();

    // Apply range filters
    if (args.impactMin !== undefined) {
      results = results.filter(
        (r) => r.impactScoreRange.max >= args.impactMin!
      );
    }

    if (args.impactMax !== undefined) {
      results = results.filter(
        (r) => r.impactScoreRange.min <= args.impactMax!
      );
    }

    if (args.trustMin !== undefined) {
      results = results.filter(
        (r) => r.trustScoreRange.max >= args.trustMin!
      );
    }

    if (args.trustMax !== undefined) {
      results = results.filter(
        (r) => r.trustScoreRange.min <= args.trustMax!
      );
    }

    // Sort by overall rank
    results.sort((a, b) => b.overallRank - a.overallRank);

    const engineers = await Promise.all(
      results.slice(0, limit).map((r) => ctx.db.get(r.engineerId))
    );

    return results.slice(0, limit).map((result, i) => ({
      engineer: engineers[i],
      searchResult: result,
    }));
  },
});

// ============================================================================
// Analysis Job Queries
// ============================================================================

/**
 * Get job status
 */
export const getJobStatus = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analysisJobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

/**
 * Get jobs for an engineer
 */
export const getJobsByEngineer = query({
  args: { engineerId: v.id("engineers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analysisJobs")
      .withIndex("by_engineer", (q) => q.eq("engineerId", args.engineerId))
      .order("desc")
      .collect();
  },
});
