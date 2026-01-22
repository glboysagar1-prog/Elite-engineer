# Wecraft Engineer Profile Dashboard

Professional React dashboard for displaying engineer profiles with match scores, breakdowns, and evidence.

## Features

- **Recruiter Match Score** - Main match score with component breakdown
- **Trust/Impact/Compatibility Breakdown** - Detailed score components
- **Evidence Sections** - GitHub activity evidence
- **Strengths and Concerns** - Highlighted strengths and concerns with severity

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Vite

## Setup

```bash
cd dashboard
npm install
npm run dev
```

## Components

- `EngineerProfileDashboard` - Main dashboard component
- `MatchScoreCard` - Recruiter match score display
- `ScoreBreakdown` - Trust/Impact/Compatibility breakdown
- `StrengthsAndConcerns` - Strengths and concerns display
- `EvidenceSection` - Evidence items display

## Usage

```tsx
import { EngineerProfileDashboard } from './components/EngineerProfileDashboard'

<EngineerProfileDashboard data={dashboardData} />
```

## Styling

Uses Tailwind CSS with shadcn/ui design system. All components are responsive and follow modern UI patterns.
