import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * CRM: Create a new Job Folder
 */
export const createJob = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        if (!user || user.role !== "recruiter") {
            throw new Error("Only recruiters can create jobs");
        }

        return await ctx.db.insert("jobs", {
            recruiterId: user._id,
            title: args.title,
            description: args.description,
            candidateIds: [],
            status: "active"
        });
    }
});

/**
 * CRM: Add a candidate to a Job Folder
 */
export const addCandidateToJob = mutation({
    args: {
        jobId: v.id("jobs"),
        candidateId: v.id("users")
    },
    handler: async (ctx, args) => {
        const job = await ctx.db.get(args.jobId);
        if (!job) throw new Error("Job not found");

        // Check if candidate already in job
        if (job.candidateIds.includes(args.candidateId)) {
            return job._id;
        }

        const newCandidateIds = [...job.candidateIds, args.candidateId];
        await ctx.db.patch(args.jobId, { candidateIds: newCandidateIds });
        return job._id;
    }
});

/**
 * CRM: List all jobs for a recruiter
 */
export const listJobs = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        if (!user || user.role !== "recruiter") return [];

        return await ctx.db
            .query("jobs")
            .withIndex("by_recruiter", (q) => q.eq("recruiterId", user._id))
            .collect();
    }
});

/**
 * CRM: Log contact activity
 */
export const logContact = mutation({
    args: {
        candidateId: v.id("users"),
        platform: v.union(v.literal("email"), v.literal("linkedin"), v.literal("phone")),
        note: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        if (!user || user.role !== "recruiter") {
            throw new Error("Only recruiters can log contact history");
        }

        return await ctx.db.insert("contactHistory", {
            recruiterId: user._id,
            candidateId: args.candidateId,
            platform: args.platform,
            timestamp: Date.now(),
            note: args.note
        });
    }
});

/**
 * CRM: Get contact history for a specific candidate
 */
export const getContactHistory = query({
    args: { candidateId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("contactHistory")
            .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
            .order("desc")
            .collect();
    }
});
