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

  return {
    _id: user._id,
    engineer: {
      username: user.username || "user",
      name: user.name || "Engineer",
      avatarUrl: user.avatarUrl,
      account: {
        bio: "Full Stack Developer", // Placeholder until added to DB
        location: "Remote",
        company: "Open Source",
        createdAt: user._creationTime || Date.now(),
        email: user.email,
        followers: 0 // Placeholder
      }
    },
    matchScore: {
      matchScore: Math.round((score.trustScore + score.impactScore) / 2) || 0,
      matchLevel: "Good",
      recommendation: "Review",
      trustScore: score.trustScore || 0,
      fitScore: 85, // Mock
      impactScore: score.impactScore || 0,
      isAuthentic: (score.trustScore > 80),
      isGoodFit: true,
      hasImpact: (score.impactScore > 70)
    },
    trustScore: {
      total: score.trustScore || 0,
      components: {
        accountAuthenticity: details.accountAuthenticity || 0,
        contributionAuthenticity: details.contributionAuthenticity || 0,
        collaborationSignals: 80, // Mock
        antiGamingScore: 90 // Mock
      }
    },
    impactScore: {
      total: score.impactScore || 0,
      components: {
        prImpact: details.prImpact || 0,
        collaboration: details.collaboration || 0,
        longevity: 90, // Mock
        quality: 85 // Mock
      }
    },
    compatibilityScore: { // All Mock for now
      total: 80,
      signals: {
        technologyStackMatch: 85,
        domainContributionDepth: 80,
        architecturePatternMatch: 75,
        fileTypeAlignment: 90,
        activityTypeMatch: 85,
        repositoryTypeMatch: 80,
        reviewDomainExpertise: 70
      }
    },
    strengths: [],
    concerns: [],
    evidence: score.evidence || []
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
