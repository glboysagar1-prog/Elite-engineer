/**
 * Wecraft - Elite Engineers Discovery Platform
 * 
 * Main exports for all score calculators and types.
 */

// Types
export * from './types/github';
export * from './types/github-api';
export * from './types/roles';
export * from './types/scores';

// Score Calculators
export { calculateImpactScore } from './scores/impact';
export { calculateTrustScore } from './scores/trust';
export { calculateCompatibilityScore } from './scores/compatibility';
export { calculateRecruiterMatchScore } from './scores/recruiterMatch';

// GitHub Analyzer
export { createGitHubAnalyzer, GitHubAnalyzer } from './utils/github-analyzer';
export type { GitHubAnalyzerConfig } from './utils/github-analyzer';

// Explanation Generator
export { generateMatchExplanation } from './utils/explanation-generator';
export type { MatchExplanation } from './utils/explanation-generator';
