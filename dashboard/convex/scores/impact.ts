/**
 * Wecraft Impact Score Calculator
 * 
 * Calculates engineer impact based on public GitHub activity:
 * - Rewards merged PRs, collaboration, and longevity
 * - Penalizes spam, forks, and self-merged PRs
 * - Excludes raw commit count, LOC, and streaks
 */

import type {
  MergedPR,
  CodeReview,
  Issue,
  RepositoryContribution,
  GitHubActivity,
} from '../types/github';

import type {
  ImpactScoreConfig,
  ComponentBreakdown,
  CollaborationBreakdown,
  LongevityBreakdown,
  QualityBreakdown,
  ImpactScoreResult,
} from '../types/scores';

const DEFAULT_CONFIG: Required<ImpactScoreConfig> = {
  weights: {
    prImpact: 0.4,
    collaboration: 0.3,
    longevity: 0.2,
    quality: 0.1,
  },
  timeDecayFactor: 0.95,
  minPRSize: 1,
  maxPRFrequency: 10,
  activityWindowMonths: 24,
  selfMergePenalty: 0.0,
};

/**
 * Filters out spam PRs based on size, frequency, and patterns
 */
function filterSpamPRs(prs: MergedPR[], config: Required<ImpactScoreConfig>): {
  valid: MergedPR[];
  spam: MergedPR[];
} {
  const valid: MergedPR[] = [];
  const spam: MergedPR[] = [];

  // Group PRs by day to detect frequency spam
  const prsByDay = new Map<string, MergedPR[]>();
  for (const pr of prs) {
    const dayKey = pr.mergedAt.toISOString().split('T')[0];
    if (!prsByDay.has(dayKey)) {
      prsByDay.set(dayKey, []);
    }
    prsByDay.get(dayKey)!.push(pr);
  }

  for (const pr of prs) {
    // Filter by minimum size
    if (pr.filesChanged < config.minPRSize) {
      spam.push(pr);
      continue;
    }

    // Filter by frequency (too many PRs in one day)
    const dayKey = pr.mergedAt.toISOString().split('T')[0];
    const dayPRs = prsByDay.get(dayKey) || [];
    if (dayPRs.length > config.maxPRFrequency) {
      spam.push(pr);
      continue;
    }

    valid.push(pr);
  }

  return { valid, spam };
}

/**
 * Filters out self-merged PRs
 */
function filterSelfMergedPRs(prs: MergedPR[]): {
  valid: MergedPR[];
  selfMerged: MergedPR[];
} {
  const valid: MergedPR[] = [];
  const selfMerged: MergedPR[] = [];

  for (const pr of prs) {
    if (pr.author === pr.mergedBy) {
      selfMerged.push(pr);
    } else {
      valid.push(pr);
    }
  }

  return { valid, selfMerged };
}

/**
 * Applies time decay to PRs (recent PRs weighted higher)
 */
function applyTimeDecay(pr: MergedPR, referenceDate: Date, decayFactor: number): number {
  const monthsAgo = (referenceDate.getTime() - pr.mergedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return Math.pow(decayFactor, monthsAgo);
}

/**
 * Calculates PR Impact Score component
 */
function calculatePRImpactScore(
  prs: MergedPR[],
  reviewsReceived: CodeReview[],
  config: Required<ImpactScoreConfig>
): { score: number; breakdown: ComponentBreakdown } {
  if (prs.length === 0) {
    return {
      score: 0,
      breakdown: {
        mergedPRCount: 0,
        reviewEngagement: 0,
        acceptanceRate: 0,
        repoDiversity: 0,
        maintainerTrust: 0,
      },
    };
  }

  const now = new Date();
  const referenceDate = now;

  // Merged PR count with time decay
  const prCountScore = prs.reduce((sum, pr) => {
    const decay = applyTimeDecay(pr, referenceDate, config.timeDecayFactor);
    return sum + decay;
  }, 0);
  const normalizedPRCount = Math.min(prCountScore / 10, 1) * 100; // Normalize to 0-100

  // Review engagement (comments received per PR)
  const totalReviewComments = reviewsReceived.reduce((sum, review) => sum + review.commentCount, 0);
  const avgReviewComments = prs.length > 0 ? totalReviewComments / prs.length : 0;
  const reviewEngagement = Math.min(avgReviewComments / 5, 1) * 100; // Normalize to 0-100

  // Acceptance rate (assumed 100% since we only count merged PRs)
  const acceptanceRate = 100;

  // Repository diversity (log scale for diminishing returns)
  const uniqueRepos = new Set(prs.map(pr => pr.repository)).size;
  const repoDiversity = Math.min(Math.log10(uniqueRepos + 1) / Math.log10(50), 1) * 100;

  // Maintainer trust (percentage of PRs merged by maintainers)
  const maintainerMerges = prs.filter(pr => pr.isMaintainerMerge).length;
  const maintainerTrust = (maintainerMerges / prs.length) * 100;

  const score = (
    normalizedPRCount * 0.3 +
    reviewEngagement * 0.25 +
    acceptanceRate * 0.15 +
    repoDiversity * 0.15 +
    maintainerTrust * 0.15
  );

  return {
    score: Math.min(score, 100),
    breakdown: {
      mergedPRCount: normalizedPRCount,
      reviewEngagement,
      acceptanceRate,
      repoDiversity,
      maintainerTrust,
    },
  };
}

/**
 * Calculates Collaboration Score component
 */
function calculateCollaborationScore(
  prs: MergedPR[],
  reviewsGiven: CodeReview[],
  reviewsReceived: CodeReview[],
  issues: Issue[],
  repositories: RepositoryContribution[]
): { score: number; breakdown: CollaborationBreakdown } {
  if (prs.length === 0) {
    return {
      score: 0,
      breakdown: {
        crossRepoContributions: 0,
        reviewReciprocity: 0,
        issueEngagement: 0,
        teamParticipation: 0,
      },
    };
  }

  // Cross-repository contributions
  const uniqueRepos = new Set(prs.map(pr => pr.repository)).size;
  const crossRepoContributions = Math.min(Math.log10(uniqueRepos + 1) / Math.log10(20), 1) * 100;

  // Review reciprocity (balance between giving and receiving reviews)
  const reviewsGivenCount = reviewsGiven.length;
  const reviewsReceivedCount = reviewsReceived.length;
  const totalReviews = reviewsGivenCount + reviewsReceivedCount;
  const reciprocity = totalReviews > 0
    ? (Math.min(reviewsGivenCount, reviewsReceivedCount) / Math.max(reviewsGivenCount, reviewsReceivedCount)) * 100
    : 0;

  // Issue engagement (issues that led to merged PRs)
  const issuesLeadingToPRs = issues.filter(issue => issue.ledToMergedPR).length;
  const issueEngagement = issues.length > 0
    ? (issuesLeadingToPRs / issues.length) * 100
    : 0;

  // Team participation (contributions to repos with multiple contributors)
  const teamRepos = repositories.filter(repo => repo.contributorCount > 1).length;
  const teamParticipation = repositories.length > 0
    ? (teamRepos / repositories.length) * 100
    : 0;

  const score = (
    crossRepoContributions * 0.3 +
    reciprocity * 0.3 +
    issueEngagement * 0.2 +
    teamParticipation * 0.2
  );

  return {
    score: Math.min(score, 100),
    breakdown: {
      crossRepoContributions,
      reviewReciprocity: reciprocity,
      issueEngagement,
      teamParticipation,
    },
  };
}

/**
 * Calculates Longevity Score component
 */
function calculateLongevityScore(
  prs: MergedPR[],
  activitySpan: { firstPRDate: Date; lastPRDate: Date }
): { score: number; breakdown: LongevityBreakdown } {
  if (prs.length === 0) {
    return {
      score: 0,
      breakdown: {
        activitySpan: 0,
        consistency: 0,
        temporalDistribution: 0,
      },
    };
  }

  // Activity span in months
  const spanMonths = (activitySpan.lastPRDate.getTime() - activitySpan.firstPRDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const activitySpanScore = Math.min(spanMonths / 24, 1) * 100; // 24 months = 100

  // Consistency (months with at least one merged PR)
  const monthsWithPRs = new Set<string>();
  for (const pr of prs) {
    const monthKey = `${pr.mergedAt.getFullYear()}-${pr.mergedAt.getMonth()}`;
    monthsWithPRs.add(monthKey);
  }
  const consistency = spanMonths > 0
    ? (monthsWithPRs.size / Math.max(spanMonths, 1)) * 100
    : 0;

  // Temporal distribution (contributions across multiple years)
  const years = new Set(prs.map(pr => pr.mergedAt.getFullYear())).size;
  const temporalDistribution = Math.min(years / 3, 1) * 100; // 3+ years = 100

  const score = (
    activitySpanScore * 0.4 +
    consistency * 0.35 +
    temporalDistribution * 0.25
  );

  return {
    score: Math.min(score, 100),
    breakdown: {
      activitySpan: spanMonths,
      consistency,
      temporalDistribution,
    },
  };
}

/**
 * Calculates Quality Signal Score component
 */
function calculateQualityScore(
  prs: MergedPR[],
  _reviewsReceived: CodeReview[]
): { score: number; breakdown: QualityBreakdown } {
  if (prs.length === 0) {
    return {
      score: 0,
      breakdown: {
        reviewDepth: 0,
        maintainerTrust: 0,
        contributionComplexity: 0,
        antiSpamScore: 0,
      },
    };
  }

  // Review depth (average review rounds)
  const avgReviewRounds = prs.reduce((sum, pr) => sum + pr.reviewRounds, 0) / prs.length;
  const reviewDepth = Math.min(avgReviewRounds / 3, 1) * 100; // 3+ rounds = 100

  // Maintainer trust (PRs merged without significant changes)
  const maintainerMerges = prs.filter(pr => pr.isMaintainerMerge).length;
  const maintainerTrust = (maintainerMerges / prs.length) * 100;

  // Contribution complexity (PRs touching multiple files/directories)
  const avgFilesChanged = prs.reduce((sum, pr) => sum + pr.filesChanged, 0) / prs.length;
  const avgDirectoriesTouched = prs.reduce((sum, pr) => sum + pr.directoriesTouched, 0) / prs.length;
  const complexity = Math.min((avgFilesChanged + avgDirectoriesTouched) / 10, 1) * 100;

  // Anti-spam score (penalize forks, reward original repos)
  const forkPRs = prs.filter(pr => pr.isFork).length;
  const forkPenalty = (forkPRs / prs.length) * 50; // Max 50% penalty
  const antiSpamScore = Math.max(100 - forkPenalty, 0);

  const score = (
    reviewDepth * 0.3 +
    maintainerTrust * 0.3 +
    complexity * 0.25 +
    antiSpamScore * 0.15
  );

  return {
    score: Math.min(score, 100),
    breakdown: {
      reviewDepth,
      maintainerTrust,
      contributionComplexity: complexity,
      antiSpamScore,
    },
  };
}

/**
 * Main function to calculate Impact Score
 */
export function calculateImpactScore(
  githubActivity: GitHubActivity,
  config?: ImpactScoreConfig
): ImpactScoreResult {
  const fullConfig: Required<ImpactScoreConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    weights: {
      ...DEFAULT_CONFIG.weights,
      ...config?.weights,
    },
  };

  // Filter out self-merged PRs
  const { valid: validPRs, selfMerged } = filterSelfMergedPRs(githubActivity.mergedPRs);

  // Filter out spam PRs
  const { valid: cleanPRs, spam } = filterSpamPRs(validPRs, fullConfig);

  // Calculate component scores
  const prImpact = calculatePRImpactScore(cleanPRs, githubActivity.reviewsReceived, fullConfig);
  const collaboration = calculateCollaborationScore(
    cleanPRs,
    githubActivity.reviewsGiven,
    githubActivity.reviewsReceived,
    githubActivity.issues,
    githubActivity.repositories
  );
  const longevity = calculateLongevityScore(cleanPRs, githubActivity.activitySpan);
  const quality = calculateQualityScore(cleanPRs, githubActivity.reviewsReceived);

  // Calculate total weighted score
  const totalScore = (
    prImpact.score * (fullConfig.weights.prImpact ?? 0.4) +
    collaboration.score * (fullConfig.weights.collaboration ?? 0.3) +
    longevity.score * (fullConfig.weights.longevity ?? 0.2) +
    quality.score * (fullConfig.weights.quality ?? 0.1)
  );

  // Calculate activity span in months
  const activitySpanMonths = (githubActivity.activitySpan.lastPRDate.getTime() -
    githubActivity.activitySpan.firstPRDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Build explainability data
  const repoContributions = new Map<string, number>();
  for (const pr of cleanPRs) {
    repoContributions.set(pr.repository, (repoContributions.get(pr.repository) || 0) + 1);
  }

  const topContributingRepos = Array.from(repoContributions.entries())
    .map(([repo, count]) => ({
      repo,
      prCount: count,
      score: count * 10, // Simple scoring for explainability
    }))
    .sort((a, b) => b.prCount - a.prCount)
    .slice(0, 10);

  const recentActivity = cleanPRs
    .slice(-10)
    .map(pr => ({
      date: pr.mergedAt,
      event: `Merged PR in ${pr.repository}`,
      impact: applyTimeDecay(pr, new Date(), fullConfig.timeDecayFactor) * 10,
    }))
    .reverse();

  const penalties = [
    {
      reason: 'Self-merged PRs excluded',
      count: selfMerged.length,
      impact: 0,
    },
    {
      reason: 'Spam PRs filtered',
      count: spam.length,
      impact: 0,
    },
  ];

  return {
    totalScore: Math.min(Math.max(totalScore, 0), 100),
    components: {
      prImpact,
      collaboration,
      longevity,
      quality,
    },
    signals: {
      totalMergedPRs: githubActivity.mergedPRs.length,
      selfMergedPRs: selfMerged.length,
      spamPRs: spam.length,
      activeRepositories: new Set(cleanPRs.map(pr => pr.repository)).size,
      activitySpanMonths: Math.max(activitySpanMonths, 0),
    },
    explainability: {
      topContributingRepos,
      recentActivity,
      penalties,
    },
  };
}
