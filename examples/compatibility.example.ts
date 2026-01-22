/**
 * Example: Backend Engineer Compatibility Score Explanation
 * 
 * This file demonstrates how the Compatibility Score explains
 * why an engineer is a good match for a Backend role.
 */

import { calculateCompatibilityScore, EngineerActivity, RoleQuery } from './compatibilityScore';

/**
 * Example: Strong Backend Engineer Match
 */
export function generateBackendExample(): {
  activity: EngineerActivity;
  query: RoleQuery;
  explanation: string;
} {
  const activity: EngineerActivity = {
    prs: [
      {
        id: 'pr-1',
        repository: 'payment-api',
        title: 'Implement payment processing microservice',
        body: 'Added new payment processing service with REST API, database models, and error handling',
        mergedAt: new Date('2024-01-15'),
        filesChanged: [
          {
            filePath: 'src/services/payment.py',
            fileExtension: '.py',
            changeType: 'added',
            linesAdded: 200,
            linesDeleted: 0,
            directory: 'src/services',
          },
          {
            filePath: 'src/models/payment.py',
            fileExtension: '.py',
            changeType: 'added',
            linesAdded: 80,
            linesDeleted: 0,
            directory: 'src/models',
          },
          {
            filePath: 'src/api/routes.py',
            fileExtension: '.py',
            changeType: 'modified',
            linesAdded: 50,
            linesDeleted: 10,
            directory: 'src/api',
          },
        ],
        languages: new Set(['python']),
        directories: new Set(['src/services', 'src/models', 'src/api']),
        isInfrastructureChange: false,
        isAPIC change: true,
        isUIChange: false,
        isDatabaseChange: true,
        isConfigChange: false,
        isTestChange: false,
        isDocumentationChange: false,
      },
      {
        id: 'pr-2',
        repository: 'user-service',
        title: 'Optimize database queries with connection pooling',
        body: 'Implemented connection pooling and query optimization for better performance',
        mergedAt: new Date('2024-02-01'),
        filesChanged: [
          {
            filePath: 'src/db/pool.py',
            fileExtension: '.py',
            changeType: 'added',
            linesAdded: 120,
            linesDeleted: 0,
            directory: 'src/db',
          },
          {
            filePath: 'src/db/queries.py',
            fileExtension: '.py',
            changeType: 'modified',
            linesAdded: 60,
            linesDeleted: 30,
            directory: 'src/db',
          },
        ],
        languages: new Set(['python']),
        directories: new Set(['src/db']),
        isInfrastructureChange: false,
        isAPIC change: false,
        isUIChange: false,
        isDatabaseChange: true,
        isConfigChange: false,
        isTestChange: false,
        isDocumentationChange: false,
      },
      {
        id: 'pr-3',
        repository: 'auth-service',
        title: 'Add JWT authentication middleware',
        body: 'Implemented JWT-based authentication with middleware for API routes',
        mergedAt: new Date('2024-02-20'),
        filesChanged: [
          {
            filePath: 'src/middleware/auth.py',
            fileExtension: '.py',
            changeType: 'added',
            linesAdded: 150,
            linesDeleted: 0,
            directory: 'src/middleware',
          },
          {
            filePath: 'src/api/routes.py',
            fileExtension: '.py',
            changeType: 'modified',
            linesAdded: 40,
            linesDeleted: 5,
            directory: 'src/api',
          },
        ],
        languages: new Set(['python']),
        directories: new Set(['src/middleware', 'src/api']),
        isInfrastructureChange: false,
        isAPIC change: true,
        isUIChange: false,
        isDatabaseChange: false,
        isConfigChange: false,
        isTestChange: false,
        isDocumentationChange: false,
      },
    ],
    issues: [
      {
        id: 'issue-1',
        repository: 'payment-api',
        title: 'API rate limiting not working correctly',
        body: 'Rate limiting middleware is not properly enforcing limits',
        labels: ['bug', 'api'],
        isBug: true,
        isFeature: false,
        isInfrastructure: false,
        isSecurity: false,
      },
    ],
    repositories: [
      {
        repository: 'payment-api',
        isFork: false,
        primaryLanguage: 'python',
        languages: new Map([['python', 85], ['yaml', 10], ['dockerfile', 5]]),
        topics: ['api', 'backend', 'microservice', 'python', 'rest'],
        description: 'Payment processing microservice with REST API',
        stars: 250,
        isArchived: false,
      },
      {
        repository: 'user-service',
        isFork: false,
        primaryLanguage: 'python',
        languages: new Map([['python', 90], ['sql', 10]]),
        topics: ['backend', 'microservice', 'database', 'python'],
        description: 'User management microservice',
        stars: 180,
        isArchived: false,
      },
      {
        repository: 'auth-service',
        isFork: false,
        primaryLanguage: 'python',
        languages: new Map([['python', 95], ['yaml', 5]]),
        topics: ['authentication', 'jwt', 'backend', 'api', 'security'],
        description: 'Authentication service with JWT',
        stars: 320,
        isArchived: false,
      },
    ],
    codeReviews: [
      {
        repository: 'payment-api',
        prId: 'other-pr-1',
        reviewedFiles: ['src/api/routes.py', 'src/services/payment.py'],
        languages: new Set(['python']),
      },
      {
        repository: 'user-service',
        prId: 'other-pr-2',
        reviewedFiles: ['src/db/queries.py'],
        languages: new Set(['python']),
      },
    ],
  };

  const query: RoleQuery = {
    role: 'backend',
  };

  const result = calculateCompatibilityScore(activity, query);

  const explanation = `
BACKEND ENGINEER COMPATIBILITY SCORE: ${result.totalScore.toFixed(1)}/100
Compatibility Level: ${result.compatibilityLevel.toUpperCase()}

=== COMPATIBILITY SIGNALS ===

1. Technology Stack Match: ${result.signals.technologyStackMatch.toFixed(1)}/100
   - Matched Technologies: ${result.breakdown.technologyStack.matchedTechnologies.join(', ')}
   - Strong Python backend experience across multiple services
   - API and database technologies aligned with backend role

2. Domain Contribution Depth: ${result.signals.domainContributionDepth.toFixed(1)}/100
   - ${result.breakdown.contributionDepth.relevantPRs} out of ${result.breakdown.contributionDepth.totalPRs} PRs are backend-relevant
   - Deep contributions in API development, database optimization, and authentication
   - Consistent focus on backend concerns (services, APIs, databases)

3. Architecture Pattern Match: ${result.signals.architecturePatternMatch.toFixed(1)}/100
   - Detected Patterns: ${result.breakdown.architecturePatterns.detectedPatterns.join(', ')}
   - Microservices architecture experience
   - API design and middleware patterns

4. File Type Alignment: ${result.signals.fileTypeAlignment.toFixed(1)}/100
   - High percentage of Python backend files (.py)
   - Focus on service, model, and API code

5. Activity Type Match: ${result.signals.activityTypeMatch.toFixed(1)}/100
   - API changes: Yes (payment API, auth middleware)
   - Database changes: Yes (query optimization, connection pooling)
   - Infrastructure: No (appropriate for backend role)

6. Repository Type Match: ${result.signals.repositoryTypeMatch.toFixed(1)}/100
   - All repositories are backend-focused (payment-api, user-service, auth-service)
   - Topics indicate backend/microservice focus

7. Review Domain Expertise: ${result.signals.reviewDomainExpertise.toFixed(1)}/100
   - Code reviews focused on backend Python code
   - Demonstrates ability to review API and service code

=== NEGATIVE SIGNALS ===

Technology Mismatch: ${result.negativeSignals.technologyMismatch.toFixed(1)}/100
- No frontend or UI contributions detected
- Clean separation of backend concerns

Domain Contradiction: ${result.negativeSignals.domainContradiction.toFixed(1)}/100
- No contradictory contributions to opposite domains

=== STRENGTHS ===
${result.explanation.strengths.map(s => `✓ ${s}`).join('\n')}

=== EVIDENCE ===
${result.explanation.evidence.map(e => 
  `• ${e.type}: ${e.description} (Score: ${e.score.toFixed(1)})`
).join('\n')}

=== CONCLUSION ===
This engineer demonstrates strong backend engineering capabilities through:
- Consistent Python backend development across multiple microservices
- Deep experience with APIs, databases, and authentication
- Architecture patterns aligned with backend best practices
- No conflicting frontend or unrelated contributions
- Active code review participation in backend codebases

The compatibility score of ${result.totalScore.toFixed(1)} indicates a ${result.compatibilityLevel} match for Backend Engineer roles.
  `.trim();

  return {
    activity,
    query,
    explanation,
  };
}
