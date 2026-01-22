import { calculateCompatibilityScore, EngineerActivity, RoleQuery } from './compatibilityScore';

describe('calculateCompatibilityScore', () => {
  const createMockActivity = (overrides?: Partial<EngineerActivity>): EngineerActivity => {
    return {
      prs: [],
      issues: [],
      repositories: [],
      codeReviews: [],
      ...overrides,
    };
  };

  it('should return low score for empty activity', () => {
    const activity = createMockActivity();
    const query: RoleQuery = { role: 'backend' };
    
    const result = calculateCompatibilityScore(activity, query);
    
    expect(result.totalScore).toBeLessThan(30);
    expect(result.compatibilityLevel).toBe('poor');
  });

  it('should score high for backend engineer with backend PRs', () => {
    const activity = createMockActivity({
      prs: [
        {
          id: '1',
          repository: 'api-server',
          title: 'Add REST API endpoint for users',
          body: 'Implemented new user endpoint with authentication',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'src/api/users.py',
              fileExtension: '.py',
              changeType: 'added',
              linesAdded: 50,
              linesDeleted: 0,
              directory: 'src/api',
            },
            {
              filePath: 'src/models/user.py',
              fileExtension: '.py',
              changeType: 'modified',
              linesAdded: 20,
              linesDeleted: 5,
              directory: 'src/models',
            },
          ],
          languages: new Set(['python']),
          directories: new Set(['src/api', 'src/models']),
          isInfrastructureChange: false,
          isAPIC change: true,
          isUIChange: false,
          isDatabaseChange: true,
          isConfigChange: false,
          isTestChange: false,
          isDocumentationChange: false,
        },
        {
          id: '2',
          repository: 'backend-service',
          title: 'Refactor database queries',
          body: 'Optimized database queries for better performance',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'src/db/queries.go',
              fileExtension: '.go',
              changeType: 'modified',
              linesAdded: 30,
              linesDeleted: 15,
              directory: 'src/db',
            },
          ],
          languages: new Set(['go']),
          directories: new Set(['src/db']),
          isInfrastructureChange: false,
          isAPIC change: false,
          isUIChange: false,
          isDatabaseChange: true,
          isConfigChange: false,
          isTestChange: false,
          isDocumentationChange: false,
        },
      ],
      repositories: [
        {
          repository: 'api-server',
          isFork: false,
          primaryLanguage: 'python',
          languages: new Map([['python', 80], ['javascript', 20]]),
          topics: ['api', 'backend', 'rest', 'python'],
          description: 'REST API server',
          stars: 100,
          isArchived: false,
        },
        {
          repository: 'backend-service',
          isFork: false,
          primaryLanguage: 'go',
          languages: new Map([['go', 90], ['yaml', 10]]),
          topics: ['backend', 'microservice', 'go'],
          description: 'Backend microservice',
          stars: 50,
          isArchived: false,
        },
      ],
      codeReviews: [
        {
          repository: 'api-server',
          prId: 'other-pr',
          reviewedFiles: ['src/api/users.py'],
          languages: new Set(['python']),
        },
      ],
    });
    
    const query: RoleQuery = { role: 'backend' };
    const result = calculateCompatibilityScore(activity, query);
    
    expect(result.totalScore).toBeGreaterThan(70);
    expect(result.compatibilityLevel).toBe('high');
    expect(result.signals.technologyStackMatch).toBeGreaterThan(70);
    expect(result.signals.domainContributionDepth).toBeGreaterThan(70);
    expect(result.explanation.strengths.length).toBeGreaterThan(0);
  });

  it('should penalize frontend contributions for backend role', () => {
    const activity = createMockActivity({
      prs: [
        {
          id: '1',
          repository: 'frontend-app',
          title: 'Add new React component',
          body: 'Created new UI component',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'src/components/Button.tsx',
              fileExtension: '.tsx',
              changeType: 'added',
              linesAdded: 40,
              linesDeleted: 0,
              directory: 'src/components',
            },
            {
              filePath: 'src/styles/button.css',
              fileExtension: '.css',
              changeType: 'added',
              linesAdded: 30,
              linesDeleted: 0,
              directory: 'src/styles',
            },
          ],
          languages: new Set(['typescript', 'css']),
          directories: new Set(['src/components', 'src/styles']),
          isInfrastructureChange: false,
          isAPIC change: false,
          isUIChange: true,
          isDatabaseChange: false,
          isConfigChange: false,
          isTestChange: false,
          isDocumentationChange: false,
        },
      ],
      repositories: [
        {
          repository: 'frontend-app',
          isFork: false,
          primaryLanguage: 'typescript',
          languages: new Map([['typescript', 70], ['css', 30]]),
          topics: ['react', 'frontend', 'ui'],
          description: 'Frontend React application',
          stars: 200,
          isArchived: false,
        },
      ],
    });
    
    const query: RoleQuery = { role: 'backend' };
    const result = calculateCompatibilityScore(activity, query);
    
    expect(result.totalScore).toBeLessThan(30);
    expect(result.negativeSignals.technologyMismatch).toBeGreaterThan(0);
    expect(result.explanation.weaknesses.length).toBeGreaterThan(0);
  });

  it('should score devops role correctly', () => {
    const activity = createMockActivity({
      prs: [
        {
          id: '1',
          repository: 'infrastructure',
          title: 'Add Kubernetes deployment config',
          body: 'Added k8s deployment configuration',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'k8s/deployment.yaml',
              fileExtension: '.yaml',
              changeType: 'added',
              linesAdded: 50,
              linesDeleted: 0,
              directory: 'k8s',
            },
            {
              filePath: 'terraform/main.tf',
              fileExtension: '.tf',
              changeType: 'added',
              linesAdded: 30,
              linesDeleted: 0,
              directory: 'terraform',
            },
          ],
          languages: new Set(['yaml', 'hcl']),
          directories: new Set(['k8s', 'terraform']),
          isInfrastructureChange: true,
          isAPIC change: false,
          isUIChange: false,
          isDatabaseChange: false,
          isConfigChange: true,
          isTestChange: false,
          isDocumentationChange: false,
        },
      ],
      repositories: [
        {
          repository: 'infrastructure',
          isFork: false,
          primaryLanguage: 'yaml',
          languages: new Map([['yaml', 60], ['hcl', 40]]),
          topics: ['kubernetes', 'terraform', 'infrastructure', 'devops'],
          description: 'Infrastructure as code',
          stars: 150,
          isArchived: false,
        },
      ],
    });
    
    const query: RoleQuery = { role: 'devops' };
    const result = calculateCompatibilityScore(activity, query);
    
    expect(result.totalScore).toBeGreaterThan(60);
    expect(result.signals.activityTypeMatch).toBeGreaterThan(70);
    expect(result.signals.architecturePatternMatch).toBeGreaterThan(50);
  });

  it('should detect architecture patterns', () => {
    const activity = createMockActivity({
      prs: [
        {
          id: '1',
          repository: 'microservices',
          title: 'Implement microservice architecture',
          body: 'Added new microservice with API gateway',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'src/service/api.py',
              fileExtension: '.py',
              changeType: 'added',
              linesAdded: 100,
              linesDeleted: 0,
              directory: 'src/service',
            },
          ],
          languages: new Set(['python']),
          directories: new Set(['src/service']),
          isInfrastructureChange: false,
          isAPIC change: true,
          isUIChange: false,
          isDatabaseChange: false,
          isConfigChange: false,
          isTestChange: false,
          isDocumentationChange: false,
        },
      ],
      repositories: [
        {
          repository: 'microservices',
          isFork: false,
          primaryLanguage: 'python',
          languages: new Map([['python', 100]]),
          topics: ['microservices', 'api-gateway', 'backend'],
          description: 'Microservices architecture implementation',
          stars: 300,
          isArchived: false,
        },
      ],
    });
    
    const query: RoleQuery = { role: 'backend' };
    const result = calculateCompatibilityScore(activity, query);
    
    expect(result.breakdown.architecturePatterns.detectedPatterns.length).toBeGreaterThan(0);
    expect(result.explanation.strengths.some(s => s.includes('architecture'))).toBe(true);
  });

  it('should handle mixed contributions', () => {
    const activity = createMockActivity({
      prs: [
        {
          id: '1',
          repository: 'backend-api',
          title: 'Add API endpoint',
          body: 'New REST endpoint',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'src/api/endpoint.py',
              fileExtension: '.py',
              changeType: 'added',
              linesAdded: 50,
              linesDeleted: 0,
              directory: 'src/api',
            },
          ],
          languages: new Set(['python']),
          directories: new Set(['src/api']),
          isInfrastructureChange: false,
          isAPIC change: true,
          isUIChange: false,
          isDatabaseChange: false,
          isConfigChange: false,
          isTestChange: false,
          isDocumentationChange: false,
        },
        {
          id: '2',
          repository: 'frontend-app',
          title: 'Fix UI bug',
          body: 'Fixed button styling',
          mergedAt: new Date(),
          filesChanged: [
            {
              filePath: 'src/components/Button.tsx',
              fileExtension: '.tsx',
              changeType: 'modified',
              linesAdded: 5,
              linesDeleted: 2,
              directory: 'src/components',
            },
          ],
          languages: new Set(['typescript']),
          directories: new Set(['src/components']),
          isInfrastructureChange: false,
          isAPIC change: false,
          isUIChange: true,
          isDatabaseChange: false,
          isConfigChange: false,
          isTestChange: false,
          isDocumentationChange: false,
        },
      ],
      repositories: [
        {
          repository: 'backend-api',
          isFork: false,
          primaryLanguage: 'python',
          languages: new Map([['python', 100]]),
          topics: ['backend', 'api'],
          description: 'Backend API',
          stars: 100,
          isArchived: false,
        },
        {
          repository: 'frontend-app',
          isFork: false,
          primaryLanguage: 'typescript',
          languages: new Map([['typescript', 100]]),
          topics: ['frontend', 'react'],
          description: 'Frontend app',
          stars: 200,
          isArchived: false,
        },
      ],
    });
    
    const query: RoleQuery = { role: 'backend' };
    const result = calculateCompatibilityScore(activity, query);
    
    // Should score medium due to mixed contributions
    expect(result.totalScore).toBeGreaterThan(40);
    expect(result.totalScore).toBeLessThan(80);
    expect(result.negativeSignals.technologyMismatch).toBeGreaterThan(0);
  });
});
