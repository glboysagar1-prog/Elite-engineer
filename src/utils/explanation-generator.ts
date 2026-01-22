/**
 * Explanation Generator for Wecraft
 * 
 * Generates human-readable explanations from score breakdowns.
 * Does NOT generate scores or rank engineers - only explains existing data.
 */

import type {
  TrustScoreResult,
  TrustSignals,
} from '../types/scores';
import type {
  ImpactScoreResult,
} from '../types/scores';
import type {
  CompatibilityScoreResult,
  CompatibilitySignals,
} from '../types/scores';

// ============================================================================
// Explanation Types
// ============================================================================

export interface MatchExplanation {
  // Main explanation
  whyThisMatch: string; // 2-3 sentence summary
  
  // Positive indicators
  strengths: Array<{
    title: string;
    description: string;
    evidence: string[];
  }>;
  
  // Areas of concern
  concerns: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    evidence: string[];
  }>;
  
  // Trust indicators
  trustIndicators: {
    isAuthentic: boolean;
    confidence: number; // 0-100
    keyTrustSignals: string[];
  };
  
  // Compatibility indicators
  compatibilityIndicators: {
    role: string;
    fitLevel: 'high' | 'medium' | 'low' | 'poor';
    keySignals: string[];
  };
  
  // Impact indicators
  impactIndicators: {
    contributionDepth: string;
    collaborationLevel: string;
    keyContributions: string[];
  };
}

// ============================================================================
// Explanation Generator
// ============================================================================

/**
 * Generate match explanation from score breakdowns
 */
export function generateMatchExplanation(
  trustResult: TrustScoreResult,
  impactResult: ImpactScoreResult,
  compatibilityResult: CompatibilityScoreResult
): MatchExplanation {
  // Generate "Why this match?" summary
  const whyThisMatch = generateWhyThisMatch(
    trustResult,
    impactResult,
    compatibilityResult
  );
  
  // Generate strengths
  const strengths = generateStrengths(
    trustResult,
    impactResult,
    compatibilityResult
  );
  
  // Generate concerns
  const concerns = generateConcerns(
    trustResult,
    impactResult,
    compatibilityResult
  );
  
  // Extract trust indicators
  const trustIndicators = extractTrustIndicators(trustResult);
  
  // Extract compatibility indicators
  const compatibilityIndicators = extractCompatibilityIndicators(compatibilityResult);
  
  // Extract impact indicators
  const impactIndicators = extractImpactIndicators(impactResult);
  
  return {
    whyThisMatch,
    strengths,
    concerns,
    trustIndicators,
    compatibilityIndicators,
    impactIndicators,
  };
}

// ============================================================================
// "Why This Match?" Summary
// ============================================================================

function generateWhyThisMatch(
  trustResult: TrustScoreResult,
  impactResult: ImpactScoreResult,
  compatibilityResult: CompatibilityScoreResult
): string {
  const parts: string[] = [];
  
  // Trust assessment
  if (trustResult.isAuthentic) {
    parts.push("This engineer has an authentic profile");
  } else {
    parts.push("There are authenticity concerns with this profile");
  }
  
  // Compatibility assessment
  const compatibilityLevel = compatibilityResult.compatibilityLevel;
  if (compatibilityLevel === 'high') {
    parts.push(`shows strong alignment with ${compatibilityResult.explanation.role} engineering`);
  } else if (compatibilityLevel === 'medium') {
    parts.push(`demonstrates moderate ${compatibilityResult.explanation.role} experience`);
  } else {
    parts.push(`has limited ${compatibilityResult.explanation.role} alignment`);
  }
  
  // Impact assessment
  const impactLevel = getImpactLevel(impactResult.totalScore);
  if (impactLevel === 'high') {
    parts.push("with a proven track record of meaningful contributions");
  } else if (impactLevel === 'medium') {
    parts.push("with a solid history of contributions");
  } else {
    parts.push("with emerging contribution patterns");
  }
  
  return parts.join(', ') + '.';
}

function getImpactLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ============================================================================
// Strengths Generation
// ============================================================================

function generateStrengths(
  trustResult: TrustScoreResult,
  impactResult: ImpactScoreResult,
  compatibilityResult: CompatibilityScoreResult
): Array<{ title: string; description: string; evidence: string[] }> {
  const strengths: Array<{ title: string; description: string; evidence: string[] }> = [];
  
  // Trust strengths
  if (trustResult.isAuthentic) {
    strengths.push({
      title: 'Authentic Profile',
      description: 'Profile shows genuine engineering activity with verified contributions.',
      evidence: buildTrustEvidence(trustResult),
    });
  }
  
  if (trustResult.signals.maintainerTrust > 80) {
    strengths.push({
      title: 'High Maintainer Trust',
      description: `Most contributions (${Math.round(trustResult.signals.maintainerTrust)}%) were merged by repository maintainers, indicating quality work.`,
      evidence: [
        `${Math.round(trustResult.signals.maintainerTrust)}% of PRs merged by maintainers`,
        `${impactResult.signals.totalMergedPRs - impactResult.signals.selfMergedPRs} maintainer-merged PRs`,
      ],
    });
  }
  
  if (trustResult.signals.repositoryDiversity > 70) {
    strengths.push({
      title: 'Strong Repository Diversity',
      description: `Contributions span ${impactResult.signals.activeRepositories} repositories, showing breadth of experience.`,
      evidence: [
        `${impactResult.signals.activeRepositories} active repositories`,
        `Contributions across diverse projects`,
      ],
    });
  }
  
  if (trustResult.signals.collaborationDepth > 70) {
    strengths.push({
      title: 'Active Collaboration',
      description: 'Strong collaboration patterns with other engineers and maintainers.',
      evidence: [
        `${impactResult.components.collaboration.breakdown.uniqueCollaborators || 'Multiple'} collaborators`,
        `Active in team environments`,
      ],
    });
  }
  
  // Impact strengths
  if (impactResult.components.prImpact.score > 70) {
    strengths.push({
      title: 'High PR Impact',
      description: `Significant contributions with ${impactResult.signals.totalMergedPRs} merged PRs and strong review engagement.`,
      evidence: [
        `${impactResult.signals.totalMergedPRs} merged PRs`,
        `Average ${Math.round(impactResult.components.prImpact.breakdown.reviewEngagement / 10)} review comments per PR`,
        `${Math.round(impactResult.components.prImpact.breakdown.repoDiversity)} repository diversity score`,
      ],
    });
  }
  
  if (impactResult.components.longevity.score > 70) {
    const spanMonths = impactResult.signals.activitySpanMonths;
    strengths.push({
      title: 'Long-term Consistency',
      description: `Sustained contributions over ${Math.round(spanMonths)} months, demonstrating commitment and reliability.`,
      evidence: [
        `${Math.round(spanMonths)} months of activity`,
        `Consistent contribution patterns`,
        `${impactResult.components.longevity.breakdown.consistency}% consistency score`,
      ],
    });
  }
  
  if (impactResult.components.collaboration.score > 70) {
    strengths.push({
      title: 'Strong Collaboration',
      description: 'Active participation in collaborative development with cross-repository contributions.',
      evidence: [
        `Contributions to ${impactResult.signals.activeRepositories} repositories`,
        `Active code review participation`,
        `Team-oriented development approach`,
      ],
    });
  }
  
  // Compatibility strengths
  if (compatibilityResult.signals.technologyStackMatch > 70) {
    strengths.push({
      title: 'Technology Stack Alignment',
      description: `Strong match with ${compatibilityResult.explanation.role} technologies and tools.`,
      evidence: [
        `${compatibilityResult.breakdown.technologyStack.matchedTechnologies.length} matched technologies`,
        `Technologies: ${compatibilityResult.breakdown.technologyStack.matchedTechnologies.slice(0, 5).join(', ')}`,
      ],
    });
  }
  
  if (compatibilityResult.signals.domainContributionDepth > 70) {
    strengths.push({
      title: 'Deep Domain Experience',
      description: `Strong focus on ${compatibilityResult.explanation.role}-specific work with ${compatibilityResult.breakdown.contributionDepth.relevantPRs} relevant PRs.`,
      evidence: [
        `${compatibilityResult.breakdown.contributionDepth.relevantPRs} out of ${compatibilityResult.breakdown.contributionDepth.totalPRs} PRs are role-relevant`,
        `${Math.round(compatibilityResult.signals.domainContributionDepth)}% domain contribution depth`,
      ],
    });
  }
  
  if (compatibilityResult.breakdown.architecturePatterns.detectedPatterns.length > 0) {
    strengths.push({
      title: 'Architecture Pattern Recognition',
      description: `Recognized architecture patterns relevant to ${compatibilityResult.explanation.role} engineering.`,
      evidence: [
        `Patterns: ${compatibilityResult.breakdown.architecturePatterns.detectedPatterns.slice(0, 3).join(', ')}`,
        `${compatibilityResult.breakdown.architecturePatterns.detectedPatterns.length} architecture patterns detected`,
      ],
    });
  }
  
  return strengths;
}

// ============================================================================
// Concerns Generation
// ============================================================================

function generateConcerns(
  trustResult: TrustScoreResult,
  impactResult: ImpactScoreResult,
  compatibilityResult: CompatibilityScoreResult
): Array<{ title: string; description: string; severity: 'low' | 'medium' | 'high'; evidence: string[] }> {
  const concerns: Array<{ title: string; description: string; severity: 'low' | 'medium' | 'high'; evidence: string[] }> = [];
  
  // Trust concerns
  if (!trustResult.isAuthentic) {
    concerns.push({
      title: 'Profile Authenticity Concerns',
      description: 'Profile does not meet authenticity thresholds. May indicate spam, farming, or incomplete profile.',
      severity: 'high',
      evidence: trustResult.redFlags,
    });
  }
  
  if (trustResult.spamDetection.forkFarming) {
    concerns.push({
      title: 'Fork-Only Contributions',
      description: 'All contributions are to forked repositories. No contributions to original repositories detected.',
      severity: 'high',
      evidence: [
        '100% fork contribution ratio',
        'No original repository contributions',
      ],
    });
  }
  
  if (trustResult.signals.forkContributionRatio > 0.8) {
    concerns.push({
      title: 'High Fork Contribution Ratio',
      description: `Most contributions (${Math.round(trustResult.signals.forkContributionRatio * 100)}%) are to forked repositories.`,
      severity: 'medium',
      evidence: [
        `${Math.round(trustResult.signals.forkContributionRatio * 100)}% fork contributions`,
        'Limited original repository engagement',
      ],
    });
  }
  
  if (trustResult.signals.accountAge < 180) {
    concerns.push({
      title: 'New Account',
      description: `Account is relatively new (${Math.round(trustResult.signals.accountAge)} days old). Limited history available.`,
      severity: 'low',
      evidence: [
        `${Math.round(trustResult.signals.accountAge)} days old account`,
        'Limited contribution history',
      ],
    });
  }
  
  if (trustResult.signals.repositoryDiversity < 30) {
    concerns.push({
      title: 'Limited Repository Diversity',
      description: `Contributions concentrated in few repositories (${impactResult.signals.activeRepositories} repositories).`,
      severity: 'medium',
      evidence: [
        `${impactResult.signals.activeRepositories} active repositories`,
        'Limited breadth of experience',
      ],
    });
  }
  
  // Impact concerns
  if (impactResult.signals.totalMergedPRs < 5) {
    concerns.push({
      title: 'Limited Contribution History',
      description: `Only ${impactResult.signals.totalMergedPRs} merged PRs. Limited evidence of impact.`,
      severity: 'medium',
      evidence: [
        `${impactResult.signals.totalMergedPRs} total merged PRs`,
        'Insufficient data for comprehensive assessment',
      ],
    });
  }
  
  if (impactResult.components.longevity.score < 40) {
    concerns.push({
      title: 'Short Activity Span',
      description: `Limited contribution history (${Math.round(impactResult.signals.activitySpanMonths)} months). May indicate new or inconsistent contributor.`,
      severity: 'low',
      evidence: [
        `${Math.round(impactResult.signals.activitySpanMonths)} months of activity`,
        'Limited long-term consistency',
      ],
    });
  }
  
  if (impactResult.components.collaboration.score < 40) {
    concerns.push({
      title: 'Limited Collaboration',
      description: 'Few collaborative contributions. May indicate solo work or limited team interaction.',
      severity: 'low',
      evidence: [
        'Limited cross-repository contributions',
        'Few collaborative PRs',
      ],
    });
  }
  
  // Compatibility concerns
  if (compatibilityResult.compatibilityLevel === 'poor') {
    concerns.push({
      title: 'Poor Role Compatibility',
      description: `Limited alignment with ${compatibilityResult.explanation.role} role requirements.`,
      severity: 'high',
      evidence: compatibilityResult.explanation.weaknesses,
    });
  }
  
  if (compatibilityResult.signals.technologyStackMatch < 30) {
    concerns.push({
      title: 'Technology Stack Mismatch',
      description: `Limited experience with ${compatibilityResult.explanation.role} technologies.`,
      severity: 'medium',
      evidence: [
        `${compatibilityResult.breakdown.technologyStack.matchedTechnologies.length} matched technologies`,
        `Mismatched: ${compatibilityResult.breakdown.technologyStack.mismatchedTechnologies.slice(0, 3).join(', ')}`,
      ],
    });
  }
  
  if (compatibilityResult.signals.domainContributionDepth < 30) {
    concerns.push({
      title: 'Limited Domain Experience',
      description: `Only ${compatibilityResult.breakdown.contributionDepth.relevantPRs} out of ${compatibilityResult.breakdown.contributionDepth.totalPRs} PRs are role-relevant.`,
      severity: 'medium',
      evidence: [
        `${Math.round(compatibilityResult.signals.domainContributionDepth)}% domain contribution depth`,
        'Limited role-specific contributions',
      ],
    });
  }
  
  if (compatibilityResult.negativeSignals.technologyMismatch > 50) {
    concerns.push({
      title: 'Significant Technology Mismatch',
      description: 'High percentage of contributions in technologies not aligned with role.',
      severity: 'medium',
      evidence: [
        `${Math.round(compatibilityResult.negativeSignals.technologyMismatch)}% technology mismatch`,
        'Contributions in unrelated technologies',
      ],
    });
  }
  
  return concerns;
}

// ============================================================================
// Indicator Extraction
// ============================================================================

function extractTrustIndicators(trustResult: TrustScoreResult): {
  isAuthentic: boolean;
  confidence: number;
  keyTrustSignals: string[];
} {
  const signals: string[] = [];
  
  if (trustResult.isAuthentic) {
    signals.push('Authentic profile verified');
  }
  
  if (trustResult.signals.maintainerTrust > 80) {
    signals.push('High maintainer trust');
  }
  
  if (trustResult.signals.repositoryDiversity > 70) {
    signals.push('Strong repository diversity');
  }
  
  if (trustResult.signals.collaborationDepth > 70) {
    signals.push('Active collaboration');
  }
  
  if (trustResult.greenFlags.length > 0) {
    signals.push(...trustResult.greenFlags.slice(0, 3));
  }
  
  return {
    isAuthentic: trustResult.isAuthentic,
    confidence: trustResult.confidence,
    keyTrustSignals: signals,
  };
}

function extractCompatibilityIndicators(compatibilityResult: CompatibilityScoreResult): {
  role: string;
  fitLevel: 'high' | 'medium' | 'low' | 'poor';
  keySignals: string[];
} {
  const signals: string[] = [];
  
  if (compatibilityResult.signals.technologyStackMatch > 70) {
    signals.push('Strong technology alignment');
  }
  
  if (compatibilityResult.signals.domainContributionDepth > 70) {
    signals.push('Deep domain experience');
  }
  
  if (compatibilityResult.signals.architecturePatternMatch > 70) {
    signals.push('Recognized architecture patterns');
  }
  
  if (compatibilityResult.breakdown.architecturePatterns.detectedPatterns.length > 0) {
    signals.push(`${compatibilityResult.breakdown.architecturePatterns.detectedPatterns.length} architecture patterns`);
  }
  
  if (compatibilityResult.explanation.strengths.length > 0) {
    signals.push(...compatibilityResult.explanation.strengths.slice(0, 2));
  }
  
  return {
    role: compatibilityResult.explanation.role,
    fitLevel: compatibilityResult.compatibilityLevel,
    keySignals: signals,
  };
}

function extractImpactIndicators(impactResult: ImpactScoreResult): {
  contributionDepth: string;
  collaborationLevel: string;
  keyContributions: string[];
} {
  const contributions: string[] = [];
  
  contributions.push(`${impactResult.signals.totalMergedPRs} merged PRs`);
  contributions.push(`${impactResult.signals.activeRepositories} active repositories`);
  
  if (impactResult.explainability.topContributingRepos.length > 0) {
    const topRepo = impactResult.explainability.topContributingRepos[0];
    contributions.push(`Top contribution: ${topRepo.repo} (${topRepo.prCount} PRs)`);
  }
  
  let contributionDepth = 'Emerging';
  if (impactResult.totalScore > 70) {
    contributionDepth = 'Deep';
  } else if (impactResult.totalScore > 40) {
    contributionDepth = 'Moderate';
  }
  
  let collaborationLevel = 'Limited';
  if (impactResult.components.collaboration.score > 70) {
    collaborationLevel = 'Strong';
  } else if (impactResult.components.collaboration.score > 40) {
    collaborationLevel = 'Moderate';
  }
  
  return {
    contributionDepth,
    collaborationLevel,
    keyContributions: contributions,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildTrustEvidence(trustResult: TrustScoreResult): string[] {
  const evidence: string[] = [];
  
  if (trustResult.signals.accountAge > 365) {
    evidence.push(`Account age: ${Math.round(trustResult.signals.accountAge / 365)} years`);
  }
  
  if (trustResult.signals.repositoryDiversity > 70) {
    evidence.push('High repository diversity');
  }
  
  if (trustResult.signals.maintainerTrust > 80) {
    evidence.push('High maintainer trust');
  }
  
  if (trustResult.greenFlags.length > 0) {
    evidence.push(...trustResult.greenFlags.slice(0, 2));
  }
  
  return evidence;
}
