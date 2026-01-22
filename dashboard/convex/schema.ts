import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(), // Clerk ID
        role: v.union(v.literal("engineer"), v.literal("recruiter")),
        name: v.string(),
        email: v.string(),
        username: v.optional(v.string()), // GitHub username
        avatarUrl: v.optional(v.string()),
    }).index("by_token", ["tokenIdentifier"])
        .index("by_username", ["username"]),

    scores: defineTable({
        userId: v.id("users"),
        trustScore: v.number(),
        impactScore: v.number(),
        lastUpdated: v.number(),
        // Store detailed breakdown as JSON/Object
        details: v.object({
            accountAuthenticity: v.number(),
            contributionAuthenticity: v.number(),
            prImpact: v.number(),
            collaboration: v.number(),
        }),
        evidence: v.array(v.any()), // Stores evidence items
    }).index("by_user", ["userId"]),
});
