import { getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  type Auth,
  type Persistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Metro resolves `firebase/auth` through the package's react-native condition,
 * which exposes `getReactNativePersistence`. It is absent from the published
 * browser typings, so it is read off the namespace rather than imported.
 */
const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence?: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

/**
 * Without AsyncStorage-backed persistence the user is signed out on every
 * cold start, so treat a missing helper as a hard configuration error rather
 * than silently degrading.
 */
export const auth: Auth = (() => {
  try {
    if (!getReactNativePersistence) {
      throw new Error(
        "firebase/auth resolved to its browser build — check the Metro resolver conditions"
      );
    }
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // initializeAuth throws once auth already exists (Fast Refresh re-runs
    // this module), in which case the existing instance is the right one.
    try {
      return FirebaseAuth.getAuth(app);
    } catch {
      throw error;
    }
  }
})();

/** Exchanges the Google ID token from the native flow for a Firebase session. */
export function signInWithGoogleIdToken(idToken: string) {
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

export function logOut() {
  return signOut(auth);
}
