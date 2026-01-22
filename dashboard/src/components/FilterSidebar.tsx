import { useState } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
// import { Separator } from "./ui/separator"
import { Slider } from "./ui/slider"
import { Input } from "./ui/input"
import { Filter, Search, CheckCircle2 } from "lucide-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import { cn } from "@/lib/utils"

interface FilterState {
    role: string | null;
    minTrustScore: number;
    techStack: string[];
    recency: "all" | "30d" | "90d";
}

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onReset: () => void;
    resultCount: number;
}

const ROLES = ["Backend", "Frontend", "Full-stack", "DevOps", "Mobile", "Data Eng"];
const STACKS = ["React", "Node.js", "Python", "Go", "Rust", "Typescript", "AWS", "Docker", "Kubernetes", "GraphQL", "PostgreSQL", "Next.js"];

export function FilterSidebar({ filters, onFilterChange, onReset, resultCount }: FilterSidebarProps) {
    const [stackSearch, setStackSearch] = useState("");

    // Accordion state
    const [openItem, setOpenItem] = useState<string | null>("stack"); // Default open

    const toggleStack = (tech: string) => {
        const current = filters.techStack;
        const next = current.includes(tech)
            ? current.filter(t => t !== tech)
            : [...current, tech];
        onFilterChange({ ...filters, techStack: next });
    };

    const filteredStacks = STACKS.filter(s => s.toLowerCase().includes(stackSearch.toLowerCase()));

    return (
        <div className="h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-black/20 backdrop-blur-xl w-72 flex flex-col fixed left-0 top-16 bottom-0 z-30">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/40">
                <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
                    <Filter className="h-3.5 w-3.5 text-amber-500" />
                    <span>Filters</span>
                </div>
                {resultCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {resultCount} found
                    </Badge>
                )}
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                <Accordion value={openItem || ""} onValueChange={setOpenItem as any}>

                    {/* 1. Recency & Activity */}
                    <AccordionItem value="activity" className="border-none">
                        <AccordionTrigger value="activity" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 py-3">
                            Activity & Role
                        </AccordionTrigger>
                        <AccordionContent value="activity">
                            <div className="space-y-4">
                                {/* Recency Segments (Nano Style) */}
                                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
                                    {[
                                        { id: "all", label: "All" },
                                        { id: "30d", label: "30d" },
                                        { id: "90d", label: "90d" }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => onFilterChange({ ...filters, recency: opt.id as any })}
                                            className={cn(
                                                "text-[10px] font-medium py-1.5 rounded-md transition-all text-center",
                                                filters.recency === opt.id
                                                    ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-black/5"
                                                    : "text-slate-500 hover:text-slate-900"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Role Select (Nano List) */}
                                <div className="space-y-1">
                                    <div className="text-[10px] font-medium text-slate-400 mb-2">TARGET ROLE</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ROLES.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => onFilterChange({ ...filters, role: filters.role === role ? null : role })}
                                                className={cn(
                                                    "text-xs px-3 py-2 rounded-md border text-left flex items-center justify-between transition-all",
                                                    filters.role === role
                                                        ? "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-100"
                                                        : "border-slate-100 bg-white hover:border-slate-300 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                                                )}
                                            >
                                                {role}
                                                {filters.role === role && <CheckCircle2 className="h-3 w-3 text-amber-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 2. Tech Stack (Pro Search) */}
                    <AccordionItem value="stack" className="border-none">
                        <AccordionTrigger value="stack" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 py-3">
                            Tech Stack
                        </AccordionTrigger>
                        <AccordionContent value="stack">
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
                                    <Input
                                        placeholder="Filter stack..."
                                        value={stackSearch}
                                        onChange={(e) => setStackSearch(e.target.value)}
                                        className="h-8 text-xs pl-8 bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                                    {filteredStacks.map(tech => {
                                        const isActive = filters.techStack.includes(tech);
                                        return (
                                            <button
                                                key={tech}
                                                onClick={() => toggleStack(tech)}
                                                className={cn(
                                                    "text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5",
                                                    isActive
                                                        ? "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                                                )}
                                            >
                                                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                                                {tech}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 3. Trust Score (Pro Slider) */}
                    <AccordionItem value="trust" className="border-none">
                        <AccordionTrigger value="trust" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 py-3">
                            Trust Validation
                        </AccordionTrigger>
                        <AccordionContent value="trust">
                            <div className="px-1 py-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Minimum Score</span>
                                    <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                                        {filters.minTrustScore}%
                                    </span>
                                </div>
                                <Slider
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={[filters.minTrustScore]}
                                    onValueChange={(val) => onFilterChange({ ...filters, minTrustScore: val[0] })}
                                    className="py-2"
                                />
                                <div className="grid grid-cols-4 gap-1">
                                    {[0, 70, 80, 90].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => onFilterChange({ ...filters, minTrustScore: s })}
                                            className={cn(
                                                "text-[10px] border rounded py-1 transition-all",
                                                filters.minTrustScore === s
                                                    ? "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                                                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            {s > 0 ? `${s}+` : "Any"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="w-full text-xs text-slate-400 hover:text-slate-900 hover:bg-slate-200/50"
                >
                    Reset All Filters
                </Button>
            </div>
        </div>
    )
}
