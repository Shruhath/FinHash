import { useCallback, useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { signInWithGoogleIdToken } from "@/lib/firebase";

// Lets the auth popup hand control back to the app on completion.
WebBrowser.maybeCompleteAuthSession();

/**
 * Google sign-in via the system browser. Firebase's popup/redirect helpers
 * assume a DOM, so the ID token is obtained through AuthSession and exchanged
 * for a Firebase credential instead.
 */
export function useGoogleSignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setPending(false);
        setError("Google did not return an ID token");
        return;
      }
      signInWithGoogleIdToken(idToken)
        .catch(() => setError("Couldn't complete sign-in — please try again"))
        .finally(() => setPending(false));
      return;
    }

    // Dismissed or cancelled is a normal outcome, not an error worth showing.
    setPending(false);
    if (response.type === "error") {
      setError(response.error?.message ?? "Sign-in failed");
    }
  }, [response]);

  const signIn = useCallback(async () => {
    setError(null);
    setPending(true);
    const result = await promptAsync();
    if (result?.type !== "success") setPending(false);
  }, [promptAsync]);

  return { signIn, pending, error, ready: !!request };
}
