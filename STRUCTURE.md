# Project Structure

## Directory Organization

```
Elite_engineer/
├── src/
│   ├── types/                    # Type definitions
│   │   ├── github.ts            # GitHub data types
│   │   ├── roles.ts             # Role types
│   │   └── scores.ts            # Score result types
│   │
│   ├── scores/                   # Score calculators
│   │   ├── impact.ts            # Impact Score
│   │   ├── trust.ts             # Trust/Authenticity Score
│   │   ├── compatibility.ts    # Compatibility Score
│   │   └── recruiterMatch.ts   # Recruiter Match Score
│   │
│   └── index.ts                 # Main exports
│
├── tests/                        # Test files
│   ├── impact.test.ts
│   ├── trust.test.ts
│   ├── compatibility.test.ts
│   └── recruiterMatch.test.ts
│
├── examples/                     # Example usage
│   └── compatibility.example.ts
│
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## File Organization Principles

1. **Types are centralized** in `src/types/` to avoid duplication
2. **Score calculators** are in `src/scores/` and import types
3. **Tests** are in `tests/` directory
4. **Examples** are in `examples/` directory
5. **Main entry point** is `src/index.ts` which exports everything

## Import Pattern

All score files follow this pattern:

```typescript
// Import types from centralized location
import type { ... } from '../types/github';
import type { ... } from '../types/roles';
import type { ... } from '../types/scores';

// Implementation code follows
```

## Benefits

- **Easy to understand**: Clear separation of concerns
- **Easy to maintain**: Types in one place, easy to update
- **Easy to test**: Tests in dedicated directory
- **Easy to extend**: Add new scores by following the pattern
