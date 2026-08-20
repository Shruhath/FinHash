import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is not set — copy .env.example to .env and fill it in"
  );
}

export const convex = new ConvexReactClient(convexUrl, {
  // React Native has no tab visibility to react to; keeping the socket warm
  // avoids a reconnect every time the app returns from the background.
  unsavedChangesWarning: false,
});

/** Bridges Firebase auth state into Convex's auth contract. */
function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next);
    setLoading(false);
  }), []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const current = auth.currentUser;
      if (!current) return null;
      try {
        return await current.getIdToken(forceRefreshToken);
      } catch {
        return null;
      }
    },
    []
  );

  return useMemo(
    () => ({ isLoading: loading, isAuthenticated: !!user, fetchAccessToken }),
    [loading, user, fetchAccessToken]
  );
}

export function AppConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
