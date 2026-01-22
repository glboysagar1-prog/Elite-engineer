import { MatchScoreCard } from "./MatchScoreCard"
import { ScoreBreakdown } from "./ScoreBreakdown"
import { StrengthsAndConcerns } from "./StrengthsAndConcerns"
import { EvidenceSection } from "./EvidenceSection"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card } from "./ui/card"
import { Separator } from "./ui/separator"
import {
  Github,
  MapPin,
  Building,
  Calendar,
  ExternalLink,
  Download,
  Share2
} from "lucide-react"
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

interface EngineerProfile {
  username: string
  name?: string
  avatarUrl?: string
  account: {
    bio?: string
    location?: string
    company?: string
    createdAt: number
    email?: string
    followers?: number
  }
}

export interface DashboardData {
  engineer: EngineerProfile
  matchScore: {
    matchScore: number
    matchLevel: string
    recommendation: string
    trustScore: number
    fitScore: number
    impactScore: number
    isAuthentic: boolean
    isGoodFit: boolean
    hasImpact: boolean
  }
  trustScore: {
    total: number
    components: {
      accountAuthenticity: number
      contributionAuthenticity: number
      collaborationSignals: number
      antiGamingScore: number
    }
  }
  impactScore: {
    total: number
    components: {
      prImpact: number
      collaboration: number
      longevity: number
      quality: number
    }
  }
  compatibilityScore: {
    total: number
    signals: {
      technologyStackMatch: number
      domainContributionDepth: number
      architecturePatternMatch: number
      fileTypeAlignment: number
      activityTypeMatch: number
      repositoryTypeMatch: number
      reviewDomainExpertise: number
    }
  }
  strengths: Array<{
    title: string
    description: string
    evidence: string[]
  }>
  concerns: Array<{
    title: string
    description: string
    severity: "low" | "medium" | "high"
    evidence: string[]
  }>
  evidence: Array<{
    type: "merged_pr" | "code_review" | "issue" | "repository" | "collaboration"
    data: {
      repository?: string
      prId?: string
      mergedAt?: number
      filesChanged?: number
      isMaintainerMerge?: boolean
      isFork?: boolean
      description?: string
      impact?: number
    }
  }>
  whyThisMatch: string
}

interface EngineerProfileDashboardProps {
  data: DashboardData
}

export function EngineerProfileDashboard({ data }: EngineerProfileDashboardProps) {
  const syncGitHub = useAction(api.github.syncUser);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!data.engineer.username) return;
    setIsSyncing(true);
    try {
      await syncGitHub({ userId: (data as any)._id, username: data.engineer.username });
    } catch (e) { console.error("Sync Error", e); }
    finally { setIsSyncing(false); }
  };

  const accountAge = Math.floor(
    (Date.now() - data.engineer.account.createdAt) / (1000 * 60 * 60 * 24 * 365)
  )

  const joinDate = new Date(data.engineer.account.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  })

  return (
    <div className="min-h-screen bg-background pb-12 font-sans selection:bg-primary/20">
      {/* Decorative Gradient Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background -z-10" />

      {/* Header Section */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white">
              W
            </div>
            <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
              WeCraft
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
              <Github className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Refresh GitHub"}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Hero Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6">
            <Card variant="glass" className="p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Github className="h-32 w-32" />
              </div>

              <div className="flex items-start gap-6 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  {data.engineer.avatarUrl && <AvatarImage src={data.engineer.avatarUrl} />}
                  <AvatarFallback className="text-3xl">
                    {data.engineer.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {data.engineer.name || data.engineer.username}
                    </h1>
                    <Badge variant="outline" className="text-muted-foreground">
                      @{data.engineer.username}
                    </Badge>
                  </div>

                  {data.engineer.account.bio && (
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                      {data.engineer.account.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                    {data.engineer.account.company && (
                      <div className="flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary" />
                        {data.engineer.account.company}
                      </div>
                    )}
                    {data.engineer.account.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {data.engineer.account.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      Joined {joinDate} ({accountAge} years)
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    Backend Focused
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    Open Source Contributor
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="gap-2">
                    View Profile <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Why This Match */}
            <Card variant="gradient" className="p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Why This Match?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {data.whyThisMatch}
              </p>
            </Card>

            {/* Score Breakdown (Tabs) */}
            <ScoreBreakdown
              trustScore={data.trustScore}
              impactScore={data.impactScore}
              compatibilityScore={data.compatibilityScore}
            />

            {/* Evidence Section */}
            <EvidenceSection evidence={data.evidence} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Main Score Card */}
            <div className="sticky top-24 space-y-6">
              <MatchScoreCard {...data.matchScore} />

              <StrengthsAndConcerns
                strengths={data.strengths}
                concerns={data.concerns}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
