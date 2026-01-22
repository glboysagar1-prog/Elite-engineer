import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  GitMerge,
  MessageSquare,
  AlertCircle,
  FolderGit2,
  Users,
  ExternalLink,
  GitPullRequest,
  Check
} from "lucide-react"

interface Evidence {
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
}

interface EvidenceSectionProps {
  evidence: Evidence[]
}

const evidenceIcons = {
  merged_pr: GitMerge,
  code_review: MessageSquare,
  issue: AlertCircle,
  repository: FolderGit2,
  collaboration: Users,
}

const evidenceLabels = {
  merged_pr: "Merged PR",
  code_review: "Code Review",
  issue: "Issue",
  repository: "Repository",
  collaboration: "Collaboration",
}

const evidenceColors = {
  merged_pr: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  code_review: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  issue: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  repository: "text-slate-600 bg-slate-100 dark:bg-slate-800/50",
  collaboration: "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
}

export function EvidenceSection({ evidence }: EvidenceSectionProps) {
  // Sort by impact if available, otherwise simplified sort
  const sortedEvidence = [...evidence].sort((a, b) =>
    (b.data.impact || 0) - (a.data.impact || 0)
  )

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Evidence Stream</CardTitle>
            <p className="text-sm text-muted-foreground">
              Verified contributions from GitHub activity
            </p>
          </div>
          <Badge variant="outline" className="h-7 text-xs font-mono">
            {evidence.length} Items Validated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {sortedEvidence.map((item, index) => {
            const Icon = evidenceIcons[item.type]
            const colorClass = evidenceColors[item.type]
            const isPR = item.type === "merged_pr"

            return (
              <div
                key={index}
                className="group flex gap-4 p-4 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Icon Column */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="w-px h-full bg-border/50 group-last:hidden" />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {evidenceLabels[item.type]}
                        </span>
                        {item.data.repository && (
                          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                            {item.data.repository}
                            {item.data.prId && `#${item.data.prId}`}
                          </Badge>
                        )}
                        {item.data.isMaintainerMerge && (
                          <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Maintainer Merge
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {item.data.description || "No description provided"}
                      </p>
                    </div>

                    {item.data.impact !== undefined && (
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Badge variant={item.data.impact > 70 ? "success" : "secondary"} size="sm">
                          Impact: {item.data.impact}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    {item.data.filesChanged && (
                      <div className="flex items-center gap-1">
                        <FolderGit2 className="h-3 w-3" />
                        {item.data.filesChanged} files changed
                      </div>
                    )}
                    {isPR && (
                      <div className="flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3" />
                        Merged
                      </div>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      View on GitHub <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
