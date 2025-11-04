import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

/**
 * ============================================================================
 * PROTECTED ROUTE HOOK
 * ============================================================================
 *
 * This hook manages the application's routing logic based on the user's
 * authentication and onboarding status. It ensures that users are directed
 * to the appropriate screen on app startup and during navigation.
 *
 * Routing Priority:
 * 1.  **Onboarding:** The highest priority is to check if the user has
 *     completed the onboarding flow. If not, they are immediately redirected
 *     to the `/onboarding` screen from anywhere in the app.
 * 2.  **Authentication:** After confirming the user has onboarded, this hook
 *     manages access to protected routes.
 *
 * Scenarios Handled:
 * - A new user opens the app for the first time -> Redirected to `/onboarding`.
 * - A logged-out user who has completed onboarding opens the app -> Redirected to `/login`.
 * - A logged-in user opens the app -> Redirected to the main dashboard (`/`).
 * - A logged-in user tries to access `/login` or `/signup` -> Redirected to `/`.
 * - A logged-out user tries to access a protected screen -> Redirected to `/login`.
 */
export function useProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { hasOnboarded, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth, onboarding, and segments to be loaded before executing any logic.
    // The segments check is crucial to prevent a crash on the initial render when the array might be empty.
    if (authLoading || onboardingLoading || !segments || !segments.length) {
      return;
    }

    const inTabsGroup = segments[0] === "(tabs)";
    const inOnboardingGroup = segments[0] === "onboarding";

    // Priority 1: Check if the user needs to go through onboarding.
    // If they haven't onboarded, redirect them there, unless they are already there.
    if (!hasOnboarded && !inOnboardingGroup) {
      router.replace("/onboarding");
      return; // Return early to prevent other routing logic from firing.
    }

    // After onboarding is confirmed, proceed with authentication-based routing.
    if (hasOnboarded) {
      // Scenario A: The user is not signed in.
      // If they are trying to access a protected part of the app (the '(tabs)' group),
      // they should be redirected to the login screen.
      if (!user && inTabsGroup) {
        router.replace("/login");
      }

      // Scenario B: The user is signed in.
      // If they are on a public screen (like login, signup, or onboarding itself),
      // they should be redirected to the main dashboard.
      else if (user && !inTabsGroup) {
        router.replace("/");
      }
    }
  }, [user, hasOnboarded, authLoading, onboardingLoading, segments, router]);
}
