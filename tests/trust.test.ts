import { calculateTrustScore, GitHubAccount, ContributionPattern } from './trustScore';

describe('calculateTrustScore', () => {
  const createMockAccount = (overrides?: Partial<GitHubAccount>): GitHubAccount => {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    return {
      username: 'engineer1',
      createdAt: oneYearAgo,
      publicRepos: 10,
      followers: 50,
      following: 30,
      bio: 'Software engineer',
      location: 'San Francisco',
      company: 'Tech Corp',
      website: 'https://example.com',
      email: 'engineer@example.com',
      isVerified: false,
      ...overrides,
    };
  };

  const createMockPattern = (overrides?: Partial<ContributionPattern>): ContributionPattern => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    return {
      totalPRs: 20,
      mergedPRs: 15,
      openPRs: 3,
      closedPRs: 2,
      selfMergedPRs: 2,
      forkPRs: 3,
      originalRepoPRs: 17,
      forkOnlyRepos: [],
      originalRepoContributions: 17,
      firstContributionDate: sixMonthsAgo,
      lastContributionDate: now,
      contributionDays: 60,
      contributionMonths: 6,
      averagePRsPerDay: 0.1,
      maxPRsInSingleDay: 2,
      uniqueRepositories: 5,
      repositoriesWithMultiplePRs: 3,
      repositoriesWithMaintainerInteraction: 4,
      reviewsGiven: 10,
      reviewsReceived: 15,
      maintainerReviews: 12,
      issuesOpened: 8,
      issuesClosed: 6,
      issuesWithPRs: 5,
      commitMessagePatterns: new Map(),
      commitTimePatterns: [],
      identicalCommitMessages: 0,
      uniqueCollaborators: 10,
      maintainerInteractions: 12,
      crossRepositoryCollaborations: 8,
      ...overrides,
    };
  };

  it('should return low score for new account', () => {
    const account = createMockAccount({
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days old
    });
    const pattern = createMockPattern();
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.totalScore).toBeLessThan(60);
    expect(result.isAuthentic).toBe(false);
    expect(result.redFlags).toContain('Account too new');
  });

  it('should detect fork farming', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      forkPRs: 20,
      originalRepoPRs: 0,
      originalRepoContributions: 0,
      forkOnlyRepos: ['fork1', 'fork2', 'fork3'],
      totalPRs: 20,
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.spamDetection.forkFarming).toBe(true);
    expect(result.isAuthentic).toBe(false);
    expect(result.redFlags).toContain('Fork-only contributions detected');
    expect(result.components.antiGamingScore.breakdown.forkFarmingPenalty).toBe(100);
  });

  it('should penalize high fork ratio', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      forkPRs: 18,
      originalRepoPRs: 2,
      originalRepoContributions: 2,
      totalPRs: 20,
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.signals.forkContributionRatio).toBeGreaterThan(0.8);
    expect(result.redFlags).toContain('High fork contribution ratio');
    expect(result.components.antiGamingScore.breakdown.forkFarmingPenalty).toBeGreaterThan(0);
  });

  it('should detect self-merge farming', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      totalPRs: 20,
      mergedPRs: 20,
      selfMergedPRs: 15, // 75% self-merged
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.spamDetection.selfMergeFarming).toBe(true);
    expect(result.redFlags).toContain('High rate of self-merged PRs');
  });

  it('should detect excessive daily PRs', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      maxPRsInSingleDay: 25, // Exceeds default threshold of 20
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.spamDetection.excessiveDailyPRs).toBe(true);
    expect(result.redFlags).toContain('Excessive daily PR activity');
  });

  it('should detect repository farming', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      uniqueRepositories: 100,
      repositoriesWithMultiplePRs: 3, // Very low ratio
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.spamDetection.repositoryFarming).toBe(true);
    expect(result.redFlags).toContain('Repository farming pattern detected');
  });

  it('should detect identical commit messages', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      identicalCommitMessages: 10, // Exceeds default threshold of 5
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.spamDetection.identicalCommitMessages).toBe(true);
  });

  it('should reward authentic engineers', () => {
    const account = createMockAccount({
      createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), // 2 years old
      bio: 'Senior engineer',
      location: 'New York',
      company: 'Big Tech',
    });
    const pattern = createMockPattern({
      totalPRs: 50,
      mergedPRs: 45,
      selfMergedPRs: 2,
      forkPRs: 5,
      originalRepoPRs: 45,
      originalRepoContributions: 45,
      firstContributionDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      uniqueRepositories: 15,
      repositoriesWithMultiplePRs: 12,
      maintainerInteractions: 40,
      uniqueCollaborators: 25,
      crossRepositoryCollaborations: 20,
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.totalScore).toBeGreaterThan(70);
    expect(result.isAuthentic).toBe(true);
    expect(result.greenFlags.length).toBeGreaterThan(0);
    expect(result.components.antiGamingScore.breakdown.forkFarmingPenalty).toBe(0);
  });

  it('should flag insufficient repository diversity', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      uniqueRepositories: 1, // Below minimum of 2
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.redFlags).toContain('Insufficient repository diversity');
  });

  it('should calculate maintainer trust correctly', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      mergedPRs: 20,
      selfMergedPRs: 2, // 90% merged by maintainers
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.signals.maintainerTrust).toBeGreaterThan(80);
    expect(result.greenFlags).toContain('High maintainer trust');
  });

  it('should respect custom config', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      maxPRsInSingleDay: 15,
    });
    
    const result1 = calculateTrustScore(account, pattern);
    const result2 = calculateTrustScore(account, pattern, {
      maxPRsPerDay: 10,
    });
    
    // With lower threshold, should detect spam
    expect(result2.spamDetection.excessiveDailyPRs).toBe(true);
  });

  it('should handle empty contribution pattern', () => {
    const account = createMockAccount();
    const pattern = createMockPattern({
      totalPRs: 0,
      mergedPRs: 0,
      uniqueRepositories: 0,
      firstContributionDate: null,
      lastContributionDate: null,
    });
    
    const result = calculateTrustScore(account, pattern);
    
    expect(result.totalScore).toBeLessThan(50);
    expect(result.confidence).toBeLessThan(70);
  });
});
