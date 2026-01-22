# Inngest Job Flow Design

## Overview

Wecraft uses Inngest for reliable, idempotent background job processing. All jobs are designed to be retry-safe and idempotent.

## Job Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. engineer/analyze (Main Entry Point)                     │
│    - Triggered by: API call, scheduled job, webhook        │
│    - Idempotent by: username                                │
│    - Retries: 3                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check Cache (Idempotent)                                 │
│    - Same username = same result                            │
│    - Returns cached if < 24 hours old                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. github/fetch (GitHub Data Fetch)                        │
│    - Triggered by: engineer/analyze                         │
│    - Idempotent by: username                                │
│    - Retries: 5 (external API)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Fetch Steps (All Idempotent)                            │
│    - Fetch repositories (same username = same repos)        │
│    - Fetch activity data                                    │
│    - Fetch account data                                     │
│    - Build contribution pattern                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. github/fetch.complete (Event)                           │
│    - Signals completion to parent job                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. scores/compute (Score Computation)                      │
│    - Triggered by: engineer/analyze                        │
│    - Idempotent by: username                                │
│    - Retries: 2 (deterministic computation)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Compute Steps (All Idempotent)                          │
│    - Compute Impact Score (same activity = same score)     │
│    - Compute Trust Score (same inputs = same score)        │
│    - Compute Compatibility Score                           │
│    - Compute Recruiter Match Score                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Store Results (Idempotent Upsert)                       │
│    - Same username = same record (upsert)                  │
│    - Stores all scores and activity data                   │
└─────────────────────────────────────────────────────────────┘
```

## Event Triggers

### 1. engineer/analyze
**Triggered by:**
- API endpoint: `POST /api/engineers/:username/analyze`
- Scheduled job: Daily refresh for active engineers
- Webhook: GitHub webhook for new contributions
- Manual trigger: Admin dashboard

**Event Data:**
```typescript
{
  name: 'engineer/analyze',
  data: {
    username: string;
    roleQuery?: RoleQuery; // Optional role for compatibility score
    forceRefresh?: boolean; // Force refresh even if cached
  }
}
```

### 2. github/fetch
**Triggered by:**
- `engineer/analyze` job (step 2)
- Manual retry for failed fetches

**Event Data:**
```typescript
{
  name: 'github/fetch',
  data: {
    username: string;
    retryCount?: number;
  }
}
```

### 3. scores/compute
**Triggered by:**
- `engineer/analyze` job (step 4)
- Manual recomputation

**Event Data:**
```typescript
{
  name: 'scores/compute',
  data: {
    username: string;
    githubActivity: GitHubActivity;
    account: GitHubAccount;
    contributionPattern: ContributionPattern;
    roleQuery?: RoleQuery;
  }
}
```

### 4. github/fetch.complete
**Triggered by:**
- `github/fetch` job completion

**Event Data:**
```typescript
{
  name: 'github/fetch.complete',
  data: {
    username: string;
    activity: GitHubActivity;
    account: GitHubAccount;
    contributionPattern: ContributionPattern;
  }
}
```

## Idempotency Strategy

### By Username
All jobs use `idempotency: 'event.data.username'` to ensure:
- Same username = same execution result
- Retries don't duplicate work
- Concurrent requests are deduplicated

### Deterministic Functions
All score calculations are deterministic:
- Same inputs = same outputs
- No randomness or time-dependent logic
- Pure functions

### Upsert Operations
Database operations use upsert:
- Same username = same record
- Updates instead of creates on retry
- No duplicate records

## Retry Strategy

### engineer/analyze
- **Retries:** 3
- **Reason:** Main orchestration job, should be resilient

### github/fetch
- **Retries:** 5
- **Reason:** External API, network issues, rate limits
- **Backoff:** Exponential

### scores/compute
- **Retries:** 2
- **Reason:** Deterministic computation, fewer failures expected

## Error Handling

1. **Transient Errors:** Retry with exponential backoff
2. **Permanent Errors:** Log and fail gracefully
3. **Rate Limits:** Wait and retry
4. **Missing Data:** Return partial results if possible

## Timeouts

- **github/fetch:** 10 minutes (large data fetches)
- **scores/compute:** 5 minutes (computation)
- **engineer/analyze:** 15 minutes (total flow)
