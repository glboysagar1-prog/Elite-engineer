# Explanation Generator for Wecraft

## Overview

The Explanation Generator creates human-readable explanations from score breakdowns. It **does NOT** generate scores or rank engineers - it only explains existing computed data.

## Principles

1. **Explain, Don't Score**: Takes computed scores as input, generates explanations
2. **No Rankings**: Never ranks engineers or creates leaderboards
3. **Evidence-Based**: All explanations backed by evidence from score breakdowns
4. **Transparent**: Clear, understandable language for recruiters

## Inputs

- **Trust Score Breakdown**: TrustScoreResult with components, signals, flags
- **Impact Score Breakdown**: ImpactScoreResult with components and signals
- **Compatibility Signals**: CompatibilityScoreResult with signals and breakdowns

## Outputs

### 1. "Why This Match?" Summary

A 2-3 sentence summary explaining:
- Authenticity assessment
- Role compatibility level
- Contribution impact level

**Example:**
> "This engineer has an authentic profile, shows strong alignment with backend engineering, with a proven track record of meaningful contributions."

### 2. Strengths

Array of strengths with:
- **Title**: Brief strength identifier
- **Description**: Detailed explanation
- **Evidence**: Supporting data points

**Example Strengths:**
- Authentic Profile
- High Maintainer Trust
- Strong Repository Diversity
- High PR Impact
- Long-term Consistency
- Technology Stack Alignment
- Deep Domain Experience
- Architecture Pattern Recognition

### 3. Concerns

Array of concerns with:
- **Title**: Brief concern identifier
- **Description**: Detailed explanation
- **Severity**: 'low' | 'medium' | 'high'
- **Evidence**: Supporting data points

**Example Concerns:**
- Profile Authenticity Concerns (high)
- Fork-Only Contributions (high)
- High Fork Contribution Ratio (medium)
- Limited Contribution History (medium)
- Poor Role Compatibility (high)
- Technology Stack Mismatch (medium)

## Trust Indicators

Extracted trust signals:
- `isAuthentic`: Boolean authenticity status
- `confidence`: Confidence level (0-100)
- `keyTrustSignals`: Array of key trust indicators

## Compatibility Indicators

Extracted compatibility signals:
- `role`: Target role
- `fitLevel`: 'high' | 'medium' | 'low' | 'poor'
- `keySignals`: Array of key compatibility signals

## Impact Indicators

Extracted impact signals:
- `contributionDepth`: 'Deep' | 'Moderate' | 'Emerging'
- `collaborationLevel`: 'Strong' | 'Moderate' | 'Limited'
- `keyContributions`: Array of key contribution highlights

## Usage

```typescript
import { generateMatchExplanation } from './explanation-generator';

const explanation = generateMatchExplanation(
  trustResult,
  impactResult,
  compatibilityResult
);

console.log(explanation.whyThisMatch);
console.log(explanation.strengths);
console.log(explanation.concerns);
```

## What It Does NOT Do

- ❌ Generate scores (takes scores as input)
- ❌ Rank engineers
- ❌ Create leaderboards
- ❌ Compare engineers
- ❌ Make hiring recommendations

## What It Does

- ✅ Explains why a match exists
- ✅ Highlights strengths with evidence
- ✅ Identifies concerns with severity
- ✅ Provides transparent, understandable explanations
- ✅ Backs all claims with evidence

## Example Output

```typescript
{
  whyThisMatch: "This engineer has an authentic profile, shows strong alignment with backend engineering, with a proven track record of meaningful contributions.",
  
  strengths: [
    {
      title: "Authentic Profile",
      description: "Profile shows genuine engineering activity with verified contributions.",
      evidence: ["Account age: 2 years", "High repository diversity"]
    },
    {
      title: "High Maintainer Trust",
      description: "Most contributions (85%) were merged by repository maintainers...",
      evidence: ["85% of PRs merged by maintainers", "48 maintainer-merged PRs"]
    }
  ],
  
  concerns: [
    {
      title: "Limited Repository Diversity",
      description: "Contributions concentrated in few repositories...",
      severity: "medium",
      evidence: ["5 active repositories", "Limited breadth of experience"]
    }
  ],
  
  trustIndicators: {
    isAuthentic: true,
    confidence: 90,
    keyTrustSignals: ["Authentic profile verified", "High maintainer trust"]
  },
  
  compatibilityIndicators: {
    role: "backend",
    fitLevel: "high",
    keySignals: ["Strong technology alignment", "Deep domain experience"]
  },
  
  impactIndicators: {
    contributionDepth: "Deep",
    collaborationLevel: "Strong",
    keyContributions: ["50 merged PRs", "10 active repositories"]
  }
}
```
