import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * mutation to seed demo engineers for showcase
 */
export const seedDemoData = mutation({
    args: {},
    handler: async (ctx) => {
        const demoEngineers = [
            {
                name: "Alex Rivera",
                username: "alex_backend_pro",
                email: "alex@example.com",
                avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
                trustScore: 94,
                impactScore: 88,
                details: {
                    accountAuthenticity: 98,
                    contributionAuthenticity: 95,
                    prImpact: 92,
                    collaboration: 85,
                },
                evidence: [
                    {
                        type: "repository",
                        data: {
                            repository: "wecraft/core-engine",
                            description: "Lead architect for the distributed consensus system. Merged 45+ critical PRs.",
                            impact: 95
                        }
                    },
                    {
                        type: "repository",
                        data: {
                            repository: "open-source/high-perf-kv",
                            description: "Significant optimizations to the memory management layer, reducing latency by 30%.",
                            impact: 88
                        }
                    }
                ]
            },
            {
                name: "Sarah Chen",
                username: "sarah_ui_arch",
                email: "sarah@example.com",
                avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
                trustScore: 91,
                impactScore: 95,
                details: {
                    accountAuthenticity: 92,
                    contributionAuthenticity: 90,
                    prImpact: 98,
                    collaboration: 94,
                },
                evidence: [
                    {
                        type: "repository",
                        data: {
                            repository: "shadcn/ui-components",
                            description: "Core contributor to the accessibility layer and design system tokens.",
                            impact: 97
                        }
                    }
                ]
            },
            {
                name: "Marcus Thorne",
                username: "marcus_infra",
                email: "marcus@example.com",
                avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
                trustScore: 85,
                impactScore: 92,
                details: {
                    accountAuthenticity: 88,
                    contributionAuthenticity: 85,
                    prImpact: 94,
                    collaboration: 90,

                },
                evidence: [
                    {
                        type: "repository",
                        data: {
                            repository: "kubernetes/ingress-nginx",
                            description: "Maintainer for security patches and load balancer integration logic.",
                            impact: 94
                        }
                    }
                ]
            }
        ];

        for (const eng of demoEngineers) {
            // Check if user already exists by email
            const existing = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", `demo_${eng.username}`))
                .first();

            let userId;
            if (!existing) {
                userId = await ctx.db.insert("users", {
                    name: eng.name,
                    username: eng.username,
                    email: eng.email,
                    avatarUrl: eng.avatarUrl,
                    role: "engineer",
                    tokenIdentifier: `demo_${eng.username}`,
                });
            } else {
                userId = existing._id;
            }

            // Update or insert score
            const existingScore = await ctx.db
                .query("scores")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .first();

            if (existingScore) {
                await ctx.db.patch(existingScore._id, {
                    trustScore: eng.trustScore,
                    impactScore: eng.impactScore,
                    details: eng.details,
                    evidence: eng.evidence,
                    lastUpdated: Date.now(),
                });
            } else {
                await ctx.db.insert("scores", {
                    userId,
                    trustScore: eng.trustScore,
                    impactScore: eng.impactScore,
                    details: eng.details,
                    evidence: eng.evidence,
                    lastUpdated: Date.now(),
                });
            }
        }

        return { success: true, count: demoEngineers.length };
    },
});
