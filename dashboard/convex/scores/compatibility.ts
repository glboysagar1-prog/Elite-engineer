/**
 * Wecraft Role-Aware Compatibility Score Calculator
 * 
 * Determines how well an engineer's GitHub proof-of-work matches a specific role.
 * Uses only public GitHub data - no self-reported skills.
 */

import type {
  RoleType,
  RoleQuery,
} from '../types/roles';

import type {
  RepositoryAnalysis,
  FileChangeAnalysis,
  PRAnalysis,
  IssueAnalysis,
  EngineerActivity,
} from '../types/github';

import type {
  CompatibilitySignals,
  NegativeSignals,
  CompatibilityScoreResult,
} from '../types/scores';

// Role-specific technology indicators
const ROLE_TECHNOLOGY_INDICATORS: Record<RoleType, {
  languages: string[];
  fileExtensions: string[];
  keywords: string[];
  architecturePatterns: string[];
  negativeIndicators: string[]; // Technologies that suggest different role
}> = {
  backend: {
    languages: ['python', 'java', 'go', 'rust', 'ruby', 'php', 'scala', 'kotlin', 'c#', 'c++'],
    fileExtensions: ['.py', '.java', '.go', '.rs', '.rb', '.php', '.scala', '.kt', '.cs', '.cpp'],
    keywords: ['api', 'server', 'backend', 'service', 'microservice', 'rest', 'graphql', 'grpc', 'database', 'orm'],
    architecturePatterns: ['microservices', 'monolith', 'api-gateway', 'service-mesh', 'event-driven'],
    negativeIndicators: ['react', 'vue', 'angular', 'css', 'html', 'frontend', 'ui-component'],
  },
  frontend: {
    languages: ['javascript', 'typescript', 'html', 'css', 'scss', 'sass', 'less'],
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.sass', '.less', '.vue'],
    keywords: ['react', 'vue', 'angular', 'component', 'ui', 'frontend', 'client', 'browser', 'dom'],
    architecturePatterns: ['spa', 'ssr', 'component-library', 'design-system', 'pwa'],
    negativeIndicators: ['database', 'server', 'api-server', 'microservice', 'backend-service'],
  },
  fullstack: {
    languages: ['javascript', 'typescript', 'python', 'java', 'ruby', 'php'],
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.rb', '.php'],
    keywords: ['fullstack', 'full-stack', 'api', 'component', 'server', 'client'],
    architecturePatterns: ['monorepo', 'fullstack-app', 'isomorphic'],
    negativeIndicators: [],
  },
  devops: {
    languages: ['yaml', 'python', 'bash', 'shell', 'groovy'],
    fileExtensions: ['.yaml', '.yml', '.tf', '.tfvars', '.sh', '.py', '.groovy', '.jenkinsfile'],
    keywords: ['docker', 'kubernetes', 'ci/cd', 'terraform', 'ansible', 'pipeline', 'deployment', 'infrastructure'],
    architecturePatterns: ['infrastructure-as-code', 'ci-cd', 'containerization', 'orchestration'],
    negativeIndicators: ['ui-component', 'frontend', 'react-component'],
  },
  mobile: {
    languages: ['swift', 'kotlin', 'java', 'dart', 'objective-c'],
    fileExtensions: ['.swift', '.kt', '.java', '.dart', '.m', '.mm', '.xcodeproj'],
    keywords: ['ios', 'android', 'mobile', 'app', 'react-native', 'flutter', 'xcode'],
    architecturePatterns: ['mobile-app', 'native-app', 'cross-platform'],
    negativeIndicators: ['web-server', 'backend-api', 'microservice'],
  },
  'data-engineer': {
    languages: ['python', 'sql', 'scala', 'java'],
    fileExtensions: ['.py', '.sql', '.scala', '.java', '.ipynb'],
    keywords: ['data', 'etl', 'pipeline', 'spark', 'hadoop', 'warehouse', 'analytics', 'big-data'],
    architecturePatterns: ['data-pipeline', 'etl', 'data-warehouse', 'batch-processing'],
    negativeIndicators: ['ui', 'frontend', 'component'],
  },
  security: {
    languages: ['python', 'go', 'rust', 'c', 'c++'],
    fileExtensions: ['.py', '.go', '.rs', '.c', '.cpp'],
    keywords: ['security', 'vulnerability', 'penetration', 'encryption', 'auth', 'oauth', 'jwt', 'ssl', 'tls'],
    architecturePatterns: ['security-audit', 'penetration-test', 'vulnerability-scan'],
    negativeIndicators: [],
  },
  'ml-engineer': {
    languages: ['python', 'r', 'julia'],
    fileExtensions: ['.py', '.r', '.jl', '.ipynb', '.pkl'],
    keywords: ['machine-learning', 'ml', 'tensorflow', 'pytorch', 'model', 'training', 'neural', 'deep-learning'],
    architecturePatterns: ['ml-pipeline', 'model-training', 'feature-engineering'],
    negativeIndicators: ['ui', 'frontend', 'component'],
  },
  sre: {
    languages: ['python', 'go', 'yaml', 'bash'],
    fileExtensions: ['.py', '.go', '.yaml', '.yml', '.sh', '.tf'],
    keywords: ['reliability', 'monitoring', 'alerting', 'slo', 'sla', 'incident', 'oncall', 'observability'],
    architecturePatterns: ['monitoring', 'alerting', 'incident-response', 'reliability-engineering'],
    negativeIndicators: ['ui-component', 'frontend'],
  },
  'platform-engineer': {
    languages: ['go', 'python', 'yaml', 'rust'],
    fileExtensions: ['.go', '.py', '.yaml', '.yml', '.rs'],
    keywords: ['platform', 'infrastructure', 'tooling', 'developer-experience', 'internal-tools'],
    architecturePatterns: ['platform-as-a-service', 'internal-platform', 'developer-tooling'],
    negativeIndicators: ['customer-facing', 'ui-component'],
  },
};

/**
 * Analyzes file changes to detect role-relevant patterns
 */
function analyzeFileChanges(files: FileChangeAnalysis[], role: RoleType): {
  relevantFiles: number;
  totalFiles: number;
  matchedTechnologies: Set<string>;
  mismatchedTechnologies: Set<string>;
} {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  const relevantFiles: FileChangeAnalysis[] = [];
  const matchedTechnologies = new Set<string>();
  const mismatchedTechnologies = new Set<string>();

  for (const file of files) {
    const ext = file.fileExtension.toLowerCase();
    const path = file.filePath.toLowerCase();

    // Check for positive matches
    let isRelevant = false;
    if (indicators.fileExtensions.some(e => ext === e)) {
      isRelevant = true;
      matchedTechnologies.add(ext);
    }

    if (indicators.keywords.some(kw => path.includes(kw) || file.directory.includes(kw))) {
      isRelevant = true;
    }

    // Check for negative matches
    if (indicators.negativeIndicators.some(ni => path.includes(ni) || file.directory.includes(ni))) {
      mismatchedTechnologies.add(ext);
    }

    if (isRelevant) {
      relevantFiles.push(file);
    }
  }

  return {
    relevantFiles: relevantFiles.length,
    totalFiles: files.length,
    matchedTechnologies,
    mismatchedTechnologies,
  };
}

/**
 * Signal 1: Technology Stack Alignment
 */
function calculateTechnologyStackMatch(
  activity: EngineerActivity,
  role: RoleType
): { score: number; matched: string[]; mismatched: string[] } {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  const matchedTechnologies = new Set<string>();
  const mismatchedTechnologies = new Set<string>();

  // Analyze PRs
  for (const pr of activity.prs) {
    for (const file of pr.filesChanged) {
      const ext = file.fileExtension.toLowerCase();
      const path = file.filePath.toLowerCase();

      if (indicators.fileExtensions.includes(ext)) {
        matchedTechnologies.add(ext);
      }

      if (indicators.negativeIndicators.some(ni => path.includes(ni))) {
        mismatchedTechnologies.add(ext);
      }
    }

    // Check languages
    for (const lang of pr.languages) {
      if (indicators.languages.includes(lang.toLowerCase())) {
        matchedTechnologies.add(lang);
      }
    }
  }

  // Analyze repositories
  for (const repo of activity.repositories) {
    for (const [lang, percentage] of repo.languages.entries()) {
      if (percentage > 10 && indicators.languages.includes(lang.toLowerCase())) {
        matchedTechnologies.add(lang);
      }
    }

    // Check topics and description
    const repoText = `${repo.description || ''} ${repo.topics.join(' ')}`.toLowerCase();
    if (indicators.keywords.some(kw => repoText.includes(kw))) {
      matchedTechnologies.add('repository-keyword');
    }
  }

  // Calculate score
  const matchCount = matchedTechnologies.size;
  const mismatchCount = mismatchedTechnologies.size;
  const baseScore = Math.min(matchCount * 15, 100); // Up to 100 for 7+ matches
  const penalty = Math.min(mismatchCount * 10, 50); // Up to 50 point penalty

  return {
    score: Math.max(baseScore - penalty, 0),
    matched: Array.from(matchedTechnologies),
    mismatched: Array.from(mismatchedTechnologies),
  };
}

/**
 * Signal 2: Contribution Depth in Role Domain
 */
function calculateDomainContributionDepth(
  activity: EngineerActivity,
  role: RoleType
): { score: number; relevantPRs: number; totalPRs: number } {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  let relevantPRs = 0;

  for (const pr of activity.prs) {
    const analysis = analyzeFileChanges(pr.filesChanged, role);
    const relevanceRatio = analysis.totalFiles > 0 ? analysis.relevantFiles / analysis.totalFiles : 0;

    // PR is relevant if >50% of files are role-relevant
    if (relevanceRatio > 0.5) {
      relevantPRs++;
    }

    // Also check PR title/body for keywords
    const prText = `${pr.title} ${pr.body || ''}`.toLowerCase();
    if (indicators.keywords.some(kw => prText.includes(kw))) {
      relevantPRs++;
    }
  }

  const totalPRs = activity.prs.length;
  const depthScore = totalPRs > 0
    ? (relevantPRs / totalPRs) * 100
    : 0;

  return {
    score: depthScore,
    relevantPRs,
    totalPRs,
  };
}

/**
 * Signal 3: Architecture Pattern Recognition
 */
function calculateArchitecturePatternMatch(
  activity: EngineerActivity,
  role: RoleType
): { score: number; patterns: string[] } {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  const detectedPatterns = new Set<string>();

  for (const pr of activity.prs) {
    const prText = `${pr.title} ${pr.body || ''}`.toLowerCase();
    const filePaths = pr.filesChanged.map(f => f.filePath.toLowerCase()).join(' ');

    for (const pattern of indicators.architecturePatterns) {
      if (prText.includes(pattern) || filePaths.includes(pattern)) {
        detectedPatterns.add(pattern);
      }
    }

    // Detect patterns from file structure
    if (pr.isAPIChange) detectedPatterns.add('api-design');
    if (pr.isInfrastructureChange) detectedPatterns.add('infrastructure');
    if (pr.isDatabaseChange) detectedPatterns.add('data-layer');
  }

  for (const repo of activity.repositories) {
    const repoText = `${repo.description || ''} ${repo.topics.join(' ')}`.toLowerCase();
    for (const pattern of indicators.architecturePatterns) {
      if (repoText.includes(pattern)) {
        detectedPatterns.add(pattern);
      }
    }
  }

  const score = Math.min(detectedPatterns.size * 20, 100); // 5+ patterns = 100

  return {
    score,
    patterns: Array.from(detectedPatterns),
  };
}

/**
 * Signal 4: File Type Distribution
 */
function calculateFileTypeAlignment(
  activity: EngineerActivity,
  role: RoleType
): number {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  let relevantFiles = 0;
  let totalFiles = 0;

  for (const pr of activity.prs) {
    for (const file of pr.filesChanged) {
      totalFiles++;
      if (indicators.fileExtensions.includes(file.fileExtension.toLowerCase())) {
        relevantFiles++;
      }
    }
  }

  return totalFiles > 0 ? (relevantFiles / totalFiles) * 100 : 0;
}

/**
 * Signal 5: Issue/PR Type Patterns
 */
function calculateActivityTypeMatch(
  activity: EngineerActivity,
  role: RoleType
): number {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  let relevantActivities = 0;
  let totalActivities = activity.prs.length + activity.issues.length;

  // Analyze PRs
  for (const pr of activity.prs) {
    let isRelevant = false;

    if (role === 'backend' && (pr.isAPIChange || pr.isDatabaseChange)) {
      isRelevant = true;
    } else if (role === 'frontend' && pr.isUIChange) {
      isRelevant = true;
    } else if (role === 'devops' && pr.isInfrastructureChange) {
      isRelevant = true;
    } else if (role === 'devops' && pr.isConfigChange) {
      isRelevant = true;
    }

    const prText = `${pr.title} ${pr.body || ''}`.toLowerCase();
    if (indicators.keywords.some(kw => prText.includes(kw))) {
      isRelevant = true;
    }

    if (isRelevant) relevantActivities++;
  }

  // Analyze issues
  for (const issue of activity.issues) {
    const issueText = `${issue.title} ${issue.body || ''}`.toLowerCase();
    if (indicators.keywords.some(kw => issueText.includes(kw))) {
      relevantActivities++;
    }

    if (role === 'devops' && issue.isInfrastructure) {
      relevantActivities++;
    } else if (role === 'security' && issue.isSecurity) {
      relevantActivities++;
    }
  }

  return totalActivities > 0 ? (relevantActivities / totalActivities) * 100 : 0;
}

/**
 * Signal 6: Repository Type Distribution
 */
function calculateRepositoryTypeMatch(
  activity: EngineerActivity,
  role: RoleType
): number {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  let relevantRepos = 0;

  for (const repo of activity.repositories) {
    if (repo.isFork) continue; // Skip forks

    // Check primary language
    if (indicators.languages.includes(repo.primaryLanguage.toLowerCase())) {
      relevantRepos++;
      continue;
    }

    // Check topics and description
    const repoText = `${repo.description || ''} ${repo.topics.join(' ')}`.toLowerCase();
    if (indicators.keywords.some(kw => repoText.includes(kw))) {
      relevantRepos++;
    }
  }

  const totalRepos = activity.repositories.filter(r => !r.isFork).length;
  return totalRepos > 0 ? (relevantRepos / totalRepos) * 100 : 0;
}

/**
 * Signal 7: Code Review Domain Expertise
 */
function calculateReviewDomainExpertise(
  activity: EngineerActivity,
  role: RoleType
): number {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];
  let relevantReviews = 0;

  for (const review of activity.codeReviews) {
    for (const file of review.reviewedFiles) {
      const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
      if (indicators.fileExtensions.includes(ext)) {
        relevantReviews++;
        break;
      }
    }

    for (const lang of review.languages) {
      if (indicators.languages.includes(lang.toLowerCase())) {
        relevantReviews++;
        break;
      }
    }
  }

  const totalReviews = activity.codeReviews.length;
  return totalReviews > 0 ? (relevantReviews / totalReviews) * 100 : 0;
}

/**
 * Calculate negative compatibility signals
 */
function calculateNegativeSignals(
  activity: EngineerActivity,
  role: RoleType
): NegativeSignals {
  const indicators = ROLE_TECHNOLOGY_INDICATORS[role];

  // Technology mismatch
  let mismatchCount = 0;
  for (const pr of activity.prs) {
    for (const file of pr.filesChanged) {
      const path = file.filePath.toLowerCase();
      if (indicators.negativeIndicators.some(ni => path.includes(ni))) {
        mismatchCount++;
      }
    }
  }
  const technologyMismatch = Math.min((mismatchCount / activity.prs.length) * 100, 100);

  // Domain contradiction (high activity in opposite domain)
  const contradictionScore = technologyMismatch; // Simplified

  // Insufficient depth (not enough relevant contributions)
  const depthAnalysis = calculateDomainContributionDepth(activity, role);
  const insufficientDepth = depthAnalysis.totalPRs < 5 ? 100 : 0;

  // Architecture mismatch
  const archAnalysis = calculateArchitecturePatternMatch(activity, role);
  const architectureMismatch = archAnalysis.patterns.length === 0 ? 50 : 0;

  // Technology overweight (too much focus on wrong tech)
  const techAnalysis = calculateTechnologyStackMatch(activity, role);
  const technologyOverweight = techAnalysis.mismatched.length > techAnalysis.matched.length ? 70 : 0;

  return {
    technologyMismatch,
    domainContradiction: contradictionScore,
    insufficientDepth,
    architectureMismatch,
    technologyOverweight,
  };
}

/**
 * Role-specific weighting
 */
function getRoleWeights(role: RoleType): Record<keyof CompatibilitySignals, number> {
  const baseWeights: Record<keyof CompatibilitySignals, number> = {
    technologyStackMatch: 0.2,
    domainContributionDepth: 0.25,
    architecturePatternMatch: 0.15,
    fileTypeAlignment: 0.15,
    activityTypeMatch: 0.1,
    repositoryTypeMatch: 0.1,
    reviewDomainExpertise: 0.05,
  };

  // Adjust weights based on role
  switch (role) {
    case 'backend':
      return {
        ...baseWeights,
        technologyStackMatch: 0.25,
        domainContributionDepth: 0.3,
        architecturePatternMatch: 0.2,
        fileTypeAlignment: 0.15,
        activityTypeMatch: 0.1,
      };
    case 'frontend':
      return {
        ...baseWeights,
        fileTypeAlignment: 0.25,
        technologyStackMatch: 0.25,
        domainContributionDepth: 0.25,
        activityTypeMatch: 0.15,
      };
    case 'devops':
      return {
        ...baseWeights,
        activityTypeMatch: 0.25,
        architecturePatternMatch: 0.25,
        technologyStackMatch: 0.2,
        domainContributionDepth: 0.2,
      };
    default:
      return baseWeights;
  }
}

/**
 * Main function to calculate Compatibility Score
 */
export function calculateCompatibilityScore(
  activity: EngineerActivity,
  query: RoleQuery
): CompatibilityScoreResult {
  const role = query.role;
  const weights = getRoleWeights(role);

  // Calculate all signals
  const techStack = calculateTechnologyStackMatch(activity, role);
  const contributionDepth = calculateDomainContributionDepth(activity, role);
  const architecture = calculateArchitecturePatternMatch(activity, role);
  const fileType = calculateFileTypeAlignment(activity, role);
  const activityType = calculateActivityTypeMatch(activity, role);
  const repositoryType = calculateRepositoryTypeMatch(activity, role);
  const reviewExpertise = calculateReviewDomainExpertise(activity, role);

  const signals: CompatibilitySignals = {
    technologyStackMatch: techStack.score,
    domainContributionDepth: contributionDepth.score,
    architecturePatternMatch: architecture.score,
    fileTypeAlignment: fileType,
    activityTypeMatch: activityType,
    repositoryTypeMatch: repositoryType,
    reviewDomainExpertise: reviewExpertise,
  };

  // Calculate negative signals
  const negativeSignals = calculateNegativeSignals(activity, role);

  // Calculate weighted total score
  let totalScore = (
    signals.technologyStackMatch * weights.technologyStackMatch +
    signals.domainContributionDepth * weights.domainContributionDepth +
    signals.architecturePatternMatch * weights.architecturePatternMatch +
    signals.fileTypeAlignment * weights.fileTypeAlignment +
    signals.activityTypeMatch * weights.activityTypeMatch +
    signals.repositoryTypeMatch * weights.repositoryTypeMatch +
    signals.reviewDomainExpertise * weights.reviewDomainExpertise
  );

  // Apply negative signal penalties
  totalScore -= (
    negativeSignals.technologyMismatch * 0.15 +
    negativeSignals.domainContradiction * 0.1 +
    negativeSignals.insufficientDepth * 0.2 +
    negativeSignals.architectureMismatch * 0.1 +
    negativeSignals.technologyOverweight * 0.15
  );

  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine compatibility level
  let compatibilityLevel: 'high' | 'medium' | 'low' | 'poor';
  if (totalScore >= 75) compatibilityLevel = 'high';
  else if (totalScore >= 50) compatibilityLevel = 'medium';
  else if (totalScore >= 25) compatibilityLevel = 'low';
  else compatibilityLevel = 'poor';

  // Build explanation
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const evidence: Array<{ type: string; description: string; score: number }> = [];

  if (techStack.score > 70) {
    strengths.push(`Strong technology stack match with ${techStack.matched.length} relevant technologies`);
    evidence.push({
      type: 'Technology Stack',
      description: `Matched technologies: ${techStack.matched.slice(0, 5).join(', ')}`,
      score: techStack.score,
    });
  } else if (techStack.score < 30) {
    weaknesses.push('Limited technology stack alignment');
  }

  if (contributionDepth.score > 70) {
    strengths.push(`Deep domain contributions: ${contributionDepth.relevantPRs}/${contributionDepth.totalPRs} relevant PRs`);
    evidence.push({
      type: 'Contribution Depth',
      description: `${contributionDepth.relevantPRs} out of ${contributionDepth.totalPRs} PRs are role-relevant`,
      score: contributionDepth.score,
    });
  }

  if (architecture.patterns.length > 0) {
    strengths.push(`Recognized architecture patterns: ${architecture.patterns.slice(0, 3).join(', ')}`);
    evidence.push({
      type: 'Architecture Patterns',
      description: `Detected patterns: ${architecture.patterns.join(', ')}`,
      score: architecture.score,
    });
  }

  if (negativeSignals.technologyMismatch > 50) {
    weaknesses.push('Significant contributions in mismatched technologies');
  }

  if (negativeSignals.insufficientDepth > 0) {
    weaknesses.push('Insufficient contribution depth in role domain');
  }

  return {
    totalScore,
    compatibilityLevel,
    signals,
    negativeSignals,
    explanation: {
      role,
      strengths,
      weaknesses,
      evidence,
    },
    breakdown: {
      technologyStack: {
        matchedTechnologies: techStack.matched,
        mismatchedTechnologies: techStack.mismatched,
        score: techStack.score,
      },
      contributionDepth: {
        relevantPRs: contributionDepth.relevantPRs,
        totalPRs: contributionDepth.totalPRs,
        score: contributionDepth.score,
      },
      architecturePatterns: {
        detectedPatterns: architecture.patterns,
        score: architecture.score,
      },
    },
  };
}
