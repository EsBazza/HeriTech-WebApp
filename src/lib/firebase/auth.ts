import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./client";

const googleProvider = new GoogleAuthProvider();

const FRIENDLY_ERRORS: Record<string, string> = {
  "auth/unauthorized-domain": "This site isn't allowed to use Google sign-in yet. Add its domain in Firebase → Authentication → Settings → Authorized domains.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
  "auth/network-request-failed": "Couldn't reach Google. Check your connection and try again.",
};

/** Opens the Google sign-in popup. Closing the popup is not treated as an error. */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    await signInWithPopup(auth, googleProvider);
    return { error: null };
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") return { error: null };
      return { error: FRIENDLY_ERRORS[error.code] ?? "Google sign-in failed. Please try again." };
    }
    return { error: "Google sign-in failed. Please try again." };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch {
    return { error: "Sign out failed. Please try again." };
  }
}
