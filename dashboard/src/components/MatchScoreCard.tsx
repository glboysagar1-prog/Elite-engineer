import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { ScoreRing } from "./ui/score-ring"
import { Separator } from "./ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./ui/tooltip"
import { CheckCircle2, AlertCircle, Shield, Target, TrendingUp, Sparkles } from "lucide-react"

interface MatchScoreCardProps {
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

function getMatchLevelVariant(level: string): "excellent" | "strong" | "good" | "fair" | "poor" {
  switch (level) {
    case "excellent": return "excellent"
    case "strong": return "strong"
    case "good": return "good"
    case "fair": return "fair"
    case "poor": return "poor"
    default: return "good"
  }
}

function formatRecommendation(rec: string): string {
  return rec.split("-").map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ")
}

export function MatchScoreCard({
  matchScore,
  matchLevel,
  recommendation,
  trustScore,
  fitScore,
  impactScore,
  isAuthentic,
  isGoodFit,
  hasImpact,
}: MatchScoreCardProps) {
  return (
    <Card variant="gradient" className="overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <CardTitle>Recruiter Match Score</CardTitle>
          </div>
          <Badge variant={getMatchLevelVariant(matchLevel)} size="lg">
            {matchLevel.charAt(0).toUpperCase() + matchLevel.slice(1)} Match
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Main Score Ring */}
        <div className="flex flex-col items-center py-4">
          <ScoreRing
            score={matchScore}
            size="xl"
            label="Match"
            animate
          />
          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{formatRecommendation(recommendation)}</span>
          </div>
        </div>

        <Separator />

        {/* Component Scores */}
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-4">
            {/* Trust Score */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-help">
                  <Shield className="h-5 w-5 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{Math.round(trustScore)}</div>
                  <div className="text-xs text-muted-foreground mb-2">Trust</div>
                  {isAuthentic ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Trust score measures account authenticity, contribution patterns, and anti-gaming signals.
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Fit Score */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/20 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors cursor-help">
                  <Target className="h-5 w-5 text-violet-600 mb-2" />
                  <div className="text-2xl font-bold text-violet-600">{Math.round(fitScore)}</div>
                  <div className="text-xs text-muted-foreground mb-2">Fit</div>
                  {isGoodFit ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Fit score evaluates technology stack alignment and domain expertise match.
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Impact Score */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-4 rounded-xl bg-green-50/50 dark:bg-green-900/20 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors cursor-help">
                  <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600">{Math.round(impactScore)}</div>
                  <div className="text-xs text-muted-foreground mb-2">Impact</div>
                  {hasImpact ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Impact score reflects PR contributions, code reviews, and collaboration quality.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
