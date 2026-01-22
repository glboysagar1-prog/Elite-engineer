/**
 * GitHub API Response Types
 * 
 * Raw response types from GitHub API (via Octokit).
 * These are normalized to our internal types.
 */

// ============================================================================
// Repository API Types
// ============================================================================

export interface GitHubAPIRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    type: string;
  };
  private: boolean;
  description: string | null;
  fork: boolean;
  language: string | null;
  languages_url: string;
  topics: string[];
  stargazers_count: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

// ============================================================================
// Pull Request API Types
// ============================================================================

export interface GitHubAPIPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  merged_at: string | null;
  mergeable: boolean | null;
  user: {
    login: string;
  };
  merged_by: {
    login: string;
  } | null;
  base: {
    repo: {
      name: string;
      full_name: string;
      fork: boolean;
    };
    ref: string;
  };
  head: {
    repo: {
      name: string;
      full_name: string;
      fork: boolean;
    } | null;
    ref: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  review_comments: number;
  comments: number;
}

export interface GitHubAPIPullRequestFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
}

// ============================================================================
// Review API Types
// ============================================================================

export interface GitHubAPIReview {
  id: number;
  user: {
    login: string;
  };
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at: string;
  commit_id: string;
}

export interface GitHubAPIReviewComment {
  id: number;
  user: {
    login: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
  path: string;
  diff_hunk: string;
}

// ============================================================================
// Issue API Types
// ============================================================================

export interface GitHubAPIIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: {
    login: string;
  };
  labels: Array<{
    name: string;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: {
    url: string;
  };
}

// ============================================================================
// Commit API Types
// ============================================================================

export interface GitHubAPICommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: Array<{
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

// ============================================================================
// Rate Limit Types
// ============================================================================

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}

export interface RateLimitStatus {
  core: GitHubRateLimit;
  search: GitHubRateLimit;
  graphql: GitHubRateLimit;
}
