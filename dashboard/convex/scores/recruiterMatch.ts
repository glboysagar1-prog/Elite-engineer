/**
 * Wecraft Recruiter Match Score Calculator
 * 
 * Combines Trust Score, Compatibility Score, and Impact Score
 * into a single match score for recruiters.
 * 
 * Provides different views for recruiters vs engineers.
 */

import type {
  TrustScoreResult,
  CompatibilityScoreResult,
  ImpactScoreResult,
  RecruiterMatchScoreConfig,
  RecruiterView,
  EngineerView,
  RecruiterMatchScoreResult,
} from '../types/scores';
const DEFAULT_CONFIG: Required<RecruiterMatchScoreConfig> = {
  weights: {
    trust: 0.4, // 40% - Most important: Is this person real and reliable?
    compatibility: 0.4, // 40% - Do they match the role requirements?
    impact: 0.2, // 20% - Have they made meaningful contributions?
  },
  minimumThresholds: {
    trust: 50, // Must be at least somewhat authentic
    compatibility: 30, // Must have some relevant experience
    impact: 20, // Must have some contribution history
  },
  boostFactors: {
    highTrustBoost: 1.1, // 10% boost if trust > 80
    highCompatibilityBoost: 1.15, // 15% boost if compatibility > 85
    highImpactBoost: 1.05, // 5% boost if impact > 90
  },
};

/**
 * Weight Justification:
 * 
 * Trust (40%): Highest weight because:
 * - Authenticity is non-negotiable - fake accounts waste everyone's time
 * - Trust issues (spam, farming) indicate unreliable candidates
 * - Must be real and genuine before other factors matter
 * - Recruiters need confidence the profile is legitimate
 * 
 * Compatibility (40%): Equal weight because:
 * - Role fit is critical for successful hiring
 * - Even authentic, high-impact engineers may not fit the role
 * - Saves time by filtering for relevant experience
 * - Directly answers "Can they do this job?"
 * 
 * Impact (20%): Lower but still important because:
 * - Impact shows capability but is less critical than trust/fit
 * - High impact in wrong domain is less valuable than medium impact in right domain
 * - Can be developed over time, whereas trust/compatibility are more fixed
 * - Still important to show they've made meaningful contributions
 */

/**
 * Calculate weighted match score with boosts and thresholds
 */
function calculateWeightedScore(
  trustScore: number,
  compatibilityScore: number,
  impactScore: number,
  config: Required<RecruiterMatchScoreConfig>
): {
  total: number;
  trustComponent: number;
  compatibilityComponent: number;
  impactComponent: number;
  boosts: { trust: number; compatibility: number; impact: number };
} {
  // Check minimum thresholds (fail fast)
  if (trustScore < config.minimumThresholds.trust) {
    return {
      total: 0,
      trustComponent: 0,
      compatibilityComponent: 0,
      impactComponent: 0,
      boosts: { trust: 1, compatibility: 1, impact: 1 },
    };
  }

  if (compatibilityScore < config.minimumThresholds.compatibility) {
    return {
      total: 0,
      trustComponent: 0,
      compatibilityComponent: 0,
      impactComponent: 0,
      boosts: { trust: 1, compatibility: 1, impact: 1 },
    };
  }

  if (impactScore < config.minimumThresholds.impact) {
    return {
      total: 0,
      trustComponent: 0,
      compatibilityComponent: 0,
      impactComponent: 0,
      boosts: { trust: 1, compatibility: 1, impact: 1 },
    };
  }

  // Apply boosts for exceptional performance
  let trustBoost = 1;
  let compatibilityBoost = 1;
  let impactBoost = 1;

  if (trustScore > 80) {
    trustBoost = config.boostFactors.highTrustBoost;
  }

  if (compatibilityScore > 85) {
    compatibilityBoost = config.boostFactors.highCompatibilityBoost;
  }

  if (impactScore > 90) {
    impactBoost = config.boostFactors.highImpactBoost;
  }

  // Calculate weighted components
  const trustComponent = trustScore * config.weights.trust * trustBoost;
  const compatibilityComponent = compatibilityScore * config.weights.compatibility * compatibilityBoost;
  const impactComponent = impactScore * config.weights.impact * impactBoost;

  // Total score (capped at 100)
  const total = Math.min(
    trustComponent + compatibilityComponent + impactComponent,
    100
  );

  return {
    total,
    trustComponent: trustScore * config.weights.trust,
    compatibilityComponent: compatibilityScore * config.weights.compatibility,
    impactComponent: impactScore * config.weights.impact,
    boosts: { trust: trustBoost, compatibility: compatibilityBoost, impact: impactBoost },
  };
}

/**
 * Generate recruiter-friendly view
 */
function generateRecruiterView(
  trustResult: TrustScoreResult,
  compatibilityResult: CompatibilityScoreResult,
  impactResult: ImpactScoreResult,
  matchScore: number,
  components: { trust: number; compatibility: number; impact: number }
): RecruiterView {
  // Determine match level
  let matchLevel: 'excellent' | 'strong' | 'good' | 'fair' | 'poor';
  let recommendation: 'strongly-recommend' | 'recommend' | 'consider' | 'not-recommended';

  if (matchScore >= 85) {
    matchLevel = 'excellent';
    recommendation = 'strongly-recommend';
  } else if (matchScore >= 70) {
    matchLevel = 'strong';
    recommendation = 'recommend';
  } else if (matchScore >= 50) {
    matchLevel = 'good';
    recommendation = 'consider';
  } else if (matchScore >= 30) {
    matchLevel = 'fair';
    recommendation = 'consider';
  } else {
    matchLevel = 'poor';
    recommendation = 'not-recommended';
  }

  // Build strengths
  const strengths: string[] = [];
  if (trustResult.totalScore > 75) {
    strengths.push('Highly authentic profile with verified contributions');
  }
  if (compatibilityResult.totalScore > 75) {
    strengths.push(`Strong ${compatibilityResult.explanation.role} role fit`);
  }
  if (impactResult.totalScore > 80) {
    strengths.push('High-impact contributions with proven track record');
  }
  if (trustResult.isAuthentic && compatibilityResult.compatibilityLevel === 'high') {
    strengths.push('Authentic engineer with excellent role alignment');
  }

  // Build concerns
  const concerns: string[] = [];
  if (trustResult.totalScore < 60) {
    concerns.push('Trust score below ideal threshold');
  }
  if (compatibilityResult.totalScore < 50) {
    concerns.push('Limited role-specific experience');
  }
  if (impactResult.totalScore < 50) {
    concerns.push('Lower contribution impact');
  }
  if (trustResult.redFlags.length > 0) {
    concerns.push(`${trustResult.redFlags.length} trust-related concerns`);
  }

  // Critical red flags only
  const redFlags: string[] = [];
  if (!trustResult.isAuthentic) {
    redFlags.push('Profile authenticity concerns');
  }
  if (trustResult.spamDetection.forkFarming) {
    redFlags.push('Fork-only contributions detected');
  }
  if (compatibilityResult.compatibilityLevel === 'poor') {
    redFlags.push('Poor role compatibility');
  }

  // Generate summary
  const summary = generateSummary(trustResult, compatibilityResult, impactResult, matchScore);

  return {
    matchScore,
    matchLevel,
    recommendation,
    trustScore: trustResult.totalScore,
    fitScore: compatibilityResult.totalScore, // Renamed for clarity
    impactScore: impactResult.totalScore,
    strengths,
    concerns,
    isAuthentic: trustResult.isAuthentic,
    isGoodFit: compatibilityResult.compatibilityLevel !== 'poor',
    hasImpact: impactResult.totalScore > 50,
    redFlags,
    summary,
  };
}

/**
 * Generate engineer-friendly view (full transparency, no match score)
 */
function generateEngineerView(
  trustResult: TrustScoreResult,
  compatibilityResult: CompatibilityScoreResult,
  impactResult: ImpactScoreResult
): EngineerView {
  // Improvement suggestions
  const suggestions: string[] = [];

  if (trustResult.totalScore < 70) {
    if (trustResult.redFlags.includes('Insufficient repository diversity')) {
      suggestions.push('Contribute to more diverse repositories to increase trust score');
    }
    if (trustResult.spamDetection.forkFarming) {
      suggestions.push('Contribute to original repositories, not just forks');
    }
  }

  if (compatibilityResult.totalScore < 60) {
    suggestions.push(`Increase ${compatibilityResult.explanation.role}-specific contributions`);
    if (compatibilityResult.negativeSignals.technologyMismatch > 50) {
      suggestions.push('Focus on role-relevant technologies and reduce unrelated contributions');
    }
  }

  if (impactResult.totalScore < 60) {
    suggestions.push('Increase merged PR count and collaboration with maintainers');
    if (impactResult.signals.activeRepositories < 3) {
      suggestions.push('Contribute to more repositories to demonstrate breadth');
    }
  }

  return {
    trustScore: {
      total: trustResult.totalScore,
      isAuthentic: trustResult.isAuthentic,
      confidence: trustResult.confidence,
      components: {
        accountAuthenticity: trustResult.components.accountAuthenticity.score,
        contributionAuthenticity: trustResult.components.contributionAuthenticity.score,
        collaborationSignals: trustResult.components.collaborationSignals.score,
        antiGamingScore: trustResult.components.antiGamingScore.score,
      },
      greenFlags: trustResult.greenFlags,
      redFlags: trustResult.redFlags,
    },
    compatibilityScore: {
      total: compatibilityResult.totalScore,
      compatibilityLevel: compatibilityResult.compatibilityLevel,
      signals: {
        technologyStackMatch: compatibilityResult.signals.technologyStackMatch,
        domainContributionDepth: compatibilityResult.signals.domainContributionDepth,
        architecturePatternMatch: compatibilityResult.signals.architecturePatternMatch,
        fileTypeAlignment: compatibilityResult.signals.fileTypeAlignment,
        activityTypeMatch: compatibilityResult.signals.activityTypeMatch,
        repositoryTypeMatch: compatibilityResult.signals.repositoryTypeMatch,
        reviewDomainExpertise: compatibilityResult.signals.reviewDomainExpertise,
      },
      strengths: compatibilityResult.explanation.strengths,
      weaknesses: compatibilityResult.explanation.weaknesses,
    },
    impactScore: {
      total: impactResult.totalScore,
      components: {
        prImpact: impactResult.components.prImpact.score,
        collaboration: impactResult.components.collaboration.score,
        longevity: impactResult.components.longevity.score,
        quality: impactResult.components.quality.score,
      },
      signals: {
        totalMergedPRs: impactResult.signals.totalMergedPRs,
        activeRepositories: impactResult.signals.activeRepositories,
        activitySpanMonths: impactResult.signals.activitySpanMonths,
      },
    },
    improvementSuggestions: suggestions,
  };
}

/**
 * Generate human-readable summary for recruiters
 */
function generateSummary(
  trustResult: TrustScoreResult,
  compatibilityResult: CompatibilityScoreResult,
  impactResult: ImpactScoreResult,
  matchScore: number
): string {
  const parts: string[] = [];

  if (matchScore >= 85) {
    parts.push('Excellent match');
  } else if (matchScore >= 70) {
    parts.push('Strong match');
  } else if (matchScore >= 50) {
    parts.push('Good match');
  } else {
    parts.push('Fair match');
  }

  parts.push(`with ${compatibilityResult.explanation.role} role`);

  if (trustResult.isAuthentic) {
    parts.push('and authentic profile');
  }

  if (compatibilityResult.compatibilityLevel === 'high') {
    parts.push('showing strong role alignment');
  }

  if (impactResult.totalScore > 80) {
    parts.push('with high-impact contributions');
  }

  return parts.join(', ') + '.';
}

/**
 * Main function to calculate Recruiter Match Score
 */
export function calculateRecruiterMatchScore(
  trustResult: TrustScoreResult,
  compatibilityResult: CompatibilityScoreResult,
  impactResult: ImpactScoreResult,
  config?: RecruiterMatchScoreConfig
): RecruiterMatchScoreResult {
  const fullConfig: Required<RecruiterMatchScoreConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    weights: {
      ...DEFAULT_CONFIG.weights,
      ...config?.weights,
    },
    minimumThresholds: {
      ...DEFAULT_CONFIG.minimumThresholds,
      ...config?.minimumThresholds,
    },
    boostFactors: {
      ...DEFAULT_CONFIG.boostFactors,
      ...config?.boostFactors,
    },
  };

  // Calculate weighted score
  const scoreCalculation = calculateWeightedScore(
    trustResult.totalScore,
    compatibilityResult.totalScore,
    impactResult.totalScore,
    fullConfig
  );

  // Generate views
  const recruiterView = generateRecruiterView(
    trustResult,
    compatibilityResult,
    impactResult,
    scoreCalculation.total,
    {
      trust: scoreCalculation.trustComponent,
      compatibility: scoreCalculation.compatibilityComponent,
      impact: scoreCalculation.impactComponent,
    }
  );

  const engineerView = generateEngineerView(
    trustResult,
    compatibilityResult,
    impactResult
  );

  return {
    totalMatchScore: scoreCalculation.total,
    trustComponent: scoreCalculation.trustComponent,
    compatibilityComponent: scoreCalculation.compatibilityComponent,
    impactComponent: scoreCalculation.impactComponent,
    recruiterView,
    engineerView,
    calculationDetails: {
      weights: fullConfig.weights,
      thresholds: fullConfig.minimumThresholds,
      boosts: scoreCalculation.boosts,
    },
  };
}
