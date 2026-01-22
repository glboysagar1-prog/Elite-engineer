# Convex Indexing Strategy for Wecraft

## Overview

This document outlines the indexing strategy for efficient queries in the Wecraft platform.

## Index Categories

### 1. Primary Lookups

**Engineers Table:**
- `by_username` - Fast lookup by GitHub username (most common)
- `by_last_analyzed` - Find engineers needing re-analysis
- `by_activity_span` - Filter by activity duration
- `by_total_prs` - Sort by contribution volume

**Scores Table:**
- `by_engineer` - Get scores for an engineer
- `by_username` - Denormalized for easier queries
- `by_impact_score` - Sort by impact
- `by_trust_score` - Sort by trust
- `by_computed_at` - Find recently computed scores

### 2. Search Indexes

**Recruiter Search Index:**
- `search_engineers` - Full-text search with filters
  - Search field: `searchText` (username, bio, technologies)
  - Filter fields: `isAuthentic`, `hasHighMatch`, `technologies`, `roles`

### 3. Range Queries

**Recruiter Search Index:**
- `by_impact_range` - Filter by impact score range
- `by_trust_range` - Filter by trust score range
- `by_overall_rank` - Sort by ranking

### 4. Composite Indexes

**Scores Table:**
- `by_match_score` - Composite index on match scores array
  - Enables efficient role-based filtering

**Recruiter Search Index:**
- `by_role_match` - Composite index on role match scores
  - Enables efficient role-specific searches

**Evidence Table:**
- `by_engineer_and_type` - Composite index for filtering evidence by engineer and type

### 5. Boolean Filters

**Recruiter Search Index:**
- `by_authentic` - Filter authentic engineers only
- `by_high_match` - Filter engineers with high match scores

## Query Patterns

### Pattern 1: Engineer Lookup
```
Query: Get engineer by username
Index: engineers.by_username
Performance: O(1) lookup
```

### Pattern 2: Score Retrieval
```
Query: Get scores for engineer
Index: scores.by_engineer
Performance: O(1) lookup
```

### Pattern 3: Recruiter Search
```
Query: Search engineers by role, technologies, score ranges
Index: recruiterSearchIndex.search_engineers
Performance: O(log n) with filters
```

### Pattern 4: Ranking
```
Query: Get top engineers by impact/trust/match
Index: scores.by_impact_score, scores.by_trust_score, recruiterSearchIndex.by_overall_rank
Performance: O(log n) with sorting
```

### Pattern 5: Evidence Retrieval
```
Query: Get evidence for engineer by type
Index: evidence.by_engineer_and_type
Performance: O(log n) with composite key
```

## Denormalization Strategy

### Why Denormalize?

1. **Username in Scores/Evidence/SearchIndex**
   - Avoids joins for common queries
   - Enables direct lookups by username
   - Trade-off: Slight storage increase, significant query speedup

2. **Activity Summary in Engineers**
   - Pre-computed aggregations
   - Avoids expensive aggregations on every query
   - Updated during analysis

3. **Match Scores in Search Index**
   - Pre-computed for all roles
   - Enables fast role-based filtering
   - Updated when scores change

## Index Maintenance

### When to Update Indexes

1. **After Analysis**
   - Update all engineer-related indexes
   - Rebuild search index
   - Update evidence indexes

2. **After Score Computation**
   - Update score indexes
   - Update search index with new scores
   - Update match score indexes

3. **Scheduled Re-indexing**
   - Daily: Rebuild search index for active engineers
   - Weekly: Full search index rebuild
   - On-demand: Re-index specific engineers

## Performance Considerations

### Index Size
- **Engineers**: ~1KB per engineer
- **Scores**: ~2KB per engineer
- **Evidence**: ~500 bytes per evidence item
- **Search Index**: ~1KB per engineer

### Query Performance Targets
- Engineer lookup: < 10ms
- Score retrieval: < 10ms
- Search query: < 100ms (with filters)
- Ranking query: < 50ms

### Optimization Strategies

1. **Pagination**: Use `paginate()` for large result sets
2. **Field Selection**: Only fetch needed fields
3. **Caching**: Cache frequently accessed engineers
4. **Batch Operations**: Batch updates to indexes

## Migration Strategy

### Versioning
- All tables include `version` or `indexVersion` fields
- Enables schema migrations
- Allows gradual rollout of index changes

### Backward Compatibility
- New indexes don't break existing queries
- Old indexes maintained during migration
- Gradual deprecation of old indexes
