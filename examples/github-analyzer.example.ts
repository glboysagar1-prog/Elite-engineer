/**
 * Example: Using GitHub Analyzer
 * 
 * Demonstrates how to fetch and normalize GitHub data.
 */

import { Octokit } from '@octokit/rest';
import { createGitHubAnalyzer } from '../src/utils/github-analyzer';
import { calculateImpactScore } from '../src/scores/impact';

async function example() {
  // Initialize Octokit
  // For public data, you can use without authentication
  // For higher rate limits, use: new Octokit({ auth: process.env.GITHUB_TOKEN })
  const octokit = new Octokit({
    // auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
  });

  // Create analyzer
  const analyzer = createGitHubAnalyzer(octokit, 'username', {
    rateLimitBuffer: 10, // Pause when < 10 requests remaining
    maxConcurrentRequests: 3, // Process 3 repos at a time
  });

  try {
    // Fetch all user data
    console.log('Fetching GitHub data...');
    const activity = await analyzer.fetchAllUserData();

    console.log(`\nFetched data:`);
    console.log(`- Merged PRs: ${activity.mergedPRs.length}`);
    console.log(`- Reviews Given: ${activity.reviewsGiven.length}`);
    console.log(`- Reviews Received: ${activity.reviewsReceived.length}`);
    console.log(`- Issues: ${activity.issues.length}`);
    console.log(`- Repositories: ${activity.repositories.length}`);

    // Calculate Impact Score
    const impactResult = calculateImpactScore(activity);
    console.log(`\nImpact Score: ${impactResult.totalScore.toFixed(1)}/100`);

    // Example: Access normalized PR data
    if (activity.mergedPRs.length > 0) {
      const firstPR = activity.mergedPRs[0];
      console.log(`\nExample PR:`);
      console.log(`- Repository: ${firstPR.repository}`);
      console.log(`- Merged: ${firstPR.mergedAt.toISOString()}`);
      console.log(`- Files Changed: ${firstPR.filesChanged}`);
      console.log(`- Is Maintainer Merge: ${firstPR.isMaintainerMerge}`);
      console.log(`- Is Fork: ${firstPR.isFork}`);
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Run example
if (require.main === module) {
  example();
}
