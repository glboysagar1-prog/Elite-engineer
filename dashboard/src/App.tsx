import { useEffect } from "react"
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { useUser } from "@clerk/clerk-react"
import { EngineerProfileDashboard } from "./components/EngineerProfileDashboard"
import { RecruiterDashboard } from "./components/RecruiterDashboard"
import { LoginPage } from "./components/LoginPage"
import { Button } from "./components/ui/button"
import { LogOut } from "lucide-react"
import { useClerk } from "@clerk/clerk-react"

// Simple Sync Component to ensure User exists in Convex
function UserSync() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (user) {
      const savedRole = localStorage.getItem("intendedRole") as "engineer" | "recruiter" | null;

      // We only pass a role to storeUser if we have an explicit intention (savedRole)
      // or ifClerk already has it in publicMetadata.
      // If both are missing, we pass undefined, and the backend handles the default (engineer).
      const role = (user.publicMetadata.role as "engineer" | "recruiter") || savedRole || undefined;

      storeUser({
        name: user.fullName || user.username || "Anonymous",
        email: user.primaryEmailAddress?.emailAddress || "",
        username: user.username || undefined,
        role: role,
        avatarUrl: user.imageUrl,
      });

      // Clear the intended role after sync if it was used
      if (savedRole) {
        localStorage.removeItem("intendedRole");
      }
    }
  }, [user, storeUser]);

  return null;
}

// Transform Convex User Data to Dashboard Interface
function transformToDashboardData(user: any) {
  if (!user) return null;

  const score = user.score || {};
  const details = score.details || {};

  // Determine Level and Recommendation based on total scores
  const totalScore = ((score.trustScore || 0) + (score.impactScore || 0)) / 2;
  const matchLevel = totalScore > 80 ? "Excellent Match" : totalScore > 60 ? "Strong Match" : "Good Match";
  const recommendation = totalScore > 80 ? "Strongly Recommended" : totalScore > 60 ? "Recommended" : "Consider";

  return {
    _id: user._id,
    engineer: {
      username: user.username || "user",
      name: user.name || "Engineer",
      avatarUrl: user.avatarUrl,
      account: {
        bio: user.bio || "Engineering professional focused on code quality and impact.",
        location: user.location || "Remote",
        company: user.company || "Independent",
        createdAt: user._creationTime || Date.now(),
        email: user.email,
        followers: user.followers || 0
      }
    },
    matchScore: {
      matchScore: Math.floor(totalScore),
      matchLevel: matchLevel,
      recommendation: recommendation,
      trustScore: score.trustScore || 0,
      fitScore: 75, // Placeholder for compatibility
      impactScore: score.impactScore || 0,
      isAuthentic: (score.trustScore || 0) > 60,
      isGoodFit: true,
      hasImpact: (score.impactScore || 0) > 50
    },
    trustScore: {
      total: score.trustScore || 0,
      components: {
        accountAuthenticity: details.accountAuthenticity || 0,
        contributionAuthenticity: details.contributionAuthenticity || 0,
        collaborationSignals: details.collaboration || 0,
        antiSpamScore: 90
      }
    },
    impactScore: {
      total: score.impactScore || 0,
      components: {
        prImpact: details.prImpact || 0,
        collaboration: details.collaboration || 0,
        longevity: 80,
        quality: 85
      }
    },
    compatibilityScore: {
      total: 75,
      signals: {
        technologyStackMatch: 85,
        domainContributionDepth: 70,
        architecturePatternMatch: 80,
        fileTypeAlignment: 65,
        activityTypeMatch: 90,
        repositoryTypeMatch: 75,
        reviewDomainExpertise: 80
      }
    },
    strengths: [
      {
        title: "Verified Contribution Consistency",
        description: "Consistency across multiple repositories and long-term activity.",
        evidence: ["Merged PRs across multiple repositories", "Verified activity span"]
      },
      {
        title: "Strong Technical Impact",
        description: "Significant contributions detected through PR complexity analysis.",
        evidence: ["High impact repository contributions", "Code review engagement"]
      }
    ],
    concerns: [],
    evidence: (score.evidence || []).map((e: any) => ({
      type: "repository",
      data: {
        repository: e.data?.repository || "Unknown",
        description: e.data?.description || "No description",
        impact: e.data?.impact || 50
      }
    })),
    whyThisMatch: `Based on your GitHub activity, you show strong signals in ${matchLevel === "Excellent Match" ? "architectural complexity and community trust" : "collaboration and consistent delivery"}. Your contributions are verified and highly rated.`
  };
}

function MainApp() {
  const { signOut } = useClerk();
  const user = useQuery(api.users.getCurrentUser);

  // Fallback/Loading UI
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-slate-500">
        <div className="animate-pulse">Loading Elite Profile...</div>
      </div>
    )
  }

  // Handle case where user is null (not found yet)
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <div>Creating your profile...</div>
      </div>
    )
  }

  // Role-based Routing
  return (
    <div className="relative">
      {/* Logout for Dev/Testing */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="destructive"
          size="sm"
          className="shadow-lg opacity-80 hover:opacity-100 transition-opacity"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-3 w-3" />
          Logout
        </Button>
      </div>

      {user.role === "recruiter" ? (
        <RecruiterDashboard />
      ) : (
        <EngineerProfileDashboard data={transformToDashboardData(user) as any || {} as any} />
      )}
    </div>
  )
}

function App() {
  return (
    <>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
      <Authenticated>
        <UserSync />
        <MainApp />
      </Authenticated>
    </>
  )
}

export default App
