/**
 * Convex Schema for Wecraft
 * 
 * Defines all data models for the Elite Engineers Discovery Platform.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================================
  // Engineers Table
  // ============================================================================
  engineers: defineTable({
    // Identity
    username: v.string(), // GitHub username (unique)
    githubId: v.number(), // GitHub user ID
    
    // Account Information
    account: v.object({
      createdAt: v.number(), // Unix timestamp
      publicRepos: v.number(),
      followers: v.number(),
      following: v.number(),
      bio: v.string().optional(),
      location: v.string().optional(),
      company: v.string().optional(),
      website: v.string().optional(),
      email: v.string().optional(),
      isVerified: v.boolean(),
    }),
    
    // Activity Summary
    activitySummary: v.object({
      totalMergedPRs: v.number(),
      totalRepositories: v.number(),
      firstContributionDate: v.number().optional(), // Unix timestamp
      lastContributionDate: v.number().optional(), // Unix timestamp
      activitySpanMonths: v.number(),
    }),
    
    // Metadata
    lastAnalyzedAt: v.number(), // Unix timestamp
    analysisVersion: v.number(), // Schema version for migrations
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_username", ["username"])
    .index("by_last_analyzed", ["lastAnalyzedAt"])
    .index("by_activity_span", ["activitySummary.activitySpanMonths"])
    .index("by_total_prs", ["activitySummary.totalMergedPRs"]),

  // ============================================================================
  // Scores Table
  // ============================================================================
  scores: defineTable({
    // Foreign Key
    engineerId: v.id("engineers"),
    username: v.string(), // Denormalized for easier queries
    
    // Impact Score
    impactScore: v.object({
      total: v.number(), // 0-100
      components: v.object({
        prImpact: v.number(),
        collaboration: v.number(),
        longevity: v.number(),
        quality: v.number(),
      }),
      signals: v.object({
        totalMergedPRs: v.number(),
        selfMergedPRs: v.number(),
        spamPRs: v.number(),
        activeRepositories: v.number(),
        activitySpanMonths: v.number(),
      }),
    }),
    
    // Trust Score
    trustScore: v.object({
      total: v.number(), // 0-100
      isAuthentic: v.boolean(),
      confidence: v.number(), // 0-100
      components: v.object({
        accountAuthenticity: v.number(),
        contributionAuthenticity: v.number(),
        collaborationSignals: v.number(),
        antiGamingScore: v.number(),
      }),
      signals: v.object({
        accountAge: v.number(),
        accountMaturity: v.number(),
        contributionSpan: v.number(),
        repositoryDiversity: v.number(),
        maintainerTrust: v.number(),
        collaborationDepth: v.number(),
        forkContributionRatio: v.number(),
        originalRepoContributionRatio: v.number(),
      }),
      redFlags: v.array(v.string()),
      greenFlags: v.array(v.string()),
    }),
    
    // Compatibility Scores (one per role)
    compatibilityScores: v.array(
      v.object({
        role: v.string(), // 'backend', 'frontend', etc.
        total: v.number(), // 0-100
        compatibilityLevel: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low"),
          v.literal("poor")
        ),
        signals: v.object({
          technologyStackMatch: v.number(),
          domainContributionDepth: v.number(),
          architecturePatternMatch: v.number(),
          fileTypeAlignment: v.number(),
          activityTypeMatch: v.number(),
          repositoryTypeMatch: v.number(),
          reviewDomainExpertise: v.number(),
        }),
        matchedTechnologies: v.array(v.string()),
        detectedPatterns: v.array(v.string()),
      })
    ),
    
    // Recruiter Match Score (computed per role query)
    matchScores: v.array(
      v.object({
        role: v.string(),
        totalMatchScore: v.number(), // 0-100
        matchLevel: v.union(
          v.literal("excellent"),
          v.literal("strong"),
          v.literal("good"),
          v.literal("fair"),
          v.literal("poor")
        ),
        recommendation: v.union(
          v.literal("strongly-recommend"),
          v.literal("recommend"),
          v.literal("consider"),
          v.literal("not-recommended")
        ),
        trustComponent: v.number(),
        compatibilityComponent: v.number(),
        impactComponent: v.number(),
        computedAt: v.number(), // Unix timestamp
      })
    ),
    
    // Metadata
    computedAt: v.number(), // Unix timestamp
    computedBy: v.string(), // Job ID or user ID
    version: v.number(), // Schema version
  })
    .index("by_engineer", ["engineerId"])
    .index("by_username", ["username"])
    .index("by_impact_score", ["impactScore.total"])
    .index("by_trust_score", ["trustScore.total"])
    .index("by_computed_at", ["computedAt"])
    .index("by_match_score", ["matchScores"], {
      // Composite index for match score queries
      searchField: "matchScores",
    }),

  // ============================================================================
  // Evidence Table
  // ============================================================================
  evidence: defineTable({
    // Foreign Key
    engineerId: v.id("engineers"),
    username: v.string(), // Denormalized
    
    // Evidence Type
    type: v.union(
      v.literal("merged_pr"),
      v.literal("code_review"),
      v.literal("issue"),
      v.literal("repository"),
      v.literal("collaboration")
    ),
    
    // Evidence Data
    data: v.object({
      // For merged PRs
      repository: v.string().optional(),
      prId: v.string().optional(),
      mergedAt: v.number().optional(), // Unix timestamp
      filesChanged: v.number().optional(),
      isMaintainerMerge: v.boolean().optional(),
      isFork: v.boolean().optional(),
      
      // For reviews
      reviewType: v.union(
        v.literal("given"),
        v.literal("received")
      ).optional(),
      reviewer: v.string().optional(),
      reviewee: v.string().optional(),
      
      // For issues
      issueId: v.string().optional(),
      ledToMergedPR: v.boolean().optional(),
      
      // For repositories
      repoName: v.string().optional(),
      primaryLanguage: v.string().optional(),
      topics: v.array(v.string()).optional(),
      
      // Common
      description: v.string().optional(),
      impact: v.number().optional(), // 0-100
    }),
    
    // Score Contributions
    contributesTo: v.array(
      v.object({
        scoreType: v.union(
          v.literal("impact"),
          v.literal("trust"),
          v.literal("compatibility")
        ),
        component: v.string().optional(), // e.g., "prImpact", "collaboration"
        contribution: v.number(), // How much this evidence contributes
      })
    ),
    
    // Metadata
    createdAt: v.number(), // Unix timestamp
    discoveredAt: v.number(), // When this evidence was found
  })
    .index("by_engineer", ["engineerId"])
    .index("by_username", ["username"])
    .index("by_type", ["type"])
    .index("by_repository", ["data.repository"])
    .index("by_impact", ["data.impact"])
    .index("by_created_at", ["createdAt"])
    .index("by_engineer_and_type", ["engineerId", "type"]),

  // ============================================================================
  // Recruiter Search Index
  // ============================================================================
  recruiterSearchIndex: defineTable({
    // Foreign Keys
    engineerId: v.id("engineers"),
    scoreId: v.id("scores").optional(),
    username: v.string(), // Denormalized
    
    // Search Fields
    searchText: v.string(), // Full-text search: username, bio, technologies, etc.
    technologies: v.array(v.string()), // Technologies from compatibility scores
    roles: v.array(v.string()), // Roles with compatibility scores
    
    // Filter Fields
    impactScoreRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    trustScoreRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    isAuthentic: v.boolean(),
    hasHighMatch: v.boolean(), // Has any match score > 70
    
    // Match Scores by Role (for filtering)
    roleMatchScores: v.object({
      backend: v.number().optional(),
      frontend: v.number().optional(),
      fullstack: v.number().optional(),
      devops: v.number().optional(),
      mobile: v.number().optional(),
      "data-engineer": v.number().optional(),
      security: v.number().optional(),
      "ml-engineer": v.number().optional(),
      sre: v.number().optional(),
      "platform-engineer": v.number().optional(),
    }),
    
    // Ranking Fields
    overallRank: v.number(), // Computed ranking score
    lastUpdated: v.number(), // Unix timestamp
    
    // Metadata
    indexedAt: v.number(), // Unix timestamp
    indexVersion: v.number(), // Schema version
  })
    .index("by_engineer", ["engineerId"])
    .index("by_username", ["username"])
    .index("by_impact_range", ["impactScoreRange.min", "impactScoreRange.max"])
    .index("by_trust_range", ["trustScoreRange.min", "trustScoreRange.max"])
    .index("by_authentic", ["isAuthentic"])
    .index("by_high_match", ["hasHighMatch"])
    .index("by_overall_rank", ["overallRank"])
    .index("by_last_updated", ["lastUpdated"])
    .index("by_role_match", ["roleMatchScores"], {
      // Composite index for role-based searches
      searchField: "roleMatchScores",
    })
    .searchIndex("search_engineers", {
      searchField: "searchText",
      filterFields: [
        "isAuthentic",
        "hasHighMatch",
        "technologies",
        "roles",
      ],
    }),

  // ============================================================================
  // Analysis Jobs Table (for tracking background jobs)
  // ============================================================================
  analysisJobs: defineTable({
    // Job Identity
    jobId: v.string(), // Inngest job ID
    username: v.string(),
    engineerId: v.id("engineers").optional(),
    
    // Job Status
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    
    // Job Progress
    progress: v.object({
      currentStep: v.string().optional(),
      totalSteps: v.number(),
      completedSteps: v.number(),
      percentage: v.number(), // 0-100
    }),
    
    // Job Results
    result: v.object({
      scoreId: v.id("scores").optional(),
      error: v.string().optional(),
      completedAt: v.number().optional(),
    }).optional(),
    
    // Metadata
    createdAt: v.number(), // Unix timestamp
    startedAt: v.number().optional(),
    completedAt: v.number().optional(),
    retryCount: v.number(),
  })
    .index("by_job_id", ["jobId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_engineer", ["engineerId"]),
});
