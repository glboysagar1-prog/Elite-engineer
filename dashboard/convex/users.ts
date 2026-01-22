import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ... existing code ...

// Internal Mutation to update scores (called by Action)
export const updateScore = internalMutation({
    args: {
        userId: v.id("users"),
        trustScore: v.number(),
        impactScore: v.number(),
        details: v.object({
            accountAuthenticity: v.number(),
            contributionAuthenticity: v.number(),
            prImpact: v.number(),
            collaboration: v.number(),
            suggestedRole: v.optional(v.string()),
            techStack: v.optional(v.array(v.string())),
        }),
        evidence: v.array(v.any()), // flexible for now
    },
    handler: async (ctx, args) => {
        // Check if score exists
        const existing = await ctx.db
            .query("scores")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                trustScore: args.trustScore,
                impactScore: args.impactScore,
                lastUpdated: Date.now(),
                details: args.details,
                evidence: args.evidence
            });
        } else {
            await ctx.db.insert("scores", {
                userId: args.userId,
                trustScore: args.trustScore,
                impactScore: args.impactScore,
                lastUpdated: Date.now(),
                details: args.details,
                evidence: args.evidence
            });
        }
    },
});


// Store user after login (Upsert)
export const storeUser = mutation({
    args: {
        role: v.optional(v.union(v.literal("engineer"), v.literal("recruiter"))),
        name: v.string(),
        email: v.string(),
        username: v.optional(v.string()),
        avatarUrl: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        if (user) {
            // Update existing if needed
            const patch: any = { name: args.name, email: args.email };
            if (args.avatarUrl) patch.avatarUrl = args.avatarUrl;
            if (args.username) patch.username = args.username;

            // Only update role if explicitly provided and different
            if (args.role && user.role !== args.role) {
                patch.role = args.role;
            }

            await ctx.db.patch(user._id, patch);
            return user._id;
        }

        // Create new
        return await ctx.db.insert("users", {
            tokenIdentifier: identity.subject,
            role: args.role || "engineer",
            name: args.name,
            email: args.email,
            username: args.username,
            avatarUrl: args.avatarUrl || ""
        });
    },
});

// Get current user profile
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        if (!user) return null;

        // Join with scores if engineer
        if (user.role === "engineer") {
            const score = await ctx.db
                .query("scores")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .first();
            return { ...user, score };
        }

        return user;
    },
});
// List all engineers for recruiter discovery
export const listEngineers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const recruiter = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        // Only recruiters can list all engineers
        if (!recruiter || recruiter.role !== "recruiter") {
            return [];
        }

        const engineers = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "engineer"))
            .collect();

        const engineersWithScores = await Promise.all(
            engineers.map(async (user) => {
                const score = await ctx.db
                    .query("scores")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .first();
                return { ...user, score };
            })
        );

        return engineersWithScores;
    },
});

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
                linkedinUrl: "https://linkedin.com/in/alex-rivera-dev",
                phone: "+1 (555) 123-4567",
                avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
                trustScore: 94,
                impactScore: 88,
                details: {
                    accountAuthenticity: 98,
                    contributionAuthenticity: 95,
                    prImpact: 92,
                    collaboration: 85,
                    suggestedRole: "Backend",
                    techStack: ["Node.js", "Go", "PostgreSQL", "Docker"]
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
                linkedinUrl: "https://linkedin.com/in/sarah-chen-ui",
                phone: "+1 (555) 987-6543",
                avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
                trustScore: 91,
                impactScore: 95,
                details: {
                    accountAuthenticity: 92,
                    contributionAuthenticity: 90,
                    prImpact: 98,
                    collaboration: 94,
                    suggestedRole: "Frontend",
                    techStack: ["React", "Typescript", "Next.js", "Tailwind"]
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
                linkedinUrl: "https://linkedin.com/in/marcus-thorne-infra",
                phone: "+1 (555) 456-7890",
                avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
                trustScore: 85,
                impactScore: 92,
                details: {
                    accountAuthenticity: 88,
                    contributionAuthenticity: 85,
                    prImpact: 94,
                    collaboration: 90,
                    suggestedRole: "DevOps",
                    techStack: ["AWS", "Kubernetes", "Docker", "Python"]
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
            const tokenIdentifier = `demo_${eng.username}`;
            const existing = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
                .first();

            let userId;
            if (!existing) {
                userId = await ctx.db.insert("users", {
                    name: eng.name,
                    username: eng.username,
                    email: eng.email,
                    avatarUrl: eng.avatarUrl,
                    linkedinUrl: eng.linkedinUrl,
                    phone: eng.phone,
                    role: "engineer",
                    tokenIdentifier,
                });
            } else {
                userId = existing._id;
                await ctx.db.patch(userId, {
                    linkedinUrl: eng.linkedinUrl,
                    phone: eng.phone,
                });
            }

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
