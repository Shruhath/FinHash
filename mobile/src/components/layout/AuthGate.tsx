import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Single source of truth for where the user is allowed to be. Runs alongside
 * the navigator (rather than gating it) so route state stays intact while
 * auth resolves.
 */
export default function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const storeUser = useMutation(api.users.storeUser);
  const seedCategories = useMutation(api.categories.seedDefaultCategories);
  const user = useQuery(api.users.currentUser);

  // Create the Convex user row the first time this identity is seen.
  useEffect(() => {
    if (isAuthenticated) storeUser().catch(() => {});
  }, [isAuthenticated, storeUser]);

  useEffect(() => {
    if (user?._id) seedCategories({ userId: user._id }).catch(() => {});
  }, [user?._id, seedCategories]);

  useEffect(() => {
    if (isLoading) return;

    const group = segments[0];
    const inAuthFlow = group === "login";
    const inOnboarding = group === "onboarding";

    if (!isAuthenticated) {
      if (!inAuthFlow) router.replace("/login");
      return;
    }

    // Signed in but the profile record hasn't arrived yet.
    if (user === undefined) return;

    if (user === null || !user.country) {
      if (!inOnboarding) router.replace("/onboarding");
      return;
    }

    if (inAuthFlow || inOnboarding || group === undefined) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, user, segments, router]);

  return null;
}
