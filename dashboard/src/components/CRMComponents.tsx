import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
    FolderPlus,
    Briefcase,
    History,
    Send,
    Mail,
    Linkedin,
    Phone,
    CheckCircle2
} from "lucide-react"

/**
 * Job Management Sidebar/Section
 */
export function JobManager() {
    const [isCreating, setIsCreating] = useState(false);
    const [newJobTitle, setNewJobTitle] = useState("");
    const jobs = useQuery(api.crm.listJobs);
    const createJob = useMutation(api.crm.createJob);

    const handleCreate = async () => {
        if (!newJobTitle) return;
        await createJob({ title: newJobTitle });
        setNewJobTitle("");
        setIsCreating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job Folders</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreating(true)}>
                    <FolderPlus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {isCreating && (
                <div className="px-2 space-y-2">
                    <Input
                        placeholder="Job title..."
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        className="h-7 text-xs"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-[10px] flex-1" onClick={handleCreate}>Create</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] flex-1" onClick={() => setIsCreating(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {jobs?.map(job => (
                    <button
                        key={job._id}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 group"
                    >
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">{job.title}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 group-hover:bg-slate-200">
                            {job.candidateIds.length}
                        </Badge>
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * Contact History Component for Candidate detail view
 */
export function ContactHistory({ candidateId }: { candidateId: string }) {
    const history = useQuery(api.crm.getContactHistory, { candidateId: candidateId as any });
    const logContact = useMutation(api.crm.logContact);
    const [note, setNote] = useState("");

    const handleLog = async (platform: "email" | "linkedin" | "phone") => {
        await logContact({
            candidateId: candidateId as any,
            platform,
            note: note || `Contacted via ${platform}`
        });
        setNote("");
    };

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                <History className="h-3 w-3" /> Contact History
            </h4>

            {/* Quick Log */}
            <div className="flex gap-2">
                <Input
                    placeholder="Add a note..."
                    className="h-8 text-xs"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleLog("email")}>
                    <Mail className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleLog("linkedin")}>
                    <Linkedin className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {history?.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No contact history yet.</p>
                ) : (
                    history?.map((item, idx) => (
                        <div key={item._id} className="flex gap-3 text-[11px] border-l-2 border-slate-200 pl-3 py-1">
                            <div className="flex-1">
                                <p className="font-medium text-slate-700 dark:text-slate-300">{item.note}</p>
                                <p className="text-[9px] text-slate-400">
                                    {new Date(item.timestamp).toLocaleDateString()} via {item.platform}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
