"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { signInWithGoogle as firebaseSignInWithGoogle, signOut as firebaseSignOut } from "@/lib/firebase/auth";
import type { UserDoc, UserRole } from "@/lib/firebase/types";
import { apiJson } from "@/lib/api";
import { DEMO_MODE } from "@/lib/demo";

export type UserProfile = UserDoc;

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  /** True when this deployment offers one-click demo accounts. */
  demoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Demo mode only: signs in as the seeded showcase account for a role. */
  signInAsDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firebase is the source of truth for who is signed in; the API holds the profile.
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const result = await apiJson<UserProfile>("/api/auth/profile", { method: "POST" });
      if (result.success && result.data) {
        setUser(result.data);
        setAuthError(null);
      } else {
        setUser(null);
        setAuthError(result.error ?? "We couldn't load your profile.");
      }
      setLoading(false);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const result = await apiJson<UserProfile>("/api/auth/profile");
    if (result.success && result.data) setUser(result.data);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const { error } = await firebaseSignInWithGoogle();
    if (error) setAuthError(error);
  }, []);

  const signInAsDemo = useCallback(async (role: UserRole) => {
    setAuthError(null);
    const result = await apiJson<{ token: string }>("/api/auth/demo", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    if (!result.success || !result.data) {
      setAuthError(result.error ?? "Demo sign-in failed.");
      return;
    }
    setLoading(true);
    try {
      await signInWithCustomToken(auth, result.data.token);
    } catch {
      setLoading(false);
      setAuthError("Demo sign-in failed.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await firebaseSignOut();
    if (error) setAuthError(error);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, authError, demoMode: DEMO_MODE, signInWithGoogle, signInAsDemo, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
