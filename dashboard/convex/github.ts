import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Octokit } from "octokit";

export const syncUser = action({
    args: { userId: v.id("users"), username: v.string() },
    handler: async (ctx, args) => {
        console.log(`Starting sync for user: ${args.username} (${args.userId})`);

        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            console.error("GITHUB_TOKEN is not set in Convex environment variables!");
            throw new Error("GitHub integration not configured. Please set GITHUB_TOKEN in Convex.");
        }

        const octokit = new Octokit({ auth: token });

        try {
            console.log("Fetching GitHub user data...");
            const { data: user } = await octokit.rest.users.getByUsername({ username: args.username });
            console.log(`Found user: ${user.login}, followers: ${user.followers}`);

            console.log("Fetching recent repositories...");
            const { data: repos } = await octokit.rest.repos.listForUser({
                username: args.username,
                sort: "updated",
                per_page: 30 // Increased for better accuracy
            });
            console.log(`Found ${repos.length} repositories`);

            // 3. Calculate Scores
            const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const trustScore = Math.min(100, Math.floor((accountAgeDays / 365) * 10) + (user.followers > 50 ? 20 : 0) + 50);

            const totalStars = repos.reduce((acc: any, r: any) => acc + (r.stargazers_count || 0), 0);
            const impactScore = Math.min(100, Math.floor(totalStars * 5) + (user.public_repos > 5 ? 20 : 0));

            console.log(`Calculated Scores - Trust: ${trustScore}, Impact: ${impactScore}`);

            // 4. Save to DB via Internal Mutation
            console.log("Saving scores to database...");
            await ctx.runMutation(internal.users.updateScore, {
                userId: args.userId,
                trustScore,
                impactScore,
                details: {
                    accountAuthenticity: Math.min(100, trustScore + 5),
                    contributionAuthenticity: 95,
                    prImpact: impactScore,
                    collaboration: Math.min(100, (user.followers || 0) > 10 ? 80 : 40),
                },
                evidence: repos.slice(0, 5).map((r: any) => ({
                    type: "repository",
                    data: {
                        repository: r.full_name,
                        description: r.description || "No description",
                        impact: Math.min(100, (r.stargazers_count || 0) * 10 + 20)
                    }
                }))
            });

            console.log("GitHub Sync Completed Successfully");
            return { success: true };

        } catch (error: any) {
            console.error("GitHub Sync Failed:", error.message || error);
            throw new Error(`GitHub Sync Failed: ${error.message || "Unknown error"}`);
        }
    },
});
