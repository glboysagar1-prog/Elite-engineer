
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { X, Check } from "lucide-react"
import { Card, CardHeader, CardTitle } from "./ui/card"
import { ScoreRing } from "./ui/score-ring"

interface ComparisonViewProps {
    candidates: any[];
    onClose: () => void;
}

export function ComparisonView({ candidates, onClose }: ComparisonViewProps) {
    if (candidates.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
            <Card className="w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border-slate-200 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                    <CardTitle>Candidate Comparison</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <div className="overflow-auto flex-1 p-6">
                    <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(250px,1fr))] gap-8">
                        {/* Labels Column */}
                        <div className="space-y-8 pt-32 text-sm font-semibold text-muted-foreground">
                            <div className="h-24 flex items-center">Overall Match</div>
                            <div className="h-32 flex items-center">Trust & Integrity</div>
                            <div className="h-32 flex items-center">Impact & Output</div>
                            <div className="h-32 flex items-center">Fit & Stack</div>
                            <div className="h-24">Strengths</div>
                            <div className="h-24">Concerns</div>
                        </div>

                        {/* Candidate Columns */}
                        {candidates.map((c) => (
                            <div key={c.id} className="space-y-8 min-w-[250px]">
                                {/* Header Card */}
                                <div className="h-28 space-y-2">
                                    <h3 className="text-xl font-bold">{c.engineer.name}</h3>
                                    <div className="text-sm text-muted-foreground font-mono">@{c.engineer.username}</div>
                                    <Badge variant="outline">{c.role}</Badge>
                                </div>

                                {/* Match Score */}
                                <div className="h-24 flex items-center">
                                    <div className="flex items-center gap-4">
                                        <ScoreRing score={c.matchScore.matchScore} size="md" />
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold">{c.matchScore.matchScore}</span>
                                            <span className="text-xs text-muted-foreground uppercase">{c.matchScore.matchLevel}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust */}
                                <div className="h-32 space-y-2 text-sm">
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Total Trust</span>
                                        <span className="font-bold">{c.trustScore.total}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>Account: {c.trustScore.components.accountAuthenticity}</span>
                                        <span>Contrib: {c.trustScore.components.contributionAuthenticity}</span>
                                        <span>Collab: {c.trustScore.components.collaborationSignals}</span>
                                        <span>Anti-Game: {c.trustScore.components.antiGamingScore}</span>
                                    </div>
                                </div>

                                {/* Impact */}
                                <div className="h-32 space-y-2 text-sm">
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Total Impact</span>
                                        <span className="font-bold">{c.impactScore.total}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>PR Size: {c.impactScore.components.prImpact}</span>
                                        <span>Longevity: {c.impactScore.components.longevity}</span>
                                        <span>Quality: {c.impactScore.components.quality}</span>
                                    </div>
                                </div>

                                {/* Fit */}
                                <div className="h-32 space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                        {c.techStack.map((t: string) => (
                                            <Badge key={t} variant={c.techStack.length < 4 ? "secondary" : "outline"} className="text-[10px]">
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Strengths */}
                                <div className="h-24 space-y-1 text-sm">
                                    {c.strengths.slice(0, 2).map((s: { title: string }, i: number) => (
                                        <div key={i} className="flex gap-2 items-start text-green-700 dark:text-green-400">
                                            <Check className="h-3 w-3 mt-1 shrink-0" />
                                            <span className="text-xs leading-tight">{s.title}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Concerns */}
                                <div className="h-24 space-y-1 text-sm">
                                    {c.concerns.length > 0 ? c.concerns.map((g: { title: string }, i: number) => (
                                        <div key={i} className="flex gap-2 items-start text-orange-600 dark:text-orange-400">
                                            <span className="text-xs leading-tight opacity-80">{g.title}</span>
                                        </div>
                                    )) : <span className="text-xs text-muted-foreground italic">No major concerns</span>}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
                    <Button onClick={onClose}>Close Comparison</Button>
                </div>
            </Card>
        </div>
    )
}
