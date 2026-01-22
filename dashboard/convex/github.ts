import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Octokit } from "octokit";
import { calculateTrustScore } from "./scores/trust";
import { calculateImpactScore } from "./scores/impact";
import { GitHubAccount, ContributionPattern, GitHubActivity } from "./types/github";

export const syncUser = action({
    args: { userId: v.id("users"), username: v.string() },
    handler: async (ctx, args) => {
        console.log(`Starting real-time sync for user: ${args.username} (${args.userId})`);

        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            console.error("GITHUB_TOKEN is not set in Convex environment variables!");
            throw new Error("GitHub integration not configured. Please set GITHUB_TOKEN in Convex.");
        }

        const octokit = new Octokit({ auth: token });

        try {
            // 1. Fetch Basic User Account Info
            console.log("Fetching GitHub account info...");
            const { data: ghUser } = await octokit.rest.users.getByUsername({ username: args.username });

            const account: GitHubAccount = {
                username: ghUser.login,
                createdAt: new Date(ghUser.created_at),
                publicRepos: ghUser.public_repos,
                followers: ghUser.followers,
                following: ghUser.following,
                bio: ghUser.bio || null,
                location: ghUser.location || null,
                company: ghUser.company || null,
                website: ghUser.blog || null,
                email: ghUser.email || null,
                isVerified: !!ghUser.email,
            };

            // 2. Fetch Repositories
            console.log("Fetching repositories...");
            const { data: repos } = await octokit.rest.repos.listForUser({
                username: args.username,
                sort: "updated",
                per_page: 50
            });

            // 3. Fetch Merged PRs (Simplified for MVP)
            console.log("Fetching recent search for merged PRs...");
            const { data: prSearch } = await octokit.rest.search.issuesAndPullRequests({
                q: `author:${args.username} is:pr is:merged`,
                sort: "updated",
                order: "desc",
                per_page: 30
            });

            const mergedPRs = prSearch.items.map((item: any) => ({
                id: item.id.toString(),
                repository: item.repository_url.split("/").slice(-2).join("/"),
                mergedAt: new Date(item.closed_at), // Using closed_at as proxy for mergedAt in search
                mergedBy: "maintainer", // Placeholder
                author: args.username,
                reviewCommentsReceived: item.comments || 0,
                reviewRounds: 1, // Placeholder
                filesChanged: 10, // Placeholder
                directoriesTouched: 2, // Placeholder
                isMaintainerMerge: true,
                isFork: false,
                timeToMerge: 24
            }));

            // 4. Construct Contribution Pattern
            const firstPRDate = mergedPRs.length > 0 ? mergedPRs[mergedPRs.length - 1].mergedAt : account.createdAt;
            const lastPRDate = mergedPRs.length > 0 ? mergedPRs[0].mergedAt : new Date();

            const pattern: ContributionPattern = {
                totalPRs: mergedPRs.length,
                mergedPRs: mergedPRs.length,
                openPRs: 0,
                closedPRs: mergedPRs.length,
                selfMergedPRs: 0,
                forkPRs: 0,
                originalRepoPRs: mergedPRs.length,
                forkOnlyRepos: [],
                originalRepoContributions: mergedPRs.length,
                firstContributionDate: firstPRDate,
                lastContributionDate: lastPRDate,
                contributionDays: Array.from(new Set(mergedPRs.map(p => p.mergedAt.toDateString()))).length,
                contributionMonths: Array.from(new Set(mergedPRs.map(p => `${p.mergedAt.getMonth()}-${p.mergedAt.getFullYear()}`))).length,
                averagePRsPerDay: mergedPRs.length / 30, // Mock window
                maxPRsInSingleDay: 5,
                uniqueRepositories: new Set(mergedPRs.map(p => p.repository)).size,
                repositoriesWithMultiplePRs: 0,
                repositoriesWithMaintainerInteraction: mergedPRs.length,
                reviewsGiven: 0,
                reviewsReceived: 0,
                maintainerReviews: 0,
                issuesOpened: 0,
                issuesClosed: 0,
                issuesWithPRs: 0,
                commitMessagePatterns: new Map(),
                commitTimePatterns: [],
                identicalCommitMessages: 0,
                uniqueCollaborators: 5,
                maintainerInteractions: mergedPRs.length,
                crossRepositoryCollaborations: new Set(mergedPRs.map(p => p.repository)).size
            };

            const activity: GitHubActivity = {
                mergedPRs,
                reviewsGiven: [],
                reviewsReceived: [],
                issues: [],
                repositories: repos.map(r => ({
                    repository: r.full_name,
                    mergedPRCount: 0,
                    isFork: r.fork,
                    contributorCount: 5,
                    maintainerCount: 2
                })),
                activitySpan: {
                    firstPRDate: firstPRDate,
                    lastPRDate: lastPRDate
                }
            };

            // 5. Calculate Real Scores
            console.log("Calculating Trust Score...");
            const trustResult = calculateTrustScore(account, pattern);

            console.log("Calculating Impact Score...");
            const impactResult = calculateImpactScore(activity);

            console.log(`Calculated Scores - Trust: ${trustResult.totalScore}, Impact: ${impactResult.totalScore}`);

            // 6. Save to DB
            await ctx.runMutation(internal.users.updateScore, {
                userId: args.userId,
                trustScore: trustResult.totalScore,
                impactScore: impactResult.totalScore,
                details: {
                    accountAuthenticity: trustResult.components.accountAuthenticity.score,
                    contributionAuthenticity: trustResult.components.contributionAuthenticity.score,
                    prImpact: impactResult.components.prImpact.score,
                    collaboration: impactResult.components.collaboration.score,
                },
                evidence: mergedPRs.slice(0, 5).map(pr => ({
                    type: "repository",
                    data: {
                        repository: pr.repository,
                        description: `Significant contribution merged on ${pr.mergedAt.toLocaleDateString()}`,
                        impact: 85
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
