import { DashboardData } from "../components/EngineerProfileDashboard";

// Helper to generate random scores
const randomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export interface SimpleCandidate extends Omit<DashboardData, 'whyThisMatch'> {
    id: string;
    role: "Backend" | "Frontend" | "Full-stack" | "DevOps";
    techStack: string[];
    lastActive: number; // timestamp
    shortReason: string; // "Why ranked here?" snippet
}

const definitions = [
    { name: "Sagara", role: "Full-stack", stack: ["React", "Node.js", "TypeScript"], tier: "top" },
    { name: "Alice Chen", role: "Backend", stack: ["Go", "Kubernetes", "PostgreSQL"], tier: "top" },
    { name: "Bob Smith", role: "Frontend", stack: ["React", "Tailwind", "Next.js"], tier: "mid" },
    { name: "Charlie Kim", role: "DevOps", stack: ["AWS", "Terraform", "Python"], tier: "top" },
    { name: "Diana Prince", role: "Full-stack", stack: ["Vue", "Django", "Python"], tier: "mid" },
    { name: "Evan Wright", role: "Backend", stack: ["Java", "Spring", "Kafka"], tier: "low" },
    { name: "Fiona Gallagher", role: "Frontend", stack: ["Angular", "RxJS", "TypeScript"], tier: "mid" },
    { name: "George Miller", role: "Full-stack", stack: ["Node.js", "Express", "MongoDB"], tier: "low" },
    { name: "Hannah Lee", role: "Backend", stack: ["Rust", "Tokio", "PostgreSQL"], tier: "top" },
    { name: "Ian Sterling", role: "DevOps", stack: ["Docker", "Jenkins", "Bash"], tier: "mid" },
    { name: "Julia Roberts", role: "Frontend", stack: ["Svelte", "JavaScript", "CSS"], tier: "low" },
    { name: "Kevin Hart", role: "Full-stack", stack: ["React", "Python", "Flask"], tier: "mid" },
    { name: "Liam Neeson", role: "Backend", stack: ["C++", "Redis", "Networking"], tier: "top" },
    { name: "Mia Wallace", role: "Frontend", stack: ["React", "Redux", "Webpack"], tier: "top" },
    { name: "Noah Centineo", role: "Backend", stack: ["Elixir", "Phoenix", "PostgreSQL"], tier: "mid" },
    { name: "Olivia Wilde", role: "Full-stack", stack: ["Next.js", "Prisma", "Vercel"], tier: "top" },
    { name: "Peter Parker", role: "Full-stack", stack: ["React", "Node.js", "GraphQL"], tier: "mid" },
    { name: "Quinn Fabray", role: "DevOps", stack: ["Azure", "Bicep", "PowerShell"], tier: "low" },
    { name: "Rachel Green", role: "Frontend", stack: ["React", "Framer Motion", "Design Systems"], tier: "top" },
    { name: "Steve Rogers", role: "Backend", stack: ["Go", "gRPC", "Protobuf"], tier: "top" },
];

export const mockCandidates: SimpleCandidate[] = definitions.map((def, index) => {
    const isTop = def.tier === "top";
    const isMid = def.tier === "mid";

    const matchScore = isTop ? randomScore(88, 98) : isMid ? randomScore(70, 85) : randomScore(50, 68);
    const trustTotal = isTop ? randomScore(90, 100) : isMid ? randomScore(75, 89) : randomScore(40, 70);
    const impactTotal = isTop ? randomScore(85, 99) : isMid ? randomScore(60, 80) : randomScore(30, 55);
    const fitTotal = isTop ? randomScore(90, 100) : isMid ? randomScore(70, 88) : randomScore(50, 65);

    return {
        id: `cand-${index}`,
        engineer: {
            username: def.name.toLowerCase().replace(" ", ""),
            name: def.name,
            account: {
                createdAt: Date.now() - randomScore(1, 8) * 31536000000, // 1-8 years ago
                location: ["San Francisco", "New York", "Remote", "London", "Berlin"][randomScore(0, 4)],
                company: ["TechCorp", "StartupInc", "CloudSys", "BigData Co", "Freelance"][randomScore(0, 4)],
            }
        },
        role: def.role as any,
        techStack: def.stack,
        lastActive: Date.now() - randomScore(0, 20) * 86400000, // 0-20 days ago
        matchScore: {
            matchScore: matchScore,
            matchLevel: matchScore > 90 ? "Excellent" : matchScore > 75 ? "Good" : "Fair",
            recommendation: isTop ? "Strong Hire" : isMid ? "Interview" : "Review needed",
            trustScore: trustTotal,
            fitScore: fitTotal,
            impactScore: impactTotal,
            isAuthentic: true,
            isGoodFit: fitTotal > 75,
            hasImpact: impactTotal > 75,
        },
        trustScore: {
            total: trustTotal,
            components: {
                accountAuthenticity: randomScore(80, 100),
                contributionAuthenticity: randomScore(80, 100),
                collaborationSignals: randomScore(70, 100),
                antiGamingScore: randomScore(90, 100),
            }
        },
        impactScore: {
            total: impactTotal,
            components: {
                prImpact: randomScore(60, 100),
                collaboration: randomScore(50, 90),
                longevity: randomScore(70, 100),
                quality: randomScore(60, 95),
            }
        },
        compatibilityScore: {
            total: fitTotal,
            signals: {
                technologyStackMatch: randomScore(60, 100),
                domainContributionDepth: randomScore(50, 90),
                architecturePatternMatch: randomScore(40, 80),
                fileTypeAlignment: randomScore(70, 95),
                activityTypeMatch: randomScore(60, 90),
                repositoryTypeMatch: randomScore(70, 90),
                reviewDomainExpertise: randomScore(50, 80),
            }
        },
        strengths: [
            { title: "Consistent Contributor", description: "Merging code weekly for 3 years.", evidence: [] },
            { title: "Domain Expert", description: `Deep knowledge in ${def.stack[0]}.`, evidence: [] },
        ],
        concerns: isTop ? [] : [
            { title: "Low Review Activity", description: "Rarely reviews others' code.", severity: "low", evidence: [] }
        ],
        evidence: isTop ? [
            { type: "merged_pr", data: { repository: "core-infra", description: "Migrated 50k users to new auth system", impact: 95, mergedAt: Date.now() - 86400000 * 2 } },
            { type: "merged_pr", data: { repository: "api-gateway", description: "Reduced latency by 40% via caching", impact: 92, mergedAt: Date.now() - 86400000 * 10 } },
            { type: "code_review", data: { repository: "frontend-monorepo", description: "Critical security review on payment flow", impact: 88 } }
        ] : isMid ? [
            { type: "merged_pr", data: { repository: "dashboard-ui", description: "Implemented new dark mode theme", impact: 75, mergedAt: Date.now() - 86400000 * 5 } },
            { type: "repository", data: { repository: "personal-blog", description: "Created high-performance blog starter", impact: 65 } }
        ] : [
            { type: "issue", data: { repository: "documentation", description: "Fixed typos in getting started guide", impact: 40 } }
        ],
        shortReason: isTop
            ? `Top 5% in ${def.role} contributions with high trust.`
            : isMid
                ? `Solid ${def.role} skills but lower impact score.`
                : `New to ${def.stack[0]}, showing potential.`
    };
});
