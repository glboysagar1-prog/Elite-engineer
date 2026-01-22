import { SignIn } from "@clerk/clerk-react";
import { Lock, Code2, Search, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react"
import { useState } from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

export function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<"engineer" | "recruiter" | null>(null);

    const handleRoleSelect = (role: "engineer" | "recruiter") => {
        localStorage.setItem("intendedRole", role);
        setSelectedRole(role);
    };

    // Auto-detect role from URL params
    const [hasCheckedParams, setHasCheckedParams] = useState(false);
    if (!hasCheckedParams) {
        const params = new URLSearchParams(window.location.search);
        const roleParam = params.get("role") as "engineer" | "recruiter" | null;
        if (roleParam === "engineer" || roleParam === "recruiter") {
            handleRoleSelect(roleParam);
        }
        setHasCheckedParams(true);
    }

    // If a role is selected, show the login form (styled for that role)
    if (selectedRole) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="absolute top-8 left-8"
                    onClick={() => setSelectedRole(null)}
                >
                    ← Back to Home
                </Button>

                <div className="w-full max-w-md space-y-8 flex flex-col items-center relative z-10">
                    <div className="text-center space-y-2">
                        <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center shadow-xl ${selectedRole === 'engineer' ? 'bg-blue-600' : 'bg-amber-500'
                            }`}>
                            {selectedRole === 'engineer' ? <Code2 className="text-white h-6 w-6" /> : <Search className="text-white h-6 w-6" />}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {selectedRole === 'engineer' ? 'Engineer Portal' : 'Recruiter Access'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {selectedRole === 'engineer'
                                ? 'Verify your impact. Claim your trust score.'
                                : 'Find verified top 1% talent instantly.'}
                        </p>
                    </div>

                    <SignIn />

                    <p className="text-center text-xs text-slate-400">
                        Protected by WeCraft Trust Protocol. <Lock className="inline h-3 w-3 mb-0.5" />
                    </p>
                </div>
            </div>
        );
    }

    // Landing Page View
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <div className="h-8 w-8 bg-gradient-brand rounded-lg flex items-center justify-center text-white">W</div>
                        <span>WeCraft</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRoleSelect('engineer')}>Sign In</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="text-center max-w-4xl mx-auto space-y-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
                            <Zap className="h-3 w-3" /> The Future of Hiring
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            Trust is the new<br />Currency.
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        Stop relying on resume buzzwords. WeCraft verifies engineering impact using actual GitHub activity, code quality signals, and collaboration history.
                    </motion.p>
                </div>

                {/* Dual Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* Engineer Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                        onClick={() => handleRoleSelect('engineer')}
                    >
                        <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <Code2 />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">For Engineers</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Your code speaks for itself. Sync your GitHub to generate a verified <strong>Trust Score</strong> and showcase your true impact to elite recruiters.
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                            Login as Engineer <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </motion.div>

                    {/* Recruiter Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                        onClick={() => handleRoleSelect('recruiter')}
                    >
                        <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <Search />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">For Recruiters</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Stop filtering spam. Access a curated pool of engineers with <strong>Verified Impact Scores</strong>. Filter by actual code contributions, not claims.
                        </p>
                        <div className="flex items-center text-amber-600 dark:text-amber-400 font-semibold group-hover:gap-2 transition-all">
                            Login as Recruiter <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </motion.div>

                </div>

                {/* Features Preview */}
                <div className="mt-32 border-t border-slate-200 dark:border-slate-800 pt-20">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <div className="space-y-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold">Pure Meritocracy</h4>
                            <p className="text-sm text-slate-500">Scores based on PRs, code reviews, and architectural impact.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold">Global Benchmarking</h4>
                            <p className="text-sm text-slate-500">Compare your impact against the top 1% of developers worldwide.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold">Instant Verification</h4>
                            <p className="text-sm text-slate-500">No manual entry. Connect GitHub and get scored in seconds.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
