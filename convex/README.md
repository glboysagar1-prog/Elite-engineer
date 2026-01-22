# Convex Schema for Wecraft

## Overview

This directory contains the Convex schema and query definitions for the Wecraft platform. The schema is designed for efficient queries, full-text search, and scalable operations.

## Schema Structure

### Tables

1. **engineers** - Core engineer profiles
2. **scores** - Computed scores (Impact, Trust, Compatibility, Match)
3. **evidence** - Individual evidence items (PRs, reviews, issues)
4. **recruiterSearchIndex** - Optimized search index for recruiters
5. **analysisJobs** - Background job tracking

## Key Design Decisions

### Denormalization

- **Username** stored in scores, evidence, and search index
  - Enables direct lookups without joins
  - Trade-off: Slight storage increase for significant query speedup

- **Activity Summary** in engineers table
  - Pre-computed aggregations
  - Avoids expensive aggregations on every query

- **Match Scores** in search index
  - Pre-computed for all roles
  - Enables fast role-based filtering

### Indexing Strategy

See `indexing-strategy.md` for detailed indexing strategy.

**Key Indexes:**
- Primary lookups: `by_username`, `by_engineer`
- Range queries: `by_impact_range`, `by_trust_range`
- Full-text search: `search_engineers`
- Composite indexes: `by_engineer_and_type`, `by_role_match`

### Query Patterns

See `queries.ts` for example queries.

**Common Patterns:**
- Engineer lookup by username
- Score retrieval by engineer
- Full-text search with filters
- Role-based filtering
- Score range queries

## Usage

### Setup

1. Install Convex:
```bash
npm install convex
```

2. Initialize Convex project:
```bash
npx convex dev
```

3. Deploy schema:
```bash
npx convex deploy
```

### Query Examples

```typescript
// Get engineer by username
const engineer = await ctx.runQuery(queries.getEngineerByUsername, {
  username: "octocat"
});

// Search engineers
const results = await ctx.runQuery(queries.searchEngineers, {
  role: "backend",
  technologies: ["python", "go"],
  minImpactScore: 70,
  isAuthentic: true
});

// Get top engineers for role
const topEngineers = await ctx.runQuery(queries.getTopEngineersForRole, {
  role: "backend",
  limit: 10
});
```

## Files

- `schema.ts` - Schema definitions
- `queries.ts` - Query examples
- `indexing-strategy.md` - Indexing documentation
- `README.md` - This file

## Performance Targets

- Engineer lookup: < 10ms
- Score retrieval: < 10ms
- Search query: < 100ms (with filters)
- Ranking query: < 50ms

## Migration Strategy

All tables include version fields for schema migrations:
- `engineers.analysisVersion`
- `scores.version`
- `recruiterSearchIndex.indexVersion`

This enables gradual schema migrations without breaking existing queries.
