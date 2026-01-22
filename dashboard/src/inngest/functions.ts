import { inngest } from "./client";
import { Octokit } from "octokit";
import { calculateTrustScore } from "../../convex/scores/trust";
import { calculateImpactScore } from "../../convex/scores/impact";
import { GitHubAccount, ContributionPattern, GitHubActivity } from "../../convex/types/github";

// Using a placeholder for Octokit until we have a proper way to get the token in Inngest
// In practice, this would come from an environment variable
const getOctokit = () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN missing");
    return new Octokit({ auth: token });
};

/**
 * Job 1: Engineer Analysis (Triggered by Event)
 */
export const engineerAnalysis = inngest.createFunction(
    { id: "engineer-analysis", name: "Engineer Analysis" },
    { event: "engineer/analyze" },
    async ({ event, step }) => {
        const { username, userId } = event.data;

        // 1. Fetch Data via Inngest steps to ensure retries/reliability
        const account = await step.run("fetch-github-account", async () => {
            const octokit = getOctokit();
            const { data: ghUser } = await octokit.rest.users.getByUsername({ username });

            return {
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
            } as GitHubAccount;
        });

        const repos = await step.run("fetch-repositories", async () => {
            const octokit = getOctokit();
            const { data } = await octokit.rest.repos.listForUser({
                username,
                sort: "updated",
                per_page: 50
            });
            return data;
        });

        const prs = await step.run("fetch-merged-prs", async () => {
            const octokit = getOctokit();
            const { data } = await octokit.rest.search.issuesAndPullRequests({
                q: `author:${username} is:pr is:merged`,
                sort: "updated",
                order: "desc",
                per_page: 30
            });
            return data.items;
        });

        // 2. Compute Scores
        const scores = await step.run("compute-scores", async () => {
            const mergedPRs = prs.map((item: any) => ({
                id: item.id.toString(),
                repository: item.repository_url.split("/").slice(-2).join("/"),
                mergedAt: new Date(item.closed_at),
                mergedBy: "maintainer",
                author: username,
                reviewCommentsReceived: item.comments || 0,
                reviewRounds: 1,
                filesChanged: 10,
                directoriesTouched: 2,
                isMaintainerMerge: true,
                isFork: false,
                timeToMerge: 24
            }));

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
                averagePRsPerDay: mergedPRs.length / 30,
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
                repositories: repos.map((r: any) => ({
                    repository: r.full_name,
                    mergedPRCount: 0,
                    isFork: r.fork,
                    contributorCount: 5,
                    maintainerCount: 2
                })),
                activitySpan: {
                    firstPRDate,
                    lastPRDate
                }
            };

            const trust = calculateTrustScore(account, pattern);
            const impact = calculateImpactScore(activity);

            return { trust, impact, mergedPRs };
        });

        // 3. Final step: The user would typically push these results to Convex via a webhook or internal mutation
        // For now, we'll log it as a successful completion of the background job
        return {
            success: true,
            username,
            userId,
            trustScore: scores.trust.totalScore,
            impactScore: scores.impact.totalScore,
        };
    }
);
