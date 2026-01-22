import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { CheckCircle2, AlertTriangle, Info, ChevronRight } from "lucide-react"

interface Strength {
  title: string
  description: string
  evidence: string[]
}

interface Concern {
  title: string
  description: string
  severity: "low" | "medium" | "high"
  evidence: string[]
}

interface StrengthsAndConcernsProps {
  strengths: Strength[]
  concerns: Concern[]
}

function getSeverityVariant(severity: string): "info" | "warning" | "destructive" {
  switch (severity) {
    case "high": return "destructive"
    case "medium": return "warning"
    default: return "info"
  }
}

function getSeverityBg(severity: string): string {
  switch (severity) {
    case "high": return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    case "medium": return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    default: return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
  }
}

export function StrengthsAndConcerns({
  strengths,
  concerns,
}: StrengthsAndConcernsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strengths */}
      <Card variant="default" hover="lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Strengths</CardTitle>
              <p className="text-sm text-muted-foreground">{strengths.length} identified</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {strengths.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No strengths identified.</p>
          ) : (
            strengths.map((strength, index) => (
              <div
                key={index}
                className="group p-4 rounded-xl border bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/5 border-green-100 dark:border-green-800/30 hover:border-green-200 dark:hover:border-green-700/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-green-500 group-hover:translate-x-0.5 transition-transform" />
                  <div className="flex-1 space-y-1.5">
                    <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                      {strength.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {strength.description}
                    </p>
                    {strength.evidence.length > 0 && (
                      <div className="pt-2 space-y-1">
                        {strength.evidence.map((evidence, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
                            <span>{evidence}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Concerns */}
      <Card variant="default" hover="lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Concerns</CardTitle>
              <p className="text-sm text-muted-foreground">{concerns.length} identified</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {concerns.length === 0 ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400">No concerns identified.</p>
            </div>
          ) : (
            concerns.map((concern, index) => (
              <div
                key={index}
                className={`group p-4 rounded-xl border transition-all ${getSeverityBg(concern.severity)}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-sm">{concern.title}</h4>
                  <Badge variant={getSeverityVariant(concern.severity)} size="sm">
                    {concern.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {concern.description}
                </p>
                {concern.evidence.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {concern.evidence.map((evidence, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
                        <span>{evidence}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
