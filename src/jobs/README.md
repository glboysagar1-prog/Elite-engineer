# Inngest Background Jobs for Wecraft

## Overview

Wecraft uses Inngest for reliable, idempotent background job processing. All jobs are designed to be retry-safe and handle failures gracefully.

## Job Architecture

### Three Main Jobs

1. **engineer/analyze** - Main orchestration job
2. **github/fetch** - GitHub data fetching
3. **scores/compute** - Score computation

### Key Features

- **Idempotent**: Same inputs = same outputs, safe to retry
- **Retry-safe**: All operations can be safely retried
- **Deterministic**: Score calculations are pure functions
- **Resilient**: Handles rate limits, network errors, timeouts

## Installation

```bash
npm install inngest
```

## Usage

### Triggering Analysis

```typescript
import { inngest } from './jobs/inngest-client';

// Trigger engineer analysis
await inngest.send({
  name: 'engineer/analyze',
  data: {
    username: 'octocat',
    roleQuery: { role: 'backend' },
    forceRefresh: false,
  },
});
```

### Setting Up Inngest

1. Create Inngest account
2. Set `INNGEST_EVENT_KEY` environment variable
3. Deploy jobs to Inngest

## Job Flow

See `job-flow.md` for detailed flow diagram.

## Pseudocode

See `pseudocode.md` for detailed pseudocode structure.

## Files

- `inngest-client.ts` - Inngest client configuration
- `inngest.ts` - Job definitions
- `job-flow.md` - Job flow documentation
- `pseudocode.md` - Pseudocode structure
