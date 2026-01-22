import { useState } from "react"

import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
    CheckSquare,
    Square,
    ShieldCheck,
    Zap,
    Target
} from "lucide-react"

interface CandidateTableProps {
    candidates: any[];
    selectedIds: string[];
    onSelect: (id: string) => void;
    onCompare: () => void;
}

type SortField = "matchScore" | "trustScore" | "impactScore";

export function CandidateTable({ candidates, selectedIds, onSelect, onCompare }: CandidateTableProps) {
    const [sortField, setSortField] = useState<SortField>("matchScore");
    const [sortDesc, setSortDesc] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDesc(!sortDesc);
        } else {
            setSortField(field);
            setSortDesc(true);
        }
    };

    const sortedCandidates = [...candidates].sort((a, b) => {
        const valA = sortField === "matchScore" ? a.matchScore.matchScore :
            sortField === "trustScore" ? a.trustScore.total :
                a.impactScore.total;
        const valB = sortField === "matchScore" ? b.matchScore.matchScore :
            sortField === "trustScore" ? b.trustScore.total :
                b.impactScore.total;
        return sortDesc ? valB - valA : valA - valB;
    });

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600 dark:text-green-400 font-bold";
        if (score >= 75) return "text-blue-600 dark:text-blue-400 font-semibold";
        return "text-slate-600 dark:text-slate-400";
    };

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Table Actions Header */}
            {selectedIds.length > 0 && (
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-1">
                    <div className="font-medium">
                        {selectedIds.length} Candidate{selectedIds.length > 1 ? "s" : ""} selected
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={onCompare} disabled={selectedIds.length < 2}>
                            Compare ({selectedIds.length})
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" onClick={() => selectedIds.forEach(id => onSelect(id))}>
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            {/* Table Header */}
            <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_2fr] gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div></div> {/* Checkbox col */}
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700" onClick={() => handleSort("matchScore")}>
                    Candidate / Role
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 text-right justify-end" onClick={() => handleSort("matchScore")}>
                    Match Score
                    <ArrowUpDown className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 text-right justify-end" onClick={() => handleSort("trustScore")}>
                    Trust
                    <ArrowUpDown className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 text-right justify-end" onClick={() => handleSort("impactScore")}>
                    Impact
                    <ArrowUpDown className="h-3 w-3" />
                </div>
                <div>Tech Stack</div>
                <div>Why Ranked Here?</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedCandidates.map((candidate) => {
                    const isSelected = selectedIds.includes(candidate.id);
                    const isExpanded = expandedId === candidate.id;

                    return (
                        <div
                            key={candidate.id}
                            className={`text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                        >
                            <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_2fr] gap-4 px-4 py-4 items-center">

                                {/* Checkbox */}
                                <div onClick={() => onSelect(candidate.id)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                                    {isSelected ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5" />}
                                </div>

                                {/* Candidate Info */}
                                <div className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : candidate.id)}>
                                    <div className="font-bold text-slate-900 dark:text-slate-100">
                                        {candidate.engineer.name}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className="font-mono">@{candidate.engineer.username}</span>
                                        <span>•</span>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal">
                                            {candidate.role}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Match Score */}
                                <div className="text-right font-black text-lg tabular-nums">
                                    <span className={getScoreColor(candidate.matchScore.matchScore)}>
                                        {candidate.matchScore.matchScore}
                                    </span>
                                </div>

                                {/* Trust - Impact - Fit (Mini Columns) */}
                                <div className="text-right tabular-nums font-medium text-slate-600 dark:text-slate-300">
                                    {candidate.trustScore.total}
                                </div>
                                <div className="text-right tabular-nums font-medium text-slate-600 dark:text-slate-300">
                                    {candidate.impactScore.total}
                                </div>

                                {/* Tech Stack */}
                                <div className="flex flex-wrap gap-1">
                                    {candidate.techStack.slice(0, 3).map((tech: string) => (
                                        <span key={tech} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {tech}
                                        </span>
                                    ))}
                                    {candidate.techStack.length > 3 && (
                                        <span className="text-[10px] text-slate-400">+{candidate.techStack.length - 3}</span>
                                    )}
                                </div>

                                {/* Insight */}
                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-8 relative">
                                    {candidate.shortReason}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400"
                                        onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                                    >
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Expansion Panel */}
                            {isExpanded && (
                                <div className="bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 p-6 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Score Details Column */}
                                        <div className="space-y-4 col-span-1">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" /> Score Breakdown
                                                </h4>
                                                <div className="text-sm border rounded-md p-3 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-500">Account Authenticity</span>
                                                        <span className="font-mono font-bold">{candidate.trustScore.components.accountAuthenticity}</span>
                                                    </div>
                                                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-500">PR Complexity</span>
                                                        <span className="font-mono font-bold">{candidate.impactScore.components.prImpact}</span>
                                                    </div>
                                                    <div className="flex justify-between py-1 pt-2">
                                                        <span className="text-slate-500">Recency</span>
                                                        <span className="text-xs">{new Date(candidate.lastActive).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact Section */}
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                                                    <Target className="h-3 w-3" /> Contact Information
                                                </h4>
                                                <div className="text-sm border rounded-md p-3 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500">Email</span>
                                                        <a href={`mailto:${candidate.engineer.email}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                                            {candidate.engineer.email}
                                                        </a>
                                                    </div>
                                                    {candidate.engineer.phone && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Phone</span>
                                                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                                {candidate.engineer.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {candidate.engineer.linkedinUrl && (
                                                        <div className="pt-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full h-8 text-xs gap-2 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(candidate.engineer.linkedinUrl, '_blank');
                                                                }}
                                                            >
                                                                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                                </svg>
                                                                Connect on LinkedIn
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verified Evidence Column (Span 2) */}
                                        <div className="space-y-6 col-span-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Top Evidence */}
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                                                        <Zap className="h-3 w-3" /> Top Verified Evidence
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {candidate.evidence.length > 0 ? candidate.evidence.slice(0, 3).map((item: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
                                                                <div className={`mt-0.5 p-1 rounded ${item.type === 'merged_pr' ? 'bg-purple-100 text-purple-700' :
                                                                    item.type === 'code_review' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                                    }`}>
                                                                    {item.type === 'merged_pr' ? <Zap className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-sm font-medium truncate">{item.data.description}</p>
                                                                        <Badge variant="secondary" className="text-[10px] h-5">
                                                                            {item.data.impact}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed rounded-md">
                                                                No high-impact evidence found.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CRM: Contact History */}
                                                <ContactHistory candidateId={candidate.id} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <AddToJobButton candidateId={candidate.id} />
                                        </div>
                                        <Button size="sm" onClick={() => alert("Navigate to full profile")}>
                                            View Full Audit Profile
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function AddToJobButton({ candidateId }: { candidateId: string }) {
    const jobs = useQuery(api.crm.listJobs);
    const addCandidateToJob = useMutation(api.crm.addCandidateToJob);
    const [isOpen, setIsOpen] = useState(false);
    const [addedJobs, setAddedJobs] = useState<string[]>([]);

    const handleAdd = async (jobId: string) => {
        await addCandidateToJob({ jobId: jobId as any, candidateId: candidateId as any });
        setAddedJobs([...addedJobs, jobId]);
        setTimeout(() => setIsOpen(false), 1000);
    };

    return (
        <div className="relative">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsOpen(!isOpen)}>
                <Briefcase className="h-3.5 w-3.5" />
                Add to Job
            </Button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-900 border rounded-lg shadow-xl z-50 p-2 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Select Job</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {jobs?.length === 0 && <p className="text-xs text-slate-500 p-2 italic">No jobs found.</p>}
                        {jobs?.map(job => (
                            <button
                                key={job._id}
                                onClick={() => handleAdd(job._id)}
                                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center"
                            >
                                <span className="truncate">{job.title}</span>
                                {addedJobs.includes(job._id) && <CheckSquare className="h-3 w-3 text-green-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import { ContactHistory } from "./CRMComponents"
import { Briefcase } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
