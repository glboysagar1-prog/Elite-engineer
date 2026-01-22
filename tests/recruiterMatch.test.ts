import { calculateRecruiterMatchScore } from './recruiterMatchScore';
import { TrustScoreResult } from './trustScore';
import { CompatibilityScoreResult } from './compatibilityScore';
import { ImpactScoreResult } from './impactScore';

describe('calculateRecruiterMatchScore', () => {
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
      signals: {} as any,
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
      greenFlags: ['High maintainer trust'],
      ...overrides,
    };
  };

  const createMockCompatibilityResult = (overrides?: Partial<CompatibilityScoreResult>): CompatibilityScoreResult => {
    return {
      totalScore: 75,
      compatibilityLevel: 'high',
      signals: {
        technologyStackMatch: 80,
        domainContributionDepth: 75,
        architecturePatternMatch: 70,
        fileTypeAlignment: 80,
        activityTypeMatch: 75,
        repositoryTypeMatch: 70,
        reviewDomainExpertise: 65,
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
        strengths: ['Strong technology stack match', 'Deep domain contributions'],
        weaknesses: [],
        evidence: [],
      },
      breakdown: {
        technologyStack: {
          matchedTechnologies: ['python', 'go'],
          mismatchedTechnologies: [],
          score: 80,
        },
        contributionDepth: {
          relevantPRs: 15,
          totalPRs: 20,
          score: 75,
        },
        architecturePatterns: {
          detectedPatterns: ['microservices', 'api-gateway'],
          score: 70,
        },
      },
      ...overrides,
    };
  };

  const createMockImpactResult = (overrides?: Partial<ImpactScoreResult>): ImpactScoreResult => {
    return {
      totalScore: 70,
      components: {
        prImpact: { score: 75, breakdown: {} as any },
        collaboration: { score: 70, breakdown: {} as any },
        longevity: { score: 65, breakdown: {} as any },
        quality: { score: 70, breakdown: {} as any },
      },
      signals: {
        totalMergedPRs: 50,
        selfMergedPRs: 2,
        spamPRs: 0,
        activeRepositories: 10,
        activitySpanMonths: 24,
      },
      explainability: {
        topContributingRepos: [],
        recentActivity: [],
        penalties: [],
      },
      ...overrides,
    };
  };

  it('should calculate match score with default weights', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    // Trust: 80 * 0.4 = 32
    // Compatibility: 75 * 0.4 = 30
    // Impact: 70 * 0.2 = 14
    // Total: 76 (with potential boosts)
    expect(result.totalMatchScore).toBeGreaterThan(70);
    expect(result.totalMatchScore).toBeLessThanOrEqual(100);
  });

  it('should apply trust boost for high trust score', () => {
    const trust = createMockTrustResult({ totalScore: 85 }); // Above 80 threshold
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.calculationDetails.boosts.trust).toBeGreaterThan(1);
  });

  it('should apply compatibility boost for high compatibility score', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 90 }); // Above 85 threshold
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.calculationDetails.boosts.compatibility).toBeGreaterThan(1);
  });

  it('should apply impact boost for high impact score', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 95 }); // Above 90 threshold
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.calculationDetails.boosts.impact).toBeGreaterThan(1);
  });

  it('should return zero score if trust below threshold', () => {
    const trust = createMockTrustResult({ totalScore: 40 }); // Below 50 threshold
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.totalMatchScore).toBe(0);
  });

  it('should return zero score if compatibility below threshold', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 20 }); // Below 30 threshold
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.totalMatchScore).toBe(0);
  });

  it('should return zero score if impact below threshold', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 10 }); // Below 20 threshold
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.totalMatchScore).toBe(0);
  });

  it('should generate recruiter view with simplified information', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.recruiterView.matchScore).toBeGreaterThan(0);
    expect(result.recruiterView.matchLevel).toBeDefined();
    expect(result.recruiterView.recommendation).toBeDefined();
    expect(result.recruiterView.trustScore).toBe(80);
    expect(result.recruiterView.fitScore).toBe(75); // Compatibility renamed
    expect(result.recruiterView.impactScore).toBe(70);
    expect(result.recruiterView.strengths).toBeDefined();
    expect(result.recruiterView.concerns).toBeDefined();
    expect(result.recruiterView.summary).toBeDefined();
  });

  it('should generate engineer view without match score', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.engineerView.trustScore).toBeDefined();
    expect(result.engineerView.compatibilityScore).toBeDefined();
    expect(result.engineerView.impactScore).toBeDefined();
    expect(result.engineerView.improvementSuggestions).toBeDefined();
    // Engineer should NOT see match score or recommendation
    expect((result.engineerView as any).matchScore).toBeUndefined();
  });

  it('should show red flags in recruiter view for fork farming', () => {
    const trust = createMockTrustResult({
      totalScore: 60,
      spamDetection: {
        excessiveDailyPRs: false,
        excessiveHourlyActivity: false,
        identicalCommitMessages: false,
        automatedPatterns: false,
        suspiciousTimePatterns: false,
        trivialPRs: 0,
        whitespaceOnlyPRs: 0,
        singleCharacterPRs: 0,
        forkFarming: true, // Red flag
        selfMergeFarming: false,
        repositoryFarming: false,
      },
    });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    expect(result.recruiterView.redFlags.length).toBeGreaterThan(0);
    expect(result.recruiterView.redFlags.some(flag => flag.includes('Fork'))).toBe(true);
  });

  it('should respect custom weights', () => {
    const trust = createMockTrustResult({ totalScore: 80 });
    const compatibility = createMockCompatibilityResult({ totalScore: 75 });
    const impact = createMockImpactResult({ totalScore: 70 });
    
    const result1 = calculateRecruiterMatchScore(trust, compatibility, impact);
    const result2 = calculateRecruiterMatchScore(trust, compatibility, impact, {
      weights: {
        trust: 0.2,
        compatibility: 0.6,
        impact: 0.2,
      },
    });
    
    // With different weights, scores should differ
    expect(result1.totalMatchScore).not.toBe(result2.totalMatchScore);
    expect(result2.calculationDetails.weights.compatibility).toBe(0.6);
  });

  it('should set match level correctly based on score', () => {
    const trust = createMockTrustResult({ totalScore: 90 });
    const compatibility = createMockCompatibilityResult({ totalScore: 90 });
    const impact = createMockImpactResult({ totalScore: 90 });
    
    const result = calculateRecruiterMatchScore(trust, compatibility, impact);
    
    if (result.totalMatchScore >= 85) {
      expect(result.recruiterView.matchLevel).toBe('excellent');
      expect(result.recruiterView.recommendation).toBe('strongly-recommend');
    }
  });
});
