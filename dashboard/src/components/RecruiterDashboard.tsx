import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { FilterSidebar } from "./FilterSidebar"
import { CandidateTable } from "./CandidateTable"
import { ComparisonView } from "./ComparisonView"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Search, Users, Loader2 } from "lucide-react"

export function RecruiterDashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [filters, setFilters] = useState({
        role: null as string | null,
        minTrustScore: 0,
        techStack: [] as string[],
        recency: "all" as "all" | "30d" | "90d"
    });

    const engineers = useQuery(api.users.listEngineers);

    // Filter Logic
    const filteredCandidates = useMemo(() => {
        if (!engineers) return [];

        return engineers.map((eng: any) => {
            const score = eng.score || { trustScore: 0, impactScore: 0, details: {}, evidence: [] };
            const details = score.details || {};
            const matchScoreValue = Math.round(((score.trustScore || 0) + (score.impactScore || 0)) / 2);

            return {
                id: eng._id,
                role: details.suggestedRole || "Engineer",
                matchScore: {
                    matchScore: matchScoreValue,
                    matchLevel: matchScoreValue > 90 ? "Excellent" : matchScoreValue > 75 ? "Good" : "Fair",
                    recommendation: matchScoreValue > 85 ? "Strong Hire" : "Review needed",
                    trustScore: score.trustScore || 0,
                    fitScore: 85,
                    impactScore: score.impactScore || 0,
                    isAuthentic: (score.trustScore || 0) > 80,
                    isGoodFit: true,
                    hasImpact: (score.impactScore || 0) > 70,
                },
                trustScore: {
                    total: score.trustScore || 0,
                    components: {
                        accountAuthenticity: details.accountAuthenticity || 0,
                        contributionAuthenticity: details.contributionAuthenticity || 0,
                        collaborationSignals: 80,
                        antiGamingScore: 90,
                    }
                },
                impactScore: {
                    total: score.impactScore || 0,
                    components: {
                        prImpact: details.prImpact || 0,
                        collaboration: details.collaboration || 0,
                        longevity: 85,
                        quality: 80,
                    }
                },
                compatibilityScore: {
                    total: 85,
                    signals: {
                        technologyStackMatch: 90,
                        domainContributionDepth: 80,
                        architecturePatternMatch: 70,
                        fileTypeAlignment: 85,
                        activityTypeMatch: 80,
                        repositoryTypeMatch: 85,
                        reviewDomainExpertise: 75
                    }
                },
                engineer: {
                    name: eng.name,
                    username: eng.username || "unknown",
                    avatarUrl: eng.avatarUrl,
                    linkedinUrl: eng.linkedinUrl,
                    phone: eng.phone,
                    email: eng.email,
                    account: {
                        createdAt: eng._creationTime,
                        location: "Remote",
                        company: "Elite Pool"
                    }
                },
                techStack: details.techStack || [],
                lastActive: score.lastUpdated || eng._creationTime,
                shortReason: "Verified Elite Engineer based on GitHub audit.",
                evidence: score.evidence || [],
                strengths: [
                    { title: "High Authenticity", description: "Verified contribution patterns." }
                ],
                concerns: []
            };
        }).filter((c: any) => {
            // 1. Text Search
            const matchesSearch =
                (c.engineer.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                c.engineer.username.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            // 2. Role Filter
            if (filters.role && c.role !== filters.role) return false;

            // 3. Trust Score Filter
            if (c.trustScore.total < filters.minTrustScore) return false;

            // 4. Tech Stack Filter
            if (filters.techStack.length > 0) {
                const hasMatchingTech = filters.techStack.every((tech: string) =>
                    c.techStack.includes(tech)
                );
                if (!hasMatchingTech) return false;
            }

            // 5. Recency Filter
            if (filters.recency !== "all") {
                const days = filters.recency === "30d" ? 30 : 90;
                const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
                if (c.lastActive < cutoff) return false;
            }

            return true;
        });
    }, [engineers, searchQuery, filters]);

    // Selection Handler
    const toggleSelection = (id: string) => {
        setSelectedIds(curr =>
            curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
        );
    };

    const selectedCandidates = useMemo(() =>
        filteredCandidates.filter((c: any) => selectedIds.includes(c.id)),
        [filteredCandidates, selectedIds]);

    if (engineers === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Fetching engineers from pool...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-6 gap-4">
                    <div className="flex items-center gap-2 font-bold text-lg mr-4">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            W
                        </div>
                        WeCraft <span className="text-slate-400 font-normal">Recruit</span>
                    </div>

                    <div className="flex-1 max-w-xl relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search engineers by name or username..."
                            className="pl-9 bg-slate-50 dark:bg-slate-900"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Users className="mr-2 h-4 w-4" />
                            My Team
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-72 hidden md:block relative">
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        onReset={() => setFilters({ role: null, minTrustScore: 0, techStack: [], recency: "all" })}
                        resultCount={filteredCandidates.length}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">Engineer Discovery</h1>
                        <p className="text-muted-foreground">
                            Reviewing {filteredCandidates.length} candidates based on your criteria.
                        </p>
                    </div>

                    <CandidateTable
                        candidates={filteredCandidates}
                        selectedIds={selectedIds}
                        onSelect={toggleSelection}
                        onCompare={() => setIsComparing(true)}
                    />
                </main>
            </div>

            {/* Comparison Modal */}
            {isComparing && (
                <ComparisonView
                    candidates={selectedCandidates as any}
                    onClose={() => setIsComparing(false)}
                />
            )}
        </div>
    )
}
