/**
 * Inngest Background Jobs for Wecraft
 * 
 * Handles:
 * - GitHub data fetching
 * - Score computation (Impact, Trust, Compatibility)
 * - Idempotent and retry-safe operations
 */

import { inngest } from './inngest-client';
import { createGitHubAnalyzer } from '../utils/github-analyzer';
import { Octokit } from '@octokit/rest';
import { calculateImpactScore } from '../scores/impact';
import { calculateTrustScore } from '../scores/trust';
import { calculateCompatibilityScore } from '../scores/compatibility';
import { calculateRecruiterMatchScore } from '../scores/recruiterMatch';
import type { GitHubActivity } from '../types/github';
import type { GitHubAccount, ContributionPattern } from '../types/github';
import type { RoleQuery } from '../types/roles';

// ============================================================================
// Event Types
// ============================================================================

export interface EngineerAnalysisEvent {
  name: 'engineer/analyze';
  data: {
    username: string;
    roleQuery?: RoleQuery;
    forceRefresh?: boolean;
  };
}

export interface ScoreComputationEvent {
  name: 'scores/compute';
  data: {
    username: string;
    githubActivity: GitHubActivity;
    account: GitHubAccount;
    contributionPattern: ContributionPattern;
    roleQuery?: RoleQuery;
  };
}

export interface GitHubFetchEvent {
  name: 'github/fetch';
  data: {
    username: string;
    retryCount?: number;
  };
}

// ============================================================================
// Job Flow
// ============================================================================

/**
 * Main Job Flow:
 * 
 * 1. engineer/analyze (triggered by user/API)
 *    ↓
 * 2. github/fetch (fetch GitHub data)
 *    ↓
 * 3. scores/compute (compute all scores)
 *    ↓
 * 4. Store results (idempotent)
 */

// ============================================================================
// Job 1: Engineer Analysis (Main Entry Point)
// ============================================================================

export const engineerAnalysisJob = inngest.createFunction(
  {
    id: 'engineer-analysis',
    name: 'Engineer Analysis',
    retries: 3,
    idempotency: 'event.data.username', // Idempotent by username
  },
  { event: 'engineer/analyze' },
  async ({ event, step }) => {
    const { username, roleQuery, forceRefresh } = event.data;

    // Step 1: Check if we need to fetch (idempotent check)
    const shouldFetch = await step.run('check-cache', async () => {
      if (forceRefresh) return true;
      
      // Check if we have recent data (e.g., < 24 hours old)
      // This is idempotent - same username = same result
      const cached = await checkCachedData(username);
      return !cached || isStale(cached);
    });

    if (!shouldFetch) {
      // Return cached results
      return await step.run('get-cached-results', async () => {
        return await getCachedResults(username);
      });
    }

    // Step 2: Fetch GitHub data (idempotent - same username = same data)
    const githubData = await step.run('fetch-github-data', async () => {
      return await inngest.send({
        name: 'github/fetch',
        data: { username },
      });
    });

    // Step 3: Wait for GitHub fetch to complete
    const activity = await step.waitForEvent('wait-github-fetch', {
      event: 'github/fetch.complete',
      timeout: '10m',
      match: 'data.username',
    });

    if (!activity) {
      throw new Error('GitHub fetch timed out');
    }

    // Step 4: Compute scores (idempotent - same inputs = same outputs)
    const scores = await step.run('compute-scores', async () => {
      return await inngest.send({
        name: 'scores/compute',
        data: {
          username,
          githubActivity: activity.data.activity,
          account: activity.data.account,
          contributionPattern: activity.data.contributionPattern,
          roleQuery,
        },
      });
    });

    // Step 5: Store results (idempotent - upsert by username)
    await step.run('store-results', async () => {
      return await storeResults(username, {
        activity: activity.data.activity,
        scores: scores.data,
        computedAt: new Date(),
      });
    });

    return {
      username,
      scores: scores.data,
      computedAt: new Date(),
    };
  }
);

// ============================================================================
// Job 2: GitHub Data Fetching
// ============================================================================

export const githubFetchJob = inngest.createFunction(
  {
    id: 'github-fetch',
    name: 'GitHub Data Fetch',
    retries: 5, // More retries for external API
    idempotency: 'event.data.username', // Idempotent by username
  },
  { event: 'github/fetch' },
  async ({ event, step }) => {
    const { username, retryCount = 0 } = event.data;

    // Step 1: Initialize Octokit (idempotent)
    const octokit = await step.run('init-octokit', async () => {
      return new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
    });

    // Step 2: Fetch repositories (idempotent - same username = same repos)
    const repos = await step.run('fetch-repositories', async () => {
      const analyzer = createGitHubAnalyzer(octokit, username);
      return await analyzer.fetchRepositories();
    });

    // Step 3: Fetch activity data (idempotent)
    const activity = await step.run('fetch-activity', async () => {
      const analyzer = createGitHubAnalyzer(octokit, username);
      return await analyzer.fetchAllUserData();
    });

    // Step 4: Fetch account data (idempotent)
    const account = await step.run('fetch-account', async () => {
      const { data } = await octokit.users.getByUsername({ username });
      return normalizeAccount(data);
    });

    // Step 5: Build contribution pattern (idempotent - derived from activity)
    const contributionPattern = await step.run('build-contribution-pattern', async () => {
      return buildContributionPattern(activity, account);
    });

    // Step 6: Emit completion event
    await step.sendEvent('github-fetch-complete', {
      name: 'github/fetch.complete',
      data: {
        username,
        activity,
        account,
        contributionPattern,
      },
    });

    return {
      username,
      activity,
      account,
      contributionPattern,
    };
  }
);

// ============================================================================
// Job 3: Score Computation
// ============================================================================

export const scoreComputationJob = inngest.createFunction(
  {
    id: 'score-computation',
    name: 'Score Computation',
    retries: 2, // Fewer retries - computation is deterministic
    idempotency: 'event.data.username', // Idempotent by username
  },
  { event: 'scores/compute' },
  async ({ event, step }) => {
    const {
      username,
      githubActivity,
      account,
      contributionPattern,
      roleQuery,
    } = event.data;

    // Step 1: Compute Impact Score (idempotent - same activity = same score)
    const impactScore = await step.run('compute-impact', async () => {
      return calculateImpactScore(githubActivity);
    });

    // Step 2: Compute Trust Score (idempotent - same inputs = same score)
    const trustScore = await step.run('compute-trust', async () => {
      return calculateTrustScore(account, contributionPattern);
    });

    // Step 3: Compute Compatibility Score (idempotent - same inputs = same score)
    const compatibilityScore = await step.run('compute-compatibility', async () => {
      if (!roleQuery) {
        // Default to backend if no role specified
        return calculateCompatibilityScore(githubActivity, { role: 'backend' });
      }
      return calculateCompatibilityScore(githubActivity, roleQuery);
    });

    // Step 4: Compute Recruiter Match Score (idempotent)
    const matchScore = await step.run('compute-match', async () => {
      return calculateRecruiterMatchScore(trustScore, compatibilityScore, impactScore);
    });

    return {
      username,
      impactScore,
      trustScore,
      compatibilityScore,
      matchScore,
      computedAt: new Date(),
    };
  }
);

// ============================================================================
// Helper Functions (Idempotent)
// ============================================================================

/**
 * Check if cached data exists (idempotent)
 */
async function checkCachedData(username: string): Promise<any | null> {
  // Implementation: Check database/cache
  // Same username always returns same result
  return null; // Placeholder
}

/**
 * Check if data is stale (idempotent)
 */
function isStale(data: any): boolean {
  const age = Date.now() - new Date(data.computedAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  return age > maxAge;
}

/**
 * Get cached results (idempotent)
 */
async function getCachedResults(username: string): Promise<any> {
  // Implementation: Fetch from database/cache
  // Same username always returns same result
  return null; // Placeholder
}

/**
 * Store results (idempotent - upsert)
 */
async function storeResults(username: string, results: any): Promise<void> {
  // Implementation: Upsert to database
  // Same username always stores/updates same record
}

/**
 * Normalize account data (idempotent - same input = same output)
 */
function normalizeAccount(data: any): GitHubAccount {
  return {
    username: data.login,
    createdAt: new Date(data.created_at),
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
    bio: data.bio,
    location: data.location,
    company: data.company,
    website: data.blog,
    email: data.email,
    isVerified: false, // Would need to check verification status
  };
}

/**
 * Build contribution pattern (idempotent - derived from activity)
 */
function buildContributionPattern(
  activity: GitHubActivity,
  account: GitHubAccount
): ContributionPattern {
  // Implementation: Build contribution pattern from activity
  // Same activity + account = same pattern
  return {
    totalPRs: activity.mergedPRs.length,
    mergedPRs: activity.mergedPRs.length,
    openPRs: 0,
    closedPRs: 0,
    selfMergedPRs: activity.mergedPRs.filter(pr => pr.author === pr.mergedBy).length,
    forkPRs: activity.mergedPRs.filter(pr => pr.isFork).length,
    originalRepoPRs: activity.mergedPRs.filter(pr => !pr.isFork).length,
    forkOnlyRepos: [],
    originalRepoContributions: activity.mergedPRs.filter(pr => !pr.isFork).length,
    firstContributionDate: activity.activitySpan.firstPRDate,
    lastContributionDate: activity.activitySpan.lastPRDate,
    contributionDays: 0,
    contributionMonths: 0,
    averagePRsPerDay: 0,
    maxPRsInSingleDay: 0,
    uniqueRepositories: activity.repositories.length,
    repositoriesWithMultiplePRs: 0,
    repositoriesWithMaintainerInteraction: 0,
    reviewsGiven: activity.reviewsGiven.length,
    reviewsReceived: activity.reviewsReceived.length,
    maintainerReviews: 0,
    issuesOpened: activity.issues.length,
    issuesClosed: 0,
    issuesWithPRs: 0,
    commitMessagePatterns: new Map(),
    commitTimePatterns: [],
    identicalCommitMessages: 0,
    uniqueCollaborators: 0,
    maintainerInteractions: 0,
    crossRepositoryCollaborations: 0,
  };
}
