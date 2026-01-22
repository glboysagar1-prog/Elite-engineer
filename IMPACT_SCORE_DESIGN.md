# Wecraft Impact Score Design

## Overview

The Impact Score quantifies an engineer's technical impact through public GitHub activity, focusing on merged contributions, collaboration quality, and sustained engagement while filtering out gaming behaviors.

---

## 1. Sub-Components

The Impact Score is composed of four weighted sub-components:

### 1.1 PR Impact Score (40% weight)
Measures the quality and significance of merged pull requests.

### 1.2 Collaboration Score (30% weight)
Evaluates cross-repository contributions and team interaction patterns.

### 1.3 Longevity Score (20% weight)
Assesses sustained, consistent contribution patterns over time.

### 1.4 Quality Signal Score (10% weight)
Captures code review engagement, maintainer trust, and contribution depth.

---

## 2. Signals Used

### 2.1 PR Impact Score Signals

- **Merged PR count** (normalized by time window)
  - Only counts PRs merged into main/master/primary branches
  - Excludes self-merged PRs (author === merger)
  - Time-decay weighting (recent PRs weighted higher)

- **PR review engagement**
  - Number of review comments received on PRs
  - Number of review comments given to others
  - Ratio of reviews received to PRs opened (higher = more collaborative)

- **PR acceptance rate**
  - Percentage of opened PRs that get merged
  - Penalizes PRs that are closed without merge

- **Repository diversity**
  - Number of distinct repositories with merged PRs
  - Rewards contributing across multiple projects

- **Maintainer interaction**
  - PRs merged by repository maintainers (not self-merged)
  - Maintainer comment engagement on PRs

### 2.2 Collaboration Score Signals

- **Cross-repository contributions**
  - Number of distinct repositories contributed to
  - Distribution across repository types (libraries, tools, applications)

- **Review reciprocity**
  - Reviews given to others vs. reviews received
  - Balanced engagement indicates active collaboration

- **Issue engagement**
  - Issues opened that lead to merged PRs
  - Comments on issues that result in contributions

- **Team repository patterns**
  - Contributions to repositories with multiple active contributors
  - Participation in collaborative projects vs. solo projects

### 2.3 Longevity Score Signals

- **Activity span**
  - Time between first and most recent merged PR
  - Rewards sustained engagement over years, not bursts

- **Consistency metric**
  - Regularity of contributions (not daily streaks, but sustained presence)
  - Months with at least one merged PR

- **Temporal distribution**
  - Contributions spread across multiple years
  - Avoids rewarding short-term bursts

### 2.4 Quality Signal Score Signals

- **Code review depth**
  - Average number of review rounds before merge
  - PRs that go through multiple iterations show quality

- **Maintainer trust signals**
  - PRs merged without significant changes requested
  - Maintainer follow-up contributions (maintainers continue engaging)

- **Contribution complexity**
  - PRs that touch multiple files (indicates system understanding)
  - PRs that span multiple directories/modules

- **Anti-spam indicators**
  - PR size distribution (very small PRs may indicate spam)
  - Time between PRs (too frequent may indicate automation)
  - Fork contribution ratio (contributions to forks vs. original repos)

---

## 3. Signals Excluded and Why

### 3.1 Raw Commit Count
**Excluded because:**
- Easily gamed through automated commits, merge commits, or trivial changes
- Doesn't distinguish between meaningful contributions and noise
- High commit count doesn't correlate with impact or code quality
- Encourages quantity over quality

### 3.2 Lines of Code (LOC)
**Excluded because:**
- LOC is a vanity metric that doesn't measure impact
- Can be inflated through formatting, generated code, or unnecessary complexity
- Small, well-designed changes often have more impact than large refactors
- Rewards verbosity over elegance

### 3.3 Streaks (Daily/Weekly)
**Excluded because:**
- Encourages unhealthy work patterns and burnout
- Rewards consistency over quality
- Can be gamed through trivial commits
- Doesn't align with sustainable engineering practices
- Streaks don't correlate with technical impact

### 3.4 Stars Received
**Excluded because:**
- Social proof metric, not technical proof
- Influenced by marketing, timing, and network effects
- Doesn't reflect code quality or contribution impact
- Can be gamed through self-promotion

### 3.5 Follower Count
**Excluded because:**
- Pure social signal with no technical relevance
- Influenced by factors outside code quality
- Doesn't indicate contribution impact

### 3.6 Fork Count
**Excluded because:**
- Social engagement metric, not technical contribution
- Doesn't show actual code changes or impact
- Can be inflated without meaningful contributions

### 3.7 Raw PR Count (Unmerged)
**Excluded because:**
- Unmerged PRs don't demonstrate impact
- Need to focus on accepted contributions
- Separates signal (merged work) from noise (rejected work)

### 3.8 Self-Reported Skills/Tags
**Excluded because:**
- Violates core Wecraft principle of proof-of-work only
- No verification mechanism
- Can be inflated or inaccurate

---

## 4. TypeScript Function Signature

```typescript
/**
 * Calculates the Impact Score for an engineer based on their public GitHub activity.
 * 
 * @param githubActivity - Aggregated GitHub activity data for the engineer
 * @param config - Optional configuration to override default weights and parameters
 * @returns ImpactScoreResult containing the total score and component breakdowns
 */
function calculateImpactScore(
  githubActivity: GitHubActivity,
  config?: ImpactScoreConfig
): ImpactScoreResult;

// Type Definitions

interface GitHubActivity {
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

interface MergedPR {
  id: string;
  repository: string;
  mergedAt: Date;
  mergedBy: string; // GitHub username
  author: string; // GitHub username
  reviewCommentsReceived: number;
  reviewRounds: number;
  filesChanged: number;
  directoriesTouched: number;
  isMaintainerMerge: boolean; // merged by repo maintainer
  isFork: boolean; // PR to a forked repository
  timeToMerge: number; // hours
}

interface CodeReview {
  id: string;
  repository: string;
  prId: string;
  reviewedAt: Date;
  reviewer: string;
  reviewee: string;
  commentCount: number;
}

interface Issue {
  id: string;
  repository: string;
  openedAt: Date;
  author: string;
  ledToMergedPR: boolean;
  commentCount: number;
}

interface RepositoryContribution {
  repository: string;
  mergedPRCount: number;
  isFork: boolean;
  contributorCount: number; // active contributors in repo
  maintainerCount: number;
}

interface ImpactScoreConfig {
  weights?: {
    prImpact?: number; // default 0.4
    collaboration?: number; // default 0.3
    longevity?: number; // default 0.2
    quality?: number; // default 0.1
  };
  timeDecayFactor?: number; // default 0.95 (per month)
  minPRSize?: number; // default 1 file (filters spam)
  maxPRFrequency?: number; // default 10 PRs per day (anti-spam)
  activityWindowMonths?: number; // default 24 months
  selfMergePenalty?: number; // default 0.0 (self-merged PRs excluded entirely)
}

interface ImpactScoreResult {
  totalScore: number; // 0-100 normalized score
  components: {
    prImpact: {
      score: number;
      breakdown: {
        mergedPRCount: number;
        reviewEngagement: number;
        acceptanceRate: number;
        repoDiversity: number;
        maintainerTrust: number;
      };
    };
    collaboration: {
      score: number;
      breakdown: {
        crossRepoContributions: number;
        reviewReciprocity: number;
        issueEngagement: number;
        teamParticipation: number;
      };
    };
    longevity: {
      score: number;
      breakdown: {
        activitySpan: number; // months
        consistency: number;
        temporalDistribution: number;
      };
    };
    quality: {
      score: number;
      breakdown: {
        reviewDepth: number;
        maintainerTrust: number;
        contributionComplexity: number;
        antiSpamScore: number;
      };
    };
  };
  signals: {
    totalMergedPRs: number;
    selfMergedPRs: number; // excluded from score
    spamPRs: number; // filtered out
    activeRepositories: number;
    activitySpanMonths: number;
  };
  explainability: {
    topContributingRepos: Array<{ repo: string; prCount: number; score: number }>;
    recentActivity: Array<{ date: Date; event: string; impact: number }>;
    penalties: Array<{ reason: string; count: number; impact: number }>;
  };
}
```

---

## Implementation Notes

### Anti-Spam Mechanisms

1. **Self-merge detection**: PRs where `author === mergedBy` are excluded entirely
2. **Fork penalty**: Contributions to forks are weighted lower than original repositories
3. **Frequency limits**: Excessive PR frequency triggers spam detection
4. **Size filters**: Trivial PRs (single character changes, whitespace-only) are filtered
5. **Pattern detection**: Automated commit patterns (identical messages, timestamps) are flagged

### Normalization

- All component scores are normalized to 0-100 scale
- Time-decay applied to recent contributions (exponential decay)
- Repository diversity normalized by log scale (diminishing returns)
- Cross-component normalization ensures balanced weighting

### Explainability

- Every score includes breakdown of contributing factors
- Top repositories and recent activity are tracked
- Penalties and exclusions are explicitly documented
- Score changes over time can be traced to specific events
