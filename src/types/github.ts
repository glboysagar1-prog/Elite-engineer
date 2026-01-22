/**
 * GitHub Data Types
 * 
 * Core types for GitHub activity data used across all score calculations.
 */

// ============================================================================
// Pull Request Types
// ============================================================================

export interface MergedPR {
  id: string;
  repository: string;
  mergedAt: Date;
  mergedBy: string;
  author: string;
  reviewCommentsReceived: number;
  reviewRounds: number;
  filesChanged: number;
  directoriesTouched: number;
  isMaintainerMerge: boolean;
  isFork: boolean;
  timeToMerge: number; // hours
}

export interface CodeReview {
  id: string;
  repository: string;
  prId: string;
  reviewedAt: Date;
  reviewer: string;
  reviewee: string;
  commentCount: number;
}

export interface PRAnalysis {
  id: string;
  repository: string;
  title: string;
  body: string | null;
  mergedAt: Date;
  filesChanged: FileChangeAnalysis[];
  languages: Set<string>;
  directories: Set<string>;
  isInfrastructureChange: boolean;
  isAPIC change: boolean;
  isUIChange: boolean;
  isDatabaseChange: boolean;
  isConfigChange: boolean;
  isTestChange: boolean;
  isDocumentationChange: boolean;
}

// ============================================================================
// Issue Types
// ============================================================================

export interface Issue {
  id: string;
  repository: string;
  openedAt: Date;
  author: string;
  ledToMergedPR: boolean;
  commentCount: number;
}

export interface IssueAnalysis {
  id: string;
  repository: string;
  title: string;
  body: string | null;
  labels: string[];
  isBug: boolean;
  isFeature: boolean;
  isInfrastructure: boolean;
  isSecurity: boolean;
}

// ============================================================================
// Repository Types
// ============================================================================

export interface RepositoryContribution {
  repository: string;
  mergedPRCount: number;
  isFork: boolean;
  contributorCount: number;
  maintainerCount: number;
}

export interface RepositoryAnalysis {
  repository: string;
  isFork: boolean;
  primaryLanguage: string;
  languages: Map<string, number>; // Language -> percentage
  topics: string[];
  description: string | null;
  stars: number;
  isArchived: boolean;
}

// ============================================================================
// File Change Types
// ============================================================================

export interface FileChangeAnalysis {
  filePath: string;
  fileExtension: string;
  changeType: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesDeleted: number;
  directory: string;
}

// ============================================================================
// Account Types
// ============================================================================

export interface GitHubAccount {
  username: string;
  createdAt: Date;
  publicRepos: number;
  followers: number;
  following: number;
  bio: string | null;
  location: string | null;
  company: string | null;
  website: string | null;
  email: string | null;
  isVerified: boolean;
}

// ============================================================================
// Activity Aggregation Types
// ============================================================================

export interface GitHubActivity {
  mergedPRs: MergedPR[];
  reviewsGiven: CodeReview[];
  reviewsReceived: CodeReview[];
  issues: Issue[];
  repositories: RepositoryContribution[];
  activitySpan: {
    firstPRDate: Date;
    lastPRDate: Date;
  };
}

export interface ContributionPattern {
  // PR patterns
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  closedPRs: number;
  selfMergedPRs: number;
  
  // Fork vs original repo contributions
  forkPRs: number;
  originalRepoPRs: number;
  forkOnlyRepos: string[]; // Repos where all PRs are to forks
  originalRepoContributions: number;
  
  // Temporal patterns
  firstContributionDate: Date | null;
  lastContributionDate: Date | null;
  contributionDays: number; // Days with at least one contribution
  contributionMonths: number; // Months with at least one contribution
  averagePRsPerDay: number;
  maxPRsInSingleDay: number;
  
  // Repository patterns
  uniqueRepositories: number;
  repositoriesWithMultiplePRs: number;
  repositoriesWithMaintainerInteraction: number;
  
  // Review patterns
  reviewsGiven: number;
  reviewsReceived: number;
  maintainerReviews: number; // Reviews from repo maintainers
  
  // Issue patterns
  issuesOpened: number;
  issuesClosed: number;
  issuesWithPRs: number; // Issues that led to PRs
  
  // Commit patterns (for pattern detection, not counting)
  commitMessagePatterns: Map<string, number>; // Pattern -> count
  commitTimePatterns: number[]; // Hour of day for commits
  identicalCommitMessages: number; // Count of duplicate commit messages
  
  // Collaboration signals
  uniqueCollaborators: number;
  maintainerInteractions: number;
  crossRepositoryCollaborations: number;
}

export interface EngineerActivity {
  prs: PRAnalysis[];
  issues: IssueAnalysis[];
  repositories: RepositoryAnalysis[];
  codeReviews: {
    repository: string;
    prId: string;
    reviewedFiles: string[];
    languages: Set<string>;
  }[];
}
