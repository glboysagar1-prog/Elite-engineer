# Pseudocode Structure

## Main Job: Engineer Analysis

```pseudocode
FUNCTION engineer_analysis_job(event):
  username = event.data.username
  roleQuery = event.data.roleQuery
  forceRefresh = event.data.forceRefresh
  
  // Step 1: Check cache (idempotent)
  shouldFetch = CHECK_CACHE(username, forceRefresh)
  
  IF NOT shouldFetch:
    RETURN GET_CACHED_RESULTS(username)
  END IF
  
  // Step 2: Trigger GitHub fetch
  githubFetchEvent = SEND_EVENT('github/fetch', {
    username: username
  })
  
  // Step 3: Wait for GitHub fetch completion
  activity = WAIT_FOR_EVENT('github/fetch.complete', {
    timeout: '10m',
    match: username
  })
  
  IF activity IS NULL:
    THROW_ERROR('GitHub fetch timed out')
  END IF
  
  // Step 4: Trigger score computation
  scoresEvent = SEND_EVENT('scores/compute', {
    username: username,
    githubActivity: activity.data.activity,
    account: activity.data.account,
    contributionPattern: activity.data.contributionPattern,
    roleQuery: roleQuery
  })
  
  // Step 5: Store results (idempotent upsert)
  STORE_RESULTS(username, {
    activity: activity.data.activity,
    scores: scoresEvent.data,
    computedAt: NOW()
  })
  
  RETURN {
    username: username,
    scores: scoresEvent.data,
    computedAt: NOW()
  }
END FUNCTION
```

## GitHub Fetch Job

```pseudocode
FUNCTION github_fetch_job(event):
  username = event.data.username
  retryCount = event.data.retryCount OR 0
  
  // Step 1: Initialize Octokit (idempotent)
  octokit = INIT_OCTOKIT(process.env.GITHUB_TOKEN)
  
  // Step 2: Fetch repositories (idempotent)
  analyzer = CREATE_GITHUB_ANALYZER(octokit, username)
  repos = analyzer.FETCH_REPOSITORIES()
  
  // Step 3: Fetch activity data (idempotent)
  activity = analyzer.FETCH_ALL_USER_DATA()
  
  // Step 4: Fetch account data (idempotent)
  accountData = octokit.USERS.GET_BY_USERNAME(username)
  account = NORMALIZE_ACCOUNT(accountData)
  
  // Step 5: Build contribution pattern (idempotent)
  contributionPattern = BUILD_CONTRIBUTION_PATTERN(activity, account)
  
  // Step 6: Emit completion event
  SEND_EVENT('github/fetch.complete', {
    username: username,
    activity: activity,
    account: account,
    contributionPattern: contributionPattern
  })
  
  RETURN {
    username: username,
    activity: activity,
    account: account,
    contributionPattern: contributionPattern
  }
END FUNCTION
```

## Score Computation Job

```pseudocode
FUNCTION score_computation_job(event):
  username = event.data.username
  githubActivity = event.data.githubActivity
  account = event.data.account
  contributionPattern = event.data.contributionPattern
  roleQuery = event.data.roleQuery OR { role: 'backend' }
  
  // Step 1: Compute Impact Score (idempotent)
  impactScore = CALCULATE_IMPACT_SCORE(githubActivity)
  
  // Step 2: Compute Trust Score (idempotent)
  trustScore = CALCULATE_TRUST_SCORE(account, contributionPattern)
  
  // Step 3: Compute Compatibility Score (idempotent)
  compatibilityScore = CALCULATE_COMPATIBILITY_SCORE(
    githubActivity,
    roleQuery
  )
  
  // Step 4: Compute Recruiter Match Score (idempotent)
  matchScore = CALCULATE_RECRUITER_MATCH_SCORE(
    trustScore,
    compatibilityScore,
    impactScore
  )
  
  RETURN {
    username: username,
    impactScore: impactScore,
    trustScore: trustScore,
    compatibilityScore: compatibilityScore,
    matchScore: matchScore,
    computedAt: NOW()
  }
END FUNCTION
```

## Helper Functions

```pseudocode
FUNCTION CHECK_CACHE(username, forceRefresh):
  IF forceRefresh:
    RETURN TRUE
  END IF
  
  cached = DATABASE.GET(username)
  
  IF cached IS NULL:
    RETURN TRUE
  END IF
  
  age = NOW() - cached.computedAt
  maxAge = 24 HOURS
  
  RETURN age > maxAge
END FUNCTION

FUNCTION GET_CACHED_RESULTS(username):
  RETURN DATABASE.GET(username)
END FUNCTION

FUNCTION STORE_RESULTS(username, results):
  // Idempotent upsert - same username = same record
  DATABASE.UPSERT(username, results)
END FUNCTION

FUNCTION NORMALIZE_ACCOUNT(apiData):
  RETURN {
    username: apiData.login,
    createdAt: PARSE_DATE(apiData.created_at),
    publicRepos: apiData.public_repos,
    followers: apiData.followers,
    following: apiData.following,
    bio: apiData.bio,
    location: apiData.location,
    company: apiData.company,
    website: apiData.blog,
    email: apiData.email,
    isVerified: FALSE
  }
END FUNCTION

FUNCTION BUILD_CONTRIBUTION_PATTERN(activity, account):
  RETURN {
    totalPRs: COUNT(activity.mergedPRs),
    mergedPRs: COUNT(activity.mergedPRs),
    selfMergedPRs: COUNT(activity.mergedPRs WHERE author == mergedBy),
    forkPRs: COUNT(activity.mergedPRs WHERE isFork == TRUE),
    originalRepoPRs: COUNT(activity.mergedPRs WHERE isFork == FALSE),
    firstContributionDate: activity.activitySpan.firstPRDate,
    lastContributionDate: activity.activitySpan.lastPRDate,
    uniqueRepositories: COUNT(activity.repositories),
    reviewsGiven: COUNT(activity.reviewsGiven),
    reviewsReceived: COUNT(activity.reviewsReceived),
    issuesOpened: COUNT(activity.issues),
    // ... other fields
  }
END FUNCTION
```

## Idempotency Guarantees

```pseudocode
// All functions are idempotent:

FUNCTION CHECK_CACHE(username, forceRefresh):
  // Same username + forceRefresh = same result
  // No side effects
END FUNCTION

FUNCTION FETCH_REPOSITORIES(username):
  // Same username = same repositories
  // External API call, but result is deterministic
END FUNCTION

FUNCTION CALCULATE_IMPACT_SCORE(activity):
  // Same activity = same score
  // Pure function, no side effects
END FUNCTION

FUNCTION STORE_RESULTS(username, results):
  // Same username = same record (upsert)
  // Idempotent database operation
END FUNCTION
```

## Retry Safety

```pseudocode
// All operations are retry-safe:

TRY:
  results = FETCH_GITHUB_DATA(username)
  STORE_RESULTS(username, results)
CATCH error:
  // Retry is safe because:
  // 1. FETCH_GITHUB_DATA is idempotent (same username = same data)
  // 2. STORE_RESULTS is idempotent (upsert, not insert)
  // 3. No partial state that needs cleanup
  RETRY()
END TRY
```

## Error Handling

```pseudocode
FUNCTION github_fetch_job(event):
  TRY:
    activity = FETCH_ACTIVITY(username)
  CATCH RateLimitError:
    WAIT_FOR_RATE_LIMIT_RESET()
    RETRY()
  CATCH NotFoundError:
    // User doesn't exist or has no public repos
    RETURN {
      username: username,
      activity: EMPTY_ACTIVITY(),
      error: 'User not found or no public repositories'
    }
  CATCH NetworkError:
    // Transient error, retry
    RETRY()
  CATCH PermanentError:
    // Log and fail
    LOG_ERROR(error)
    THROW error
  END TRY
END FUNCTION
```
