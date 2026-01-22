/**
 * Wecraft Trust / Authenticity Score Calculator
 * 
 * Determines if an engineer is real and reliable by analyzing:
 * - Account authenticity signals
 * - Contribution patterns
 * - Anti-gaming detection
 * - Fork-only behavior penalties
 */

import type {
  GitHubAccount,
  ContributionPattern,
} from '../types/github';

import type {
  SpamDetection,
  TrustScoreConfig,
  TrustSignals,
  TrustScoreResult,
} from '../types/scores';

const DEFAULT_CONFIG: Required<TrustScoreConfig> = {
  maxPRsPerDay: 20,
  maxPRsPerHour: 5,
  minAccountAgeDays: 30,
  minUniqueRepos: 2,
  forkOnlyPenalty: 0.5,
  identicalMessageThreshold: 5,
  weights: {
    accountAuthenticity: 0.25,
    contributionAuthenticity: 0.35,
    collaborationSignals: 0.25,
    antiGamingScore: 0.15,
  },
};

/**
 * Detects spam patterns in contributions
 */
function detectSpamPatterns(
  pattern: ContributionPattern,
  config: Required<TrustScoreConfig>
): SpamDetection {
  const spam: SpamDetection = {
    excessiveDailyPRs: pattern.maxPRsInSingleDay > config.maxPRsPerDay,
    excessiveHourlyActivity: false, // Would need hourly data
    identicalCommitMessages: pattern.identicalCommitMessages >= config.identicalMessageThreshold,
    automatedPatterns: false, // Would need deeper analysis
    suspiciousTimePatterns: false, // Would need time analysis
    trivialPRs: 0,
    whitespaceOnlyPRs: 0,
    singleCharacterPRs: 0,
    forkFarming: pattern.forkOnlyRepos.length > 0 && pattern.originalRepoContributions === 0,
    selfMergeFarming: pattern.selfMergedPRs / pattern.totalPRs > 0.5,
    repositoryFarming: pattern.uniqueRepositories > 50 && pattern.repositoriesWithMultiplePRs < 5,
  };

  return spam;
}

/**
 * Calculates account authenticity component
 */
function calculateAccountAuthenticity(
  account: GitHubAccount,
  pattern: ContributionPattern,
  config: Required<TrustScoreConfig>
): { score: number; breakdown: any } {
  const now = new Date();
  const accountAgeDays = (now.getTime() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Account age score (older = more authentic)
  let accountAgeScore = Math.min(accountAgeDays / 365, 1) * 100; // 1 year = 100

  // Account maturity (has real activity over time)
  const contributionSpan = pattern.firstContributionDate && pattern.lastContributionDate
    ? (pattern.lastContributionDate.getTime() - pattern.firstContributionDate.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const accountMaturity = Math.min(contributionSpan / 180, 1) * 100; // 6 months = 100

  // Profile completeness (has bio, location, etc.)
  let profileCompleteness = 0;
  if (account.bio) profileCompleteness += 20;
  if (account.location) profileCompleteness += 20;
  if (account.company) profileCompleteness += 20;
  if (account.website) profileCompleteness += 20;
  if (account.email) profileCompleteness += 20;

  // Penalize very new accounts
  if (accountAgeDays < config.minAccountAgeDays) {
    accountAgeScore *= 0.3; // Heavy penalty
  }

  const score = (
    accountAgeScore * 0.4 +
    accountMaturity * 0.4 +
    profileCompleteness * 0.2
  );

  return {
    score: Math.min(Math.max(score, 0), 100),
    breakdown: {
      accountAge: accountAgeDays,
      accountMaturity,
      profileCompleteness,
    },
  };
}

/**
 * Calculates contribution authenticity component
 */
function calculateContributionAuthenticity(
  pattern: ContributionPattern,
  config: Required<TrustScoreConfig>
): { score: number; breakdown: any } {
  if (pattern.totalPRs === 0) {
    return {
      score: 0,
      breakdown: {
        contributionSpan: 0,
        repositoryDiversity: 0,
        maintainerTrust: 0,
        temporalConsistency: 0,
      },
    };
  }

  // Contribution span (longer = more authentic)
  const contributionSpan = pattern.firstContributionDate && pattern.lastContributionDate
    ? (pattern.lastContributionDate.getTime() - pattern.firstContributionDate.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const spanScore = Math.min(contributionSpan / 365, 1) * 100; // 1 year = 100

  // Repository diversity (more repos = more authentic, but with diminishing returns)
  const repoDiversity = Math.min(Math.log10(pattern.uniqueRepositories + 1) / Math.log10(20), 1) * 100;

  // Maintainer trust (PRs merged by maintainers, not self-merged)
  const maintainerMerges = pattern.mergedPRs - pattern.selfMergedPRs;
  const maintainerTrust = pattern.mergedPRs > 0
    ? (maintainerMerges / pattern.mergedPRs) * 100
    : 0;

  // Temporal consistency (contributions spread over time, not bursts)
  const consistency = pattern.contributionMonths > 0 && contributionSpan > 0
    ? Math.min((pattern.contributionMonths / (contributionSpan / 30)) * 100, 100)
    : 0;

  // Penalize if too few unique repos
  const diversityPenalty = pattern.uniqueRepositories < config.minUniqueRepos ? 0.5 : 1.0;

  const score = (
    spanScore * 0.3 +
    repoDiversity * 0.3 * diversityPenalty +
    maintainerTrust * 0.25 +
    consistency * 0.15
  );

  return {
    score: Math.min(Math.max(score, 0), 100),
    breakdown: {
      contributionSpan,
      repositoryDiversity: repoDiversity,
      maintainerTrust,
      temporalConsistency: consistency,
    },
  };
}

/**
 * Calculates collaboration signals component
 */
function calculateCollaborationSignals(
  pattern: ContributionPattern
): { score: number; breakdown: any } {
  if (pattern.totalPRs === 0) {
    return {
      score: 0,
      breakdown: {
        uniqueCollaborators: 0,
        maintainerInteractions: 0,
        crossRepoCollaborations: 0,
        reviewReciprocity: 0,
      },
    };
  }

  // Unique collaborators (more = better)
  const collaboratorScore = Math.min(Math.log10(pattern.uniqueCollaborators + 1) / Math.log10(50), 1) * 100;

  // Maintainer interactions (reviews from maintainers)
  const maintainerInteractionRate = pattern.maintainerInteractions > 0
    ? Math.min((pattern.maintainerInteractions / pattern.mergedPRs) * 100, 100)
    : 0;

  // Cross-repository collaborations
  const crossRepoScore = pattern.crossRepositoryCollaborations > 0
    ? Math.min((pattern.crossRepositoryCollaborations / pattern.uniqueRepositories) * 100, 100)
    : 0;

  // Review reciprocity (giving and receiving reviews)
  const totalReviews = pattern.reviewsGiven + pattern.reviewsReceived;
  const reciprocity = totalReviews > 0
    ? (Math.min(pattern.reviewsGiven, pattern.reviewsReceived) / Math.max(pattern.reviewsGiven, pattern.reviewsReceived || 1)) * 100
    : 0;

  const score = (
    collaboratorScore * 0.3 +
    maintainerInteractionRate * 0.3 +
    crossRepoScore * 0.2 +
    reciprocity * 0.2
  );

  return {
    score: Math.min(Math.max(score, 0), 100),
    breakdown: {
      uniqueCollaborators: pattern.uniqueCollaborators,
      maintainerInteractions: pattern.maintainerInteractions,
      crossRepoCollaborations: pattern.crossRepositoryCollaborations,
      reviewReciprocity: reciprocity,
    },
  };
}

/**
 * Calculates anti-gaming score component
 */
function calculateAntiGamingScore(
  pattern: ContributionPattern,
  spam: SpamDetection,
  config: Required<TrustScoreConfig>
): { score: number; breakdown: any } {
  let spamScore = 100;
  let forkFarmingPenalty = 0;
  let patternAnomalies = 100;
  let behavioralRedFlags = 100;

  // Spam detection penalties
  if (spam.excessiveDailyPRs) spamScore -= 30;
  if (spam.identicalCommitMessages) spamScore -= 25;
  if (spam.forkFarming) spamScore -= 40;
  if (spam.selfMergeFarming) spamScore -= 30;
  if (spam.repositoryFarming) spamScore -= 20;

  spamScore = Math.max(spamScore, 0);

  // Fork-only penalty (major red flag)
  const forkRatio = pattern.totalPRs > 0 ? pattern.forkPRs / pattern.totalPRs : 0;
  if (forkRatio === 1.0 && pattern.originalRepoContributions === 0) {
    forkFarmingPenalty = 100; // Maximum penalty
  } else if (forkRatio > 0.8) {
    forkFarmingPenalty = 70; // High penalty
  } else if (forkRatio > 0.5) {
    forkFarmingPenalty = 40; // Medium penalty
  } else {
    forkFarmingPenalty = 0;
  }

  // Pattern anomalies
  if (pattern.averagePRsPerDay > 10) patternAnomalies -= 20;
  if (pattern.maxPRsInSingleDay > config.maxPRsPerDay) patternAnomalies -= 30;
  if (pattern.identicalCommitMessages > 0) patternAnomalies -= 15;
  patternAnomalies = Math.max(patternAnomalies, 0);

  // Behavioral red flags
  const selfMergeRatio = pattern.totalPRs > 0 ? pattern.selfMergedPRs / pattern.totalPRs : 0;
  if (selfMergeRatio > 0.7) behavioralRedFlags -= 40;
  if (selfMergeRatio > 0.5) behavioralRedFlags -= 25;

  if (pattern.uniqueRepositories > 100 && pattern.repositoriesWithMultiplePRs < 10) {
    behavioralRedFlags -= 30; // Repository farming
  }

  behavioralRedFlags = Math.max(behavioralRedFlags, 0);

  // Calculate final score (lower is worse, so we invert)
  const score = (
    spamScore * 0.4 +
    (100 - forkFarmingPenalty) * 0.3 +
    patternAnomalies * 0.2 +
    behavioralRedFlags * 0.1
  );

  return {
    score: Math.min(Math.max(score, 0), 100),
    breakdown: {
      spamDetection: spamScore,
      forkFarmingPenalty,
      patternAnomalies,
      behavioralRedFlags,
    },
  };
}

/**
 * Main function to calculate Trust / Authenticity Score
 */
export function calculateTrustScore(
  account: GitHubAccount,
  contributionPattern: ContributionPattern,
  config?: TrustScoreConfig
): TrustScoreResult {
  const fullConfig: Required<TrustScoreConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    weights: {
      ...DEFAULT_CONFIG.weights,
      ...config?.weights,
    },
  };

  // Detect spam patterns
  const spam = detectSpamPatterns(contributionPattern, fullConfig);

  // Calculate component scores
  const accountAuth = calculateAccountAuthenticity(account, contributionPattern, fullConfig);
  const contributionAuth = calculateContributionAuthenticity(contributionPattern, fullConfig);
  const collaboration = calculateCollaborationSignals(contributionPattern);
  const antiGaming = calculateAntiGamingScore(contributionPattern, spam, fullConfig);

  // Calculate weighted total score
  const totalScore = (
    accountAuth.score * (fullConfig.weights.accountAuthenticity ?? 0.25) +
    contributionAuth.score * (fullConfig.weights.contributionAuthenticity ?? 0.35) +
    collaboration.score * (fullConfig.weights.collaborationSignals ?? 0.25) +
    antiGaming.score * (fullConfig.weights.antiGamingScore ?? 0.15)
  );

  // Calculate trust signals
  const contributionSpan = contributionPattern.firstContributionDate && contributionPattern.lastContributionDate
    ? (contributionPattern.lastContributionDate.getTime() - contributionPattern.firstContributionDate.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const accountAge = (new Date().getTime() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  const forkRatio = contributionPattern.totalPRs > 0
    ? contributionPattern.forkPRs / contributionPattern.totalPRs
    : 0;

  const originalRepoRatio = contributionPattern.totalPRs > 0
    ? contributionPattern.originalRepoContributions / contributionPattern.totalPRs
    : 0;

  const maintainerTrust = contributionPattern.mergedPRs > 0
    ? ((contributionPattern.mergedPRs - contributionPattern.selfMergedPRs) / contributionPattern.mergedPRs) * 100
    : 0;

  const signals: TrustSignals = {
    accountAge,
    accountMaturity: accountAuth.breakdown.accountMaturity,
    contributionSpan,
    repositoryDiversity: contributionAuth.breakdown.repositoryDiversity,
    maintainerTrust,
    collaborationDepth: collaboration.score,
    forkContributionRatio: forkRatio,
    originalRepoContributionRatio: originalRepoRatio,
  };

  // Build red flags and green flags
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  if (spam.forkFarming) {
    redFlags.push('Fork-only contributions detected');
  }
  if (spam.selfMergeFarming) {
    redFlags.push('High rate of self-merged PRs');
  }
  if (spam.excessiveDailyPRs) {
    redFlags.push('Excessive daily PR activity');
  }
  if (spam.repositoryFarming) {
    redFlags.push('Repository farming pattern detected');
  }
  if (forkRatio > 0.8) {
    redFlags.push('High fork contribution ratio');
  }
  if (accountAge < fullConfig.minAccountAgeDays) {
    redFlags.push('Account too new');
  }
  if (contributionPattern.uniqueRepositories < fullConfig.minUniqueRepos) {
    redFlags.push('Insufficient repository diversity');
  }

  if (signals.maintainerTrust > 80) {
    greenFlags.push('High maintainer trust');
  }
  if (signals.repositoryDiversity > 70) {
    greenFlags.push('Strong repository diversity');
  }
  if (signals.collaborationDepth > 70) {
    greenFlags.push('Active collaboration');
  }
  if (contributionSpan > 365) {
    greenFlags.push('Long-term consistent contributions');
  }
  if (originalRepoRatio > 0.7) {
    greenFlags.push('Primarily original repository contributions');
  }

  // Determine authenticity (pass/fail)
  const isAuthentic = totalScore >= 60 && redFlags.length < 3 && !spam.forkFarming;

  // Calculate confidence (based on data completeness and score consistency)
  let confidence = 100;
  if (contributionPattern.totalPRs < 5) confidence -= 30;
  if (contributionSpan < 30) confidence -= 20;
  if (contributionPattern.uniqueRepositories < 2) confidence -= 25;
  confidence = Math.max(confidence, 0);

  return {
    totalScore: Math.min(Math.max(totalScore, 0), 100),
    isAuthentic,
    confidence,
    components: {
      accountAuthenticity: accountAuth,
      contributionAuthenticity: contributionAuth,
      collaborationSignals: collaboration,
      antiGamingScore: antiGaming,
    },
    signals,
    spamDetection: spam,
    redFlags,
    greenFlags,
  };
}
