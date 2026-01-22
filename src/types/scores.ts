/**
 * Score Result Types
 * 
 * Types for all score calculation results.
 */

// ============================================================================
// Impact Score Types
// ============================================================================

export interface ImpactScoreConfig {
  weights?: {
    prImpact?: number;
    collaboration?: number;
    longevity?: number;
    quality?: number;
  };
  timeDecayFactor?: number;
  minPRSize?: number;
  maxPRFrequency?: number;
  activityWindowMonths?: number;
  selfMergePenalty?: number;
}

export interface ComponentBreakdown {
  mergedPRCount: number;
  reviewEngagement: number;
  acceptanceRate: number;
  repoDiversity: number;
  maintainerTrust: number;
}

export interface CollaborationBreakdown {
  crossRepoContributions: number;
  reviewReciprocity: number;
  issueEngagement: number;
  teamParticipation: number;
}

export interface LongevityBreakdown {
  activitySpan: number;
  consistency: number;
  temporalDistribution: number;
}

export interface QualityBreakdown {
  reviewDepth: number;
  maintainerTrust: number;
  contributionComplexity: number;
  antiSpamScore: number;
}

export interface ImpactScoreResult {
  totalScore: number; // 0-100
  components: {
    prImpact: {
      score: number;
      breakdown: ComponentBreakdown;
    };
    collaboration: {
      score: number;
      breakdown: CollaborationBreakdown;
    };
    longevity: {
      score: number;
      breakdown: LongevityBreakdown;
    };
    quality: {
      score: number;
      breakdown: QualityBreakdown;
    };
  };
  signals: {
    totalMergedPRs: number;
    selfMergedPRs: number;
    spamPRs: number;
    activeRepositories: number;
    activitySpanMonths: number;
  };
  explainability: {
    topContributingRepos: Array<{ repo: string; prCount: number; score: number }>;
    recentActivity: Array<{ date: Date; event: string; impact: number }>;
    penalties: Array<{ reason: string; count: number; impact: number }>;
  };
}

// ============================================================================
// Trust Score Types
// ============================================================================

export interface SpamDetection {
  // Frequency-based spam
  excessiveDailyPRs: boolean;
  excessiveHourlyActivity: boolean;
  
  // Pattern-based spam
  identicalCommitMessages: boolean;
  automatedPatterns: boolean;
  suspiciousTimePatterns: boolean;
  
  // Content-based spam
  trivialPRs: number; // PRs with minimal changes
  whitespaceOnlyPRs: number;
  singleCharacterPRs: number;
  
  // Behavioral spam
  forkFarming: boolean; // Only contributing to own forks
  selfMergeFarming: boolean; // High rate of self-merges
  repositoryFarming: boolean; // Many repos with single trivial PR
}

export interface TrustScoreConfig {
  // Thresholds
  maxPRsPerDay?: number; // Default 20
  maxPRsPerHour?: number; // Default 5
  minAccountAgeDays?: number; // Default 30
  minUniqueRepos?: number; // Default 2
  forkOnlyPenalty?: number; // Default 0.5 (50% penalty)
  identicalMessageThreshold?: number; // Default 5
  
  // Weights
  weights?: {
    accountAuthenticity?: number; // Default 0.25
    contributionAuthenticity?: number; // Default 0.35
    collaborationSignals?: number; // Default 0.25
    antiGamingScore?: number; // Default 0.15
  };
}

export interface TrustSignals {
  accountAge: number; // Days
  accountMaturity: number; // 0-100
  contributionSpan: number; // Days between first and last
  repositoryDiversity: number; // 0-100
  maintainerTrust: number; // 0-100
  collaborationDepth: number; // 0-100
  forkContributionRatio: number; // 0-1
  originalRepoContributionRatio: number; // 0-1
}

export interface TrustScoreResult {
  totalScore: number; // 0-100
  isAuthentic: boolean; // Pass/fail threshold
  confidence: number; // 0-100, how confident we are
  
  components: {
    accountAuthenticity: {
      score: number;
      breakdown: {
        accountAge: number;
        accountMaturity: number;
        profileCompleteness: number;
      };
    };
    contributionAuthenticity: {
      score: number;
      breakdown: {
        contributionSpan: number;
        repositoryDiversity: number;
        maintainerTrust: number;
        temporalConsistency: number;
      };
    };
    collaborationSignals: {
      score: number;
      breakdown: {
        uniqueCollaborators: number;
        maintainerInteractions: number;
        crossRepoCollaborations: number;
        reviewReciprocity: number;
      };
    };
    antiGamingScore: {
      score: number;
      breakdown: {
        spamDetection: number;
        forkFarmingPenalty: number;
        patternAnomalies: number;
        behavioralRedFlags: number;
      };
    };
  };
  
  signals: TrustSignals;
  spamDetection: SpamDetection;
  redFlags: string[];
  greenFlags: string[];
}

// ============================================================================
// Compatibility Score Types
// ============================================================================

export interface CompatibilitySignals {
  // Signal 1: Technology Stack Alignment
  technologyStackMatch: number; // 0-100
  
  // Signal 2: Contribution Depth in Role Domain
  domainContributionDepth: number; // 0-100
  
  // Signal 3: Architecture Pattern Recognition
  architecturePatternMatch: number; // 0-100
  
  // Signal 4: File Type Distribution
  fileTypeAlignment: number; // 0-100
  
  // Signal 5: Issue/PR Type Patterns
  activityTypeMatch: number; // 0-100
  
  // Signal 6: Repository Type Distribution
  repositoryTypeMatch: number; // 0-100
  
  // Signal 7: Code Review Domain Expertise
  reviewDomainExpertise: number; // 0-100
}

export interface NegativeSignals {
  // Mismatched technology stack
  technologyMismatch: number; // 0-100, higher = worse match
  
  // Contributions in opposite domain
  domainContradiction: number; // 0-100
  
  // Lack of relevant experience
  insufficientDepth: number; // 0-100
  
  // Wrong architecture patterns
  architectureMismatch: number; // 0-100
  
  // Over-reliance on unrelated technologies
  technologyOverweight: number; // 0-100
}

export interface CompatibilityScoreResult {
  totalScore: number; // 0-100
  compatibilityLevel: 'high' | 'medium' | 'low' | 'poor';
  
  signals: CompatibilitySignals;
  negativeSignals: NegativeSignals;
  
  explanation: {
    role: string;
    strengths: string[];
    weaknesses: string[];
    evidence: Array<{
      type: string;
      description: string;
      score: number;
    }>;
  };
  
  breakdown: {
    technologyStack: {
      matchedTechnologies: string[];
      mismatchedTechnologies: string[];
      score: number;
    };
    contributionDepth: {
      relevantPRs: number;
      totalPRs: number;
      score: number;
    };
    architecturePatterns: {
      detectedPatterns: string[];
      score: number;
    };
  };
}

// ============================================================================
// Recruiter Match Score Types
// ============================================================================

export interface RecruiterMatchScoreConfig {
  weights?: {
    trust?: number; // Default 0.4 (40%)
    compatibility?: number; // Default 0.4 (40%)
    impact?: number; // Default 0.2 (20%)
  };
  
  // Minimum thresholds (scores below these fail the match)
  minimumThresholds?: {
    trust?: number; // Default 50
    compatibility?: number; // Default 30
    impact?: number; // Default 20
  };
  
  // Boost factors for exceptional performance
  boostFactors?: {
    highTrustBoost?: number; // Default 1.1 (10% boost if trust > 80)
    highCompatibilityBoost?: number; // Default 1.15 (15% boost if compatibility > 85)
    highImpactBoost?: number; // Default 1.05 (5% boost if impact > 90)
  };
}

export interface RecruiterView {
  // Main score
  matchScore: number; // 0-100
  matchLevel: 'excellent' | 'strong' | 'good' | 'fair' | 'poor';
  recommendation: 'strongly-recommend' | 'recommend' | 'consider' | 'not-recommended';
  
  // Component scores (simplified for recruiters)
  trustScore: number;
  fitScore: number; // Compatibility renamed for clarity
  impactScore: number;
  
  // Quick insights
  strengths: string[];
  concerns: string[];
  
  // Match quality indicators
  isAuthentic: boolean;
  isGoodFit: boolean;
  hasImpact: boolean;
  
  // Red flags (only show critical issues)
  redFlags: string[];
  
  // Summary explanation
  summary: string;
}

export interface EngineerView {
  // Their own scores (full transparency)
  trustScore: {
    total: number;
    isAuthentic: boolean;
    confidence: number;
    components: {
      accountAuthenticity: number;
      contributionAuthenticity: number;
      collaborationSignals: number;
      antiGamingScore: number;
    };
    greenFlags: string[];
    redFlags: string[];
  };
  
  compatibilityScore: {
    total: number;
    compatibilityLevel: string;
    signals: {
      technologyStackMatch: number;
      domainContributionDepth: number;
      architecturePatternMatch: number;
      fileTypeAlignment: number;
      activityTypeMatch: number;
      repositoryTypeMatch: number;
      reviewDomainExpertise: number;
    };
    strengths: string[];
    weaknesses: string[];
  };
  
  impactScore: {
    total: number;
    components: {
      prImpact: number;
      collaboration: number;
      longevity: number;
      quality: number;
    };
    signals: {
      totalMergedPRs: number;
      activeRepositories: number;
      activitySpanMonths: number;
    };
  };
  
  // What they can improve
  improvementSuggestions: string[];
  
  // Privacy: They don't see recruiter match score or recommendations
}

export interface RecruiterMatchScoreResult {
  // Combined score
  totalMatchScore: number; // 0-100
  
  // Component scores
  trustComponent: number;
  compatibilityComponent: number;
  impactComponent: number;
  
  // Recruiter view (simplified, actionable)
  recruiterView: RecruiterView;
  
  // Engineer view (full transparency, no match score)
  engineerView: EngineerView;
  
  // Metadata
  calculationDetails: {
    weights: { trust: number; compatibility: number; impact: number };
    thresholds: { trust: number; compatibility: number; impact: number };
    boosts: {
      trustBoost: number;
      compatibilityBoost: number;
      impactBoost: number;
    };
  };
}
