/**
 * GitHub Analyzer
 * 
 * Fetches and normalizes GitHub data using Octokit.
 * Handles rate limiting and data normalization.
 */

import { Octokit } from '@octokit/rest';
import type {
  MergedPR,
  CodeReview,
  Issue,
  RepositoryContribution,
  GitHubActivity,
} from '../types/github';
import type {
  GitHubAPIRepository,
  GitHubAPIPullRequest,
  GitHubAPIReview,
  GitHubAPIIssue,
  RateLimitStatus,
} from '../types/github-api';

// ============================================================================
// Configuration
// ============================================================================

export interface GitHubAnalyzerConfig {
  octokit: Octokit;
  username: string;
  rateLimitBuffer?: number; // Minimum remaining requests before pausing
  maxConcurrentRequests?: number;
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

const DEFAULT_CONFIG = {
  rateLimitBuffer: 10,
  maxConcurrentRequests: 3,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ============================================================================
// Rate Limit Management
// ============================================================================

class RateLimitManager {
  private octokit: Octokit;
  private rateLimitBuffer: number;

  constructor(octokit: Octokit, rateLimitBuffer: number) {
    this.octokit = octokit;
    this.rateLimitBuffer = rateLimitBuffer;
  }

  /**
   * Check current rate limit status
   */
  async getRateLimitStatus(): Promise<RateLimitStatus> {
    const { data } = await this.octokit.rateLimit.get();
    return data;
  }

  /**
   * Wait if rate limit is too low
   */
  async waitIfNeeded(): Promise<void> {
    const status = await this.getRateLimitStatus();
    const remaining = status.core.remaining;

    if (remaining < this.rateLimitBuffer) {
      const resetTime = status.core.reset * 1000; // Convert to milliseconds
      const now = Date.now();
      const waitTime = Math.max(0, resetTime - now) + 1000; // Add 1 second buffer

      if (waitTime > 0) {
        console.log(`Rate limit low (${remaining} remaining). Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Check if we can make a request
   */
  async canMakeRequest(): Promise<boolean> {
    const status = await this.getRateLimitStatus();
    return status.core.remaining > this.rateLimitBuffer;
  }
}

// ============================================================================
// Fetch Strategy
// ============================================================================

export class GitHubAnalyzer {
  private config: Required<GitHubAnalyzerConfig>;
  private rateLimitManager: RateLimitManager;

  constructor(config: GitHubAnalyzerConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.rateLimitManager = new RateLimitManager(
      this.config.octokit,
      this.config.rateLimitBuffer
    );
  }

  /**
   * Fetch all public repositories for a user
   */
  async fetchRepositories(): Promise<GitHubAPIRepository[]> {
    await this.rateLimitManager.waitIfNeeded();

    const repos: GitHubAPIRepository[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const { data, headers } = await this.config.octokit.repos.listForUser({
          username: this.config.username,
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page,
        });

        repos.push(...data);

        // Check if there are more pages
        hasMore = data.length === 100 && headers.link?.includes('rel="next"');
        page++;

        await this.rateLimitManager.waitIfNeeded();
      } catch (error: any) {
        if (error.status === 404) {
          // User not found or no repos
          break;
        }
        throw error;
      }
    }

    return repos;
  }

  /**
   * Fetch merged pull requests for a repository
   */
  async fetchMergedPullRequests(
    owner: string,
    repo: string,
    author?: string
  ): Promise<GitHubAPIPullRequest[]> {
    await this.rateLimitManager.waitIfNeeded();

    const prs: GitHubAPIPullRequest[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const query: any = {
          owner,
          repo,
          state: 'closed',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page,
        };

        if (author) {
          query.creator = author;
        }

        const { data, headers } = await this.config.octokit.pulls.list(query);

        // Filter for merged PRs only
        const merged = data.filter(pr => pr.merged === true);
        prs.push(...merged);

        // Check if there are more pages
        hasMore = data.length === 100 && headers.link?.includes('rel="next"');
        page++;

        await this.rateLimitManager.waitIfNeeded();
      } catch (error: any) {
        if (error.status === 404) {
          break;
        }
        throw error;
      }
    }

    return prs;
  }

  /**
   * Fetch reviews for a pull request
   */
  async fetchPullRequestReviews(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<GitHubAPIReview[]> {
    await this.rateLimitManager.waitIfNeeded();

    try {
      const { data } = await this.config.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Fetch review comments for a pull request
   */
  async fetchPullRequestReviewComments(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]> {
    await this.rateLimitManager.waitIfNeeded();

    try {
      const { data } = await this.config.octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Fetch files changed in a pull request
   */
  async fetchPullRequestFiles(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]> {
    await this.rateLimitManager.waitIfNeeded();

    try {
      const { data } = await this.config.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Fetch issues for a repository
   */
  async fetchIssues(
    owner: string,
    repo: string,
    author?: string
  ): Promise<GitHubAPIIssue[]> {
    await this.rateLimitManager.waitIfNeeded();

    const issues: GitHubAPIIssue[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const query: any = {
          owner,
          repo,
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page,
        };

        if (author) {
          query.creator = author;
        }

        const { data, headers } = await this.config.octokit.issues.listForRepo(query);

        // Filter out PRs (issues with pull_request field)
        const actualIssues = data.filter(issue => !issue.pull_request);
        issues.push(...actualIssues);

        hasMore = data.length === 100 && headers.link?.includes('rel="next"');
        page++;

        await this.rateLimitManager.waitIfNeeded();
      } catch (error: any) {
        if (error.status === 404) {
          break;
        }
        throw error;
      }
    }

    return issues;
  }

  /**
   * Fetch repository languages
   */
  async fetchRepositoryLanguages(
    owner: string,
    repo: string
  ): Promise<Record<string, number>> {
    await this.rateLimitManager.waitIfNeeded();

    try {
      const { data } = await this.config.octokit.repos.listLanguages({
        owner,
        repo,
      });

      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return {};
      }
      throw error;
    }
  }

  /**
   * Fetch all data for a user
   */
  async fetchAllUserData(): Promise<GitHubActivity> {
    console.log(`Fetching data for user: ${this.config.username}`);

    // Fetch repositories
    const repos = await this.fetchRepositories();
    console.log(`Found ${repos.length} repositories`);

    const mergedPRs: MergedPR[] = [];
    const reviewsGiven: CodeReview[] = [];
    const reviewsReceived: CodeReview[] = [];
    const issues: Issue[] = [];
    const repositoryContributions: RepositoryContribution[] = [];

    let firstPRDate: Date | null = null;
    let lastPRDate: Date | null = null;

    // Process repositories in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (repo) => {
          const [owner, repoName] = repo.full_name.split('/');

          // Fetch PRs
          const prs = await this.fetchMergedPullRequests(owner, repoName, this.config.username);
          
          for (const pr of prs) {
            // Fetch additional PR data
            const [files, reviews, reviewComments] = await Promise.all([
              this.fetchPullRequestFiles(owner, repoName, pr.number),
              this.fetchPullRequestReviews(owner, repoName, pr.number),
              this.fetchPullRequestReviewComments(owner, repoName, pr.number),
            ]);

            const normalizedPR = this.normalizePullRequest(pr, repo, files, reviews, reviewComments);
            mergedPRs.push(normalizedPR);

            // Track date range
            const prDate = new Date(pr.merged_at!);
            if (!firstPRDate || prDate < firstPRDate) {
              firstPRDate = prDate;
            }
            if (!lastPRDate || prDate > lastPRDate) {
              lastPRDate = prDate;
            }

            // Normalize reviews
            for (const review of reviews) {
              if (review.user.login === this.config.username) {
                reviewsGiven.push(this.normalizeReviewGiven(review, pr, repo));
              } else {
                reviewsReceived.push(this.normalizeReviewReceived(review, pr, repo));
              }
            }
          }

          // Fetch issues
          const repoIssues = await this.fetchIssues(owner, repoName, this.config.username);
          for (const issue of repoIssues) {
            issues.push(this.normalizeIssue(issue, repo));
          }

          // Build repository contribution
          if (prs.length > 0) {
            const languages = await this.fetchRepositoryLanguages(owner, repoName);
            repositoryContributions.push(
              this.normalizeRepositoryContribution(repo, prs.length, languages)
            );
          }
        })
      );

      // Wait between batches
      if (i + batchSize < repos.length) {
        await this.rateLimitManager.waitIfNeeded();
      }
    }

    return {
      mergedPRs,
      reviewsGiven,
      reviewsReceived,
      issues,
      repositories: repositoryContributions,
      activitySpan: {
        firstPRDate: firstPRDate || new Date(),
        lastPRDate: lastPRDate || new Date(),
      },
    };
  }

  // ============================================================================
  // Normalization Functions
  // ============================================================================

  /**
   * Normalize pull request from GitHub API to internal format
   */
  private normalizePullRequest(
    pr: GitHubAPIPullRequest,
    repo: GitHubAPIRepository,
    files: any[],
    reviews: GitHubAPIReview[],
    reviewComments: any[]
  ): MergedPR {
    if (!pr.merged_at) {
      throw new Error('PR is not merged');
    }

    // Calculate directories touched
    const directories = new Set(
      files.map(file => {
        const parts = file.filename.split('/');
        return parts.slice(0, -1).join('/');
      })
    );

    // Determine if merged by maintainer (not self-merge)
    const isMaintainerMerge = pr.merged_by?.login !== pr.user.login;
    const isFork = pr.head.repo?.fork === true || repo.fork;

    // Count review rounds (unique review submissions)
    const reviewRounds = new Set(reviews.map(r => r.submitted_at)).size;

    // Calculate time to merge in hours
    const createdAt = new Date(pr.created_at);
    const mergedAt = new Date(pr.merged_at);
    const timeToMerge = (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    return {
      id: pr.id.toString(),
      repository: repo.full_name,
      mergedAt: mergedAt,
      mergedBy: pr.merged_by?.login || pr.user.login,
      author: pr.user.login,
      reviewCommentsReceived: reviewComments.length,
      reviewRounds,
      filesChanged: files.length,
      directoriesTouched: directories.size,
      isMaintainerMerge,
      isFork,
      timeToMerge,
    };
  }

  /**
   * Normalize review given (engineer reviewed someone else's PR)
   */
  private normalizeReviewGiven(
    review: GitHubAPIReview,
    pr: GitHubAPIPullRequest,
    repo: GitHubAPIRepository
  ): CodeReview {
    return {
      id: review.id.toString(),
      repository: repo.full_name,
      prId: pr.id.toString(),
      reviewedAt: new Date(review.submitted_at),
      reviewer: review.user.login,
      reviewee: pr.user.login,
      commentCount: review.body ? 1 : 0,
    };
  }

  /**
   * Normalize review received (someone reviewed engineer's PR)
   */
  private normalizeReviewReceived(
    review: GitHubAPIReview,
    pr: GitHubAPIPullRequest,
    repo: GitHubAPIRepository
  ): CodeReview {
    return {
      id: review.id.toString(),
      repository: repo.full_name,
      prId: pr.id.toString(),
      reviewedAt: new Date(review.submitted_at),
      reviewer: review.user.login,
      reviewee: pr.user.login,
      commentCount: review.body ? 1 : 0,
    };
  }

  /**
   * Normalize issue from GitHub API to internal format
   */
  private normalizeIssue(
    issue: GitHubAPIIssue,
    repo: GitHubAPIRepository
  ): Issue {
    // Check if issue led to a PR (simplified - would need to check PRs)
    const ledToMergedPR = false; // Would need to cross-reference with PRs

    return {
      id: issue.id.toString(),
      repository: repo.full_name,
      openedAt: new Date(issue.created_at),
      author: issue.user.login,
      ledToMergedPR,
      commentCount: 0, // Would need to fetch comments separately
    };
  }

  /**
   * Normalize repository contribution
   */
  private normalizeRepositoryContribution(
    repo: GitHubAPIRepository,
    mergedPRCount: number,
    languages: Record<string, number>
  ): RepositoryContribution {
    // Calculate contributor count (would need additional API call)
    const contributorCount = 1; // Placeholder
    const maintainerCount = 1; // Placeholder

    return {
      repository: repo.full_name,
      mergedPRCount,
      isFork: repo.fork,
      contributorCount,
      maintainerCount,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a GitHub analyzer instance
 */
export function createGitHubAnalyzer(
  octokit: Octokit,
  username: string,
  config?: Partial<Omit<GitHubAnalyzerConfig, 'octokit' | 'username'>>
): GitHubAnalyzer {
  return new GitHubAnalyzer({
    octokit,
    username,
    ...config,
  });
}
