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
        linkedinUrl: v.optional(v.string()),
        phone: v.optional(v.string()),
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
            suggestedRole: v.optional(v.string()),
            techStack: v.optional(v.array(v.string())),
        }),
        evidence: v.array(v.any()), // Stores evidence items
    }).index("by_user", ["userId"]),

    // CRM: Job Folders for shortlisting
    jobs: defineTable({
        recruiterId: v.id("users"),
        title: v.string(),
        description: v.optional(v.string()),
        candidateIds: v.array(v.id("users")),
        status: v.union(v.literal("active"), v.literal("archived")),
    }).index("by_recruiter", ["recruiterId"]),

    // CRM: Logging contact history
    contactHistory: defineTable({
        recruiterId: v.id("users"),
        candidateId: v.id("users"),
        platform: v.union(v.literal("email"), v.literal("linkedin"), v.literal("phone")),
        timestamp: v.number(),
        note: v.optional(v.string()),
    }).index("by_recruiter", ["recruiterId"])
        .index("by_candidate", ["candidateId"])
        .index("by_recruiter_candidate", ["recruiterId", "candidateId"]),
});
