# GitHub Analyzer Documentation

## Overview

The GitHub Analyzer fetches and normalizes public GitHub data using Octokit. It handles rate limiting, batches requests, and normalizes data to match our internal types.

## Data Models

### Raw API Types (`src/types/github-api.ts`)

- `GitHubAPIRepository` - Raw repository data from GitHub API
- `GitHubAPIPullRequest` - Raw PR data
- `GitHubAPIReview` - Raw review data
- `GitHubAPIIssue` - Raw issue data
- `GitHubRateLimit` - Rate limit status

### Normalized Types (`src/types/github.ts`)

- `MergedPR` - Normalized merged pull request
- `CodeReview` - Normalized code review
- `Issue` - Normalized issue
- `RepositoryContribution` - Normalized repository contribution
- `GitHubActivity` - Complete normalized activity data

## Fetch Strategy

### 1. Rate Limit Management

- **RateLimitManager**: Monitors and manages API rate limits
- **Automatic Pausing**: Pauses when remaining requests < buffer threshold
- **Wait on Reset**: Waits until rate limit resets if needed

### 2. Batch Processing

- **Repository Batching**: Processes repositories in batches (default: 5)
- **Concurrent Requests**: Limits concurrent requests (default: 3)
- **Sequential Batches**: Waits between batches to respect rate limits

### 3. Data Fetching Flow

```
1. Fetch all repositories
   ↓
2. For each repository (in batches):
   - Fetch merged PRs
   - For each PR:
     - Fetch files changed
     - Fetch reviews
     - Fetch review comments
   - Fetch issues
   - Fetch repository languages
   ↓
3. Normalize all data
   ↓
4. Return GitHubActivity
```

## Normalized Event Structure

### Pull Request Normalization

```typescript
GitHubAPIPullRequest → MergedPR
- Extracts: id, repository, dates, author, merger
- Calculates: directories touched, review rounds, time to merge
- Determines: isMaintainerMerge, isFork
- Aggregates: review comments count
```

### Review Normalization

```typescript
GitHubAPIReview → CodeReview
- Separates: reviewsGiven vs reviewsReceived
- Extracts: reviewer, reviewee, repository, PR ID
- Counts: comment count
```

### Issue Normalization

```typescript
GitHubAPIIssue → Issue
- Filters: Excludes PRs (issues with pull_request field)
- Extracts: id, repository, author, dates
- Tracks: ledToMergedPR (requires cross-referencing)
```

### Repository Normalization

```typescript
GitHubAPIRepository → RepositoryContribution
- Aggregates: merged PR count
- Identifies: isFork
- Calculates: contributor count, maintainer count
```

## Usage

```typescript
import { Octokit } from '@octokit/rest';
import { createGitHubAnalyzer } from './utils/github-analyzer';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const analyzer = createGitHubAnalyzer(octokit, 'username', {
  rateLimitBuffer: 10,
  maxConcurrentRequests: 3,
});

const activity = await analyzer.fetchAllUserData();
```

## Rate Limit Safety

1. **Pre-request Check**: Checks rate limit before each request
2. **Automatic Pausing**: Pauses when buffer threshold reached
3. **Reset Waiting**: Waits until rate limit resets if needed
4. **Batch Delays**: Adds delays between batches
5. **Error Handling**: Handles 404s gracefully (missing repos/PRs)

## Configuration

- `rateLimitBuffer`: Minimum remaining requests before pausing (default: 10)
- `maxConcurrentRequests`: Max concurrent requests (default: 3)
- `retryAttempts`: Number of retry attempts (default: 3)
- `retryDelay`: Delay between retries in ms (default: 1000)
