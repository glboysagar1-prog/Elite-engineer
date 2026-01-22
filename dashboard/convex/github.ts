import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Octokit } from "octokit";

export const syncUser = action({
    args: { userId: v.id("users"), username: v.string() },
    handler: async (ctx, args) => {
        // 1. Initialize Octokit (GitHub API)
        // Ideally use process.env.GITHUB_TOKEN from Convex Dashboard
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        try {
            // 2. Fetch Data
            const { data: user } = await octokit.rest.users.getByUsername({ username: args.username });
            const { data: repos } = await octokit.rest.repos.listForUser({ username: args.username, sort: "updated", per_page: 10 });

            // 3. Calculate Scores (Mock Logic for MVP)
            // Trust: Account age + followers
            // Impact: Repo stars + forks
            const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const trustScore = Math.min(100, Math.floor((accountAgeDays / 365) * 10) + (user.followers > 50 ? 20 : 0) + 50);

            const totalStars = repos.reduce((acc: any, r: any) => acc + r.stargazers_count, 0);
            const impactScore = Math.min(100, Math.floor(totalStars * 2) + (user.public_repos > 5 ? 20 : 0));

            // 4. Save to DB via Internal Mutation
            await ctx.runMutation(internal.users.updateScore, {
                userId: args.userId,
                trustScore,
                impactScore,
                details: {
                    accountAuthenticity: Math.min(100, trustScore + 5),
                    contributionAuthenticity: 95,
                    prImpact: impactScore,
                    collaboration: Math.min(100, user.followers > 10 ? 80 : 40),
                },
                evidence: repos.slice(0, 3).map((r: any) => ({
                    type: "repository",
                    data: {
                        repository: r.full_name,
                        description: r.description || "No description",
                        impact: Math.min(100, r.stargazers_count * 5)
                    }
                }))
            });

            return { success: true };

        } catch (error) {
            console.error("GitHub Sync Failed:", error);
            throw new Error("Failed to sync with GitHub");
        }
    },
});
