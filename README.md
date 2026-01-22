# Wecraft - Elite Engineers Discovery Platform

A trust-first, explainable platform for discovering elite engineers based solely on public GitHub proof-of-work.

## Project Structure

```
Elite_engineer/
├── src/
│   ├── types/              # Type definitions
│   │   ├── github.ts       # GitHub data types (PRs, issues, repos, etc.)
│   │   ├── roles.ts        # Role types and queries
│   │   └── scores.ts       # Score result types
│   │
│   ├── scores/             # Score calculation modules
│   │   ├── impact.ts       # Impact Score calculator
│   │   ├── trust.ts        # Trust/Authenticity Score calculator
│   │   ├── compatibility.ts # Compatibility Score calculator
│   │   └── recruiterMatch.ts # Recruiter Match Score calculator
│   │
│   └── index.ts            # Main exports
│
├── tests/                  # Test files
│   ├── impact.test.ts
│   ├── trust.test.ts
│   ├── compatibility.test.ts
│   └── recruiterMatch.test.ts
│
├── examples/               # Example usage
│   └── compatibility.example.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

## Core Scores

### 1. Impact Score (`scores/impact.ts`)
Measures engineer impact through merged PRs, collaboration, and longevity.

**Components:**
- PR Impact (40%): Merged PRs, review engagement, maintainer trust
- Collaboration (30%): Cross-repo contributions, review reciprocity
- Longevity (20%): Activity span, consistency, temporal distribution
- Quality (10%): Review depth, contribution complexity

**Excludes:** Raw commit count, LOC, streaks

### 2. Trust Score (`scores/trust.ts`)
Determines if an engineer is real and reliable.

**Components:**
- Account Authenticity (25%): Account age, maturity, profile completeness
- Contribution Authenticity (35%): Contribution span, repository diversity
- Collaboration Signals (25%): Unique collaborators, maintainer interactions
- Anti-Gaming Score (15%): Spam detection, fork farming penalties

**Detects:** Fork farming, self-merge farming, repository farming, spam patterns

### 3. Compatibility Score (`scores/compatibility.ts`)
Role-aware matching based on GitHub proof-of-work.

**7 Independent Signals:**
1. Technology Stack Alignment
2. Domain Contribution Depth
3. Architecture Pattern Recognition
4. File Type Distribution
5. Activity Type Match
6. Repository Type Distribution
7. Code Review Domain Expertise

**Supports Roles:** backend, frontend, fullstack, devops, mobile, data-engineer, security, ml-engineer, sre, platform-engineer

### 4. Recruiter Match Score (`scores/recruiterMatch.ts`)
Combines all scores into a single match score.

**Formula:**
```
Match Score = (Trust × 0.4) + (Compatibility × 0.4) + (Impact × 0.2)
```

**Weight Justification:**
- Trust (40%): Authenticity is non-negotiable
- Compatibility (40%): Role fit is critical
- Impact (20%): Shows capability but less critical than trust/fit

**Views:**
- **Recruiter View**: Simplified, actionable insights
- **Engineer View**: Full transparency, no match score (privacy)

## Usage

```typescript
import { 
  calculateImpactScore,
  calculateTrustScore,
  calculateCompatibilityScore,
  calculateRecruiterMatchScore
} from './src';

// Calculate Impact Score
const impactResult = calculateImpactScore(githubActivity);

// Calculate Trust Score
const trustResult = calculateTrustScore(account, contributionPattern);

// Calculate Compatibility Score
const compatibilityResult = calculateCompatibilityScore(activity, { role: 'backend' });

// Calculate Recruiter Match Score
const matchResult = calculateRecruiterMatchScore(
  trustResult,
  compatibilityResult,
  impactResult
);
```

## Principles

1. **No Resumes**: Only public GitHub proof-of-work
2. **No Self-Reported Skills**: Everything is inferred from code
3. **Trust-First**: Authenticity is non-negotiable
4. **Explainable**: All scores include breakdowns and evidence
5. **Scalable**: Designed for automated processing

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT
