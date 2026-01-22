import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScoreRing } from "./ui/score-ring"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./ui/tooltip"
import { Shield, Target, TrendingUp, Info } from "lucide-react"

interface ScoreBreakdownProps {
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
}

interface MetricRowProps {
  label: string
  value: number
  tooltip?: string
  variant?: "default" | "gradient" | "success" | "warning" | "info"
}

function MetricRow({ label, value, tooltip, variant = "default" }: MetricRowProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{label}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span className="font-semibold tabular-nums">{Math.round(value)}</span>
        </div>
        <Progress value={value} variant={variant} size="sm" />
      </div>
    </TooltipProvider>
  )
}

export function ScoreBreakdown({
  trustScore,
  impactScore,
  compatibilityScore,
}: ScoreBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trust" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="trust" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Trust</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Impact</span>
            </TabsTrigger>
            <TabsTrigger value="compatibility" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Compatibility</span>
            </TabsTrigger>
          </TabsList>

          {/* Trust Score Tab */}
          <TabsContent value="trust">
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="flex justify-center">
                <ScoreRing
                  score={trustScore.total}
                  size="lg"
                  label="Trust"
                />
              </div>
              <div className="space-y-4">
                <MetricRow
                  label="Account Authenticity"
                  value={trustScore.components.accountAuthenticity}
                  variant="info"
                  tooltip="Based on account age, activity consistency, and profile completeness"
                />
                <MetricRow
                  label="Contribution Authenticity"
                  value={trustScore.components.contributionAuthenticity}
                  variant="info"
                  tooltip="Quality and originality of code contributions"
                />
                <MetricRow
                  label="Collaboration Signals"
                  value={trustScore.components.collaborationSignals}
                  variant="info"
                  tooltip="Participation in code reviews, discussions, and team projects"
                />
                <MetricRow
                  label="Anti-Gaming Score"
                  value={trustScore.components.antiGamingScore}
                  variant="info"
                  tooltip="Detection of artificial contribution patterns or star farming"
                />
              </div>
            </div>
          </TabsContent>

          {/* Impact Score Tab */}
          <TabsContent value="impact">
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="flex justify-center">
                <ScoreRing
                  score={impactScore.total}
                  size="lg"
                  label="Impact"
                />
              </div>
              <div className="space-y-4">
                <MetricRow
                  label="PR Impact"
                  value={impactScore.components.prImpact}
                  variant="success"
                  tooltip="Size, complexity, and significance of merged pull requests"
                />
                <MetricRow
                  label="Collaboration"
                  value={impactScore.components.collaboration}
                  variant="success"
                  tooltip="Cross-team contributions and collaborative coding efforts"
                />
                <MetricRow
                  label="Longevity"
                  value={impactScore.components.longevity}
                  variant="success"
                  tooltip="Sustained contribution over time, not just short bursts"
                />
                <MetricRow
                  label="Quality"
                  value={impactScore.components.quality}
                  variant="success"
                  tooltip="Code review feedback, test coverage, and documentation"
                />
              </div>
            </div>
          </TabsContent>

          {/* Compatibility Score Tab */}
          <TabsContent value="compatibility">
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="flex justify-center">
                <ScoreRing
                  score={compatibilityScore.total}
                  size="lg"
                  label="Fit"
                />
              </div>
              <div className="space-y-4">
                <MetricRow
                  label="Technology Stack"
                  value={compatibilityScore.signals.technologyStackMatch}
                  variant="gradient"
                  tooltip="Alignment with your required technologies and frameworks"
                />
                <MetricRow
                  label="Domain Depth"
                  value={compatibilityScore.signals.domainContributionDepth}
                  variant="gradient"
                  tooltip="Experience depth in relevant domains (backend, frontend, etc.)"
                />
                <MetricRow
                  label="Architecture Patterns"
                  value={compatibilityScore.signals.architecturePatternMatch}
                  variant="gradient"
                  tooltip="Familiarity with microservices, distributed systems, or monoliths"
                />
                <MetricRow
                  label="File Type Alignment"
                  value={compatibilityScore.signals.fileTypeAlignment}
                  variant="gradient"
                  tooltip="Match between candidate's common file types and job requirements"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
