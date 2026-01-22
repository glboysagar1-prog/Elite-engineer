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
