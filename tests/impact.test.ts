import { calculateImpactScore, GitHubActivity } from './impactScore';

describe('calculateImpactScore', () => {
  const createMockActivity = (overrides?: Partial<GitHubActivity>): GitHubActivity => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    return {
      mergedPRs: [],
      reviewsGiven: [],
      reviewsReceived: [],
      issues: [],
      repositories: [],
      activitySpan: {
        firstPRDate: oneYearAgo,
        lastPRDate: now,
      },
      ...overrides,
    };
  };

  it('should return zero score for empty activity', () => {
    const activity = createMockActivity();
    const result = calculateImpactScore(activity);
    
    expect(result.totalScore).toBe(0);
    expect(result.components.prImpact.score).toBe(0);
    expect(result.components.collaboration.score).toBe(0);
    expect(result.components.longevity.score).toBe(0);
    expect(result.components.quality.score).toBe(0);
  });

  it('should exclude self-merged PRs', () => {
    const activity = createMockActivity({
      mergedPRs: [
        {
          id: '1',
          repository: 'repo1',
          mergedAt: new Date(),
          mergedBy: 'engineer1',
          author: 'engineer1', // Self-merged
          reviewCommentsReceived: 5,
          reviewRounds: 2,
          filesChanged: 10,
          directoriesTouched: 3,
          isMaintainerMerge: false,
          isFork: false,
          timeToMerge: 24,
        },
      ],
    });
    
    const result = calculateImpactScore(activity);
    
    expect(result.signals.selfMergedPRs).toBe(1);
    expect(result.signals.totalMergedPRs).toBe(1);
    expect(result.totalScore).toBe(0);
  });

  it('should filter spam PRs', () => {
    const now = new Date();
    const spamPRs = Array.from({ length: 15 }, (_, i) => ({
      id: `spam-${i}`,
      repository: 'repo1',
      mergedAt: new Date(now.getTime() - i * 1000),
      mergedBy: 'maintainer1',
      author: 'engineer1',
      reviewCommentsReceived: 0,
      reviewRounds: 0,
      filesChanged: 0, // Too small
      directoriesTouched: 0,
      isMaintainerMerge: true,
      isFork: false,
      timeToMerge: 1,
    }));
    
    const activity = createMockActivity({
      mergedPRs: spamPRs,
    });
    
    const result = calculateImpactScore(activity);
    
    expect(result.signals.spamPRs).toBeGreaterThan(0);
  });

  it('should calculate score for valid merged PRs', () => {
    const now = new Date();
    const activity = createMockActivity({
      mergedPRs: [
        {
          id: '1',
          repository: 'repo1',
          mergedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          mergedBy: 'maintainer1',
          author: 'engineer1',
          reviewCommentsReceived: 8,
          reviewRounds: 3,
          filesChanged: 15,
          directoriesTouched: 5,
          isMaintainerMerge: true,
          isFork: false,
          timeToMerge: 48,
        },
        {
          id: '2',
          repository: 'repo2',
          mergedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          mergedBy: 'maintainer2',
          author: 'engineer1',
          reviewCommentsReceived: 5,
          reviewRounds: 2,
          filesChanged: 20,
          directoriesTouched: 6,
          isMaintainerMerge: true,
          isFork: false,
          timeToMerge: 72,
        },
      ],
      reviewsGiven: [
        {
          id: 'r1',
          repository: 'repo1',
          prId: 'other-pr-1',
          reviewedAt: new Date(),
          reviewer: 'engineer1',
          reviewee: 'engineer2',
          commentCount: 3,
        },
      ],
      reviewsReceived: [
        {
          id: 'r2',
          repository: 'repo1',
          prId: '1',
          reviewedAt: new Date(),
          reviewer: 'maintainer1',
          reviewee: 'engineer1',
          commentCount: 8,
        },
      ],
      issues: [
        {
          id: 'i1',
          repository: 'repo1',
          openedAt: new Date(),
          author: 'engineer1',
          ledToMergedPR: true,
          commentCount: 5,
        },
      ],
      repositories: [
        {
          repository: 'repo1',
          mergedPRCount: 1,
          isFork: false,
          contributorCount: 10,
          maintainerCount: 2,
        },
        {
          repository: 'repo2',
          mergedPRCount: 1,
          isFork: false,
          contributorCount: 5,
          maintainerCount: 1,
        },
      ],
    });
    
    const result = calculateImpactScore(activity);
    
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.components.prImpact.score).toBeGreaterThan(0);
    expect(result.components.collaboration.score).toBeGreaterThan(0);
    expect(result.components.longevity.score).toBeGreaterThan(0);
    expect(result.components.quality.score).toBeGreaterThan(0);
    expect(result.signals.activeRepositories).toBe(2);
    expect(result.explainability.topContributingRepos.length).toBeGreaterThan(0);
  });

  it('should penalize fork contributions', () => {
    const now = new Date();
    const activity = createMockActivity({
      mergedPRs: [
        {
          id: '1',
          repository: 'forked-repo',
          mergedAt: now,
          mergedBy: 'maintainer1',
          author: 'engineer1',
          reviewCommentsReceived: 5,
          reviewRounds: 2,
          filesChanged: 10,
          directoriesTouched: 3,
          isMaintainerMerge: true,
          isFork: true, // Fork contribution
          timeToMerge: 24,
        },
      ],
    });
    
    const result = calculateImpactScore(activity);
    
    expect(result.components.quality.breakdown.antiSpamScore).toBeLessThan(100);
  });

  it('should respect custom weights', () => {
    const activity = createMockActivity({
      mergedPRs: [
        {
          id: '1',
          repository: 'repo1',
          mergedAt: new Date(),
          mergedBy: 'maintainer1',
          author: 'engineer1',
          reviewCommentsReceived: 5,
          reviewRounds: 2,
          filesChanged: 10,
          directoriesTouched: 3,
          isMaintainerMerge: true,
          isFork: false,
          timeToMerge: 24,
        },
      ],
    });
    
    const result1 = calculateImpactScore(activity);
    const result2 = calculateImpactScore(activity, {
      weights: {
        prImpact: 0.8,
        collaboration: 0.1,
        longevity: 0.05,
        quality: 0.05,
      },
    });
    
    // Scores should differ due to different weights
    expect(result1.totalScore).not.toBe(result2.totalScore);
  });
});
