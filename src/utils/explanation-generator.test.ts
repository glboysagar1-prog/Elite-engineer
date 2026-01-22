/**
 * Tests for Explanation Generator
 */

import { generateMatchExplanation } from './explanation-generator';
import type {
  TrustScoreResult,
  ImpactScoreResult,
  CompatibilityScoreResult,
} from '../types/scores';

describe('generateMatchExplanation', () => {
  const createMockTrustResult = (overrides?: Partial<TrustScoreResult>): TrustScoreResult => {
    return {
      totalScore: 80,
      isAuthentic: true,
      confidence: 90,
      components: {
        accountAuthenticity: { score: 85, breakdown: {} as any },
        contributionAuthenticity: { score: 80, breakdown: {} as any },
        collaborationSignals: { score: 75, breakdown: {} as any },
        antiGamingScore: { score: 90, breakdown: {} as any },
      },
      signals: {
        accountAge: 730,
        accountMaturity: 80,
        contributionSpan: 400,
        repositoryDiversity: 75,
        maintainerTrust: 85,
        collaborationDepth: 70,
        forkContributionRatio: 0.2,
        originalRepoContributionRatio: 0.8,
      },
      spamDetection: {
        excessiveDailyPRs: false,
        excessiveHourlyActivity: false,
        identicalCommitMessages: false,
        automatedPatterns: false,
        suspiciousTimePatterns: false,
        trivialPRs: 0,
        whitespaceOnlyPRs: 0,
        singleCharacterPRs: 0,
        forkFarming: false,
        selfMergeFarming: false,
        repositoryFarming: false,
      },
      redFlags: [],
      greenFlags: ['High maintainer trust', 'Strong repository diversity'],
      ...overrides,
    };
  };

  const createMockImpactResult = (overrides?: Partial<ImpactScoreResult>): ImpactScoreResult => {
    return {
      totalScore: 75,
      components: {
        prImpact: {
          score: 80,
          breakdown: {
            mergedPRCount: 80,
            reviewEngagement: 75,
            acceptanceRate: 100,
            repoDiversity: 70,
            maintainerTrust: 85,
          },
        },
        collaboration: {
          score: 70,
          breakdown: {
            crossRepoContributions: 70,
            reviewReciprocity: 65,
            issueEngagement: 60,
            teamParticipation: 75,
          },
        },
        longevity: {
          score: 75,
          breakdown: {
            activitySpan: 24,
            consistency: 80,
            temporalDistribution: 70,
          },
        },
        quality: {
          score: 70,
          breakdown: {
            reviewDepth: 70,
            maintainerTrust: 80,
            contributionComplexity: 65,
            antiSpamScore: 90,
          },
        },
      },
      signals: {
        totalMergedPRs: 50,
        selfMergedPRs: 2,
        spamPRs: 0,
        activeRepositories: 10,
        activitySpanMonths: 24,
      },
      explainability: {
        topContributingRepos: [
          { repo: 'repo1', prCount: 15, score: 150 },
          { repo: 'repo2', prCount: 10, score: 100 },
        ],
        recentActivity: [],
        penalties: [],
      },
      ...overrides,
    };
  };

  const createMockCompatibilityResult = (overrides?: Partial<CompatibilityScoreResult>): CompatibilityScoreResult => {
    return {
      totalScore: 80,
      compatibilityLevel: 'high',
      signals: {
        technologyStackMatch: 85,
        domainContributionDepth: 80,
        architecturePatternMatch: 75,
        fileTypeAlignment: 80,
        activityTypeMatch: 75,
        repositoryTypeMatch: 70,
        reviewDomainExpertise: 70,
      },
      negativeSignals: {
        technologyMismatch: 10,
        domainContradiction: 5,
        insufficientDepth: 0,
        architectureMismatch: 0,
        technologyOverweight: 0,
      },
      explanation: {
        role: 'backend',
        strengths: [
          'Strong technology stack match with 5 relevant technologies',
          'Deep domain contributions: 15/20 relevant PRs',
        ],
        weaknesses: [],
        evidence: [],
      },
      breakdown: {
        technologyStack: {
          matchedTechnologies: ['python', 'go', 'java'],
          mismatchedTechnologies: [],
          score: 85,
        },
        contributionDepth: {
          relevantPRs: 15,
          totalPRs: 20,
          score: 80,
        },
        architecturePatterns: {
          detectedPatterns: ['microservices', 'api-gateway'],
          score: 75,
        },
      },
      ...overrides,
    };
  };

  it('should generate explanation for strong match', () => {
    const trust = createMockTrustResult();
    const impact = createMockImpactResult();
    const compatibility = createMockCompatibilityResult();

    const explanation = generateMatchExplanation(trust, impact, compatibility);

    expect(explanation.whyThisMatch).toBeDefined();
    expect(explanation.whyThisMatch.length).toBeGreaterThan(0);
    expect(explanation.strengths.length).toBeGreaterThan(0);
    expect(explanation.concerns.length).toBeGreaterThanOrEqual(0);
    expect(explanation.trustIndicators.isAuthentic).toBe(true);
    expect(explanation.compatibilityIndicators.fitLevel).toBe('high');
  });

  it('should identify fork farming as high severity concern', () => {
    const trust = createMockTrustResult({
      spamDetection: {
        excessiveDailyPRs: false,
        excessiveHourlyActivity: false,
        identicalCommitMessages: false,
        automatedPatterns: false,
        suspiciousTimePatterns: false,
        trivialPRs: 0,
        whitespaceOnlyPRs: 0,
        singleCharacterPRs: 0,
        forkFarming: true,
        selfMergeFarming: false,
        repositoryFarming: false,
      },
    });
    const impact = createMockImpactResult();
    const compatibility = createMockCompatibilityResult();

    const explanation = generateMatchExplanation(trust, impact, compatibility);

    const forkConcern = explanation.concerns.find(c => c.title.includes('Fork'));
    expect(forkConcern).toBeDefined();
    expect(forkConcern?.severity).toBe('high');
  });

  it('should identify limited contribution history as concern', () => {
    const trust = createMockTrustResult();
    const impact = createMockImpactResult({
      signals: {
        totalMergedPRs: 3,
        selfMergedPRs: 0,
        spamPRs: 0,
        activeRepositories: 2,
        activitySpanMonths: 3,
      },
    });
    const compatibility = createMockCompatibilityResult();

    const explanation = generateMatchExplanation(trust, impact, compatibility);

    const historyConcern = explanation.concerns.find(c => c.title.includes('Limited Contribution'));
    expect(historyConcern).toBeDefined();
    expect(historyConcern?.severity).toBe('medium');
  });

  it('should identify poor compatibility as high severity concern', () => {
    const trust = createMockTrustResult();
    const impact = createMockImpactResult();
    const compatibility = createMockCompatibilityResult({
      compatibilityLevel: 'poor',
      explanation: {
        role: 'backend',
        strengths: [],
        weaknesses: ['Limited technology stack alignment'],
        evidence: [],
      },
    });

    const explanation = generateMatchExplanation(trust, impact, compatibility);

    const compatibilityConcern = explanation.concerns.find(c => c.title.includes('Poor Role'));
    expect(compatibilityConcern).toBeDefined();
    expect(compatibilityConcern?.severity).toBe('high');
  });

  it('should generate strengths for high scores', () => {
    const trust = createMockTrustResult({
      signals: {
        accountAge: 730,
        accountMaturity: 80,
        contributionSpan: 400,
        repositoryDiversity: 85,
        maintainerTrust: 90,
        collaborationDepth: 80,
        forkContributionRatio: 0.1,
        originalRepoContributionRatio: 0.9,
      },
    });
    const impact = createMockImpactResult({
      components: {
        prImpact: { score: 85, breakdown: {} as any },
        collaboration: { score: 80, breakdown: {} as any },
        longevity: { score: 80, breakdown: {} as any },
        quality: { score: 75, breakdown: {} as any },
      },
    });
    const compatibility = createMockCompatibilityResult({
      signals: {
        technologyStackMatch: 90,
        domainContributionDepth: 85,
        architecturePatternMatch: 80,
        fileTypeAlignment: 85,
        activityTypeMatch: 80,
        repositoryTypeMatch: 75,
        reviewDomainExpertise: 75,
      },
    });

    const explanation = generateMatchExplanation(trust, impact, compatibility);

    expect(explanation.strengths.length).toBeGreaterThan(5);
    expect(explanation.strengths.some(s => s.title.includes('Authentic'))).toBe(true);
    expect(explanation.strengths.some(s => s.title.includes('Maintainer'))).toBe(true);
    expect(explanation.strengths.some(s => s.title.includes('Technology'))).toBe(true);
  });

  it('should not generate scores or rankings', () => {
    const trust = createMockTrustResult();
    const impact = createMockImpactResult();
    const compatibility = createMockCompatibilityResult();

    const explanation = generateMatchExplanation(trust, impact, compatibility);

    // Should not contain numerical scores in explanations
    const explanationText = JSON.stringify(explanation);
    
    // Should not rank engineers (no "rank", "position", "top N" language)
    expect(explanationText).not.toMatch(/rank|position|top \d+|#\d+/i);
    
    // Should explain, not score
    expect(explanation.whyThisMatch).toBeDefined();
    expect(explanation.strengths.length).toBeGreaterThan(0);
  });
});
