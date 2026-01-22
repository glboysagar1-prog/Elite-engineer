/**
 * Wecraft - Elite Engineers Discovery Platform
 * 
 * Main exports for all score calculators and types.
 */

// Types
export * from '../dashboard/convex/types/github';
export * from '../dashboard/convex/types/github-api';
export * from '../dashboard/convex/types/roles';
export * from '../dashboard/convex/types/scores';

// Score Calculators
export { calculateImpactScore } from '../dashboard/convex/scores/impact';
export { calculateTrustScore } from '../dashboard/convex/scores/trust';
export { calculateCompatibilityScore } from '../dashboard/convex/scores/compatibility';
export { calculateRecruiterMatchScore } from '../dashboard/convex/scores/recruiterMatch';

// GitHub Analyzer
export { createGitHubAnalyzer, GitHubAnalyzer } from './utils/github-analyzer';
export type { GitHubAnalyzerConfig } from './utils/github-analyzer';

// Explanation Generator
export { generateMatchExplanation } from './utils/explanation-generator';
export type { MatchExplanation } from './utils/explanation-generator';
