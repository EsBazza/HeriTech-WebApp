"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { signInWithGoogle as firebaseSignInWithGoogle, signOut as firebaseSignOut, subscribeToAuthState } from "@/lib/firebase/auth";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "buyer" | "artisan" | "lgu" | "admin";
  avatarUrl?: string | null;
  country?: string | null;
  workshopName?: string | null;
  artisanVerified?: boolean;
  stationName?: string | null;
  verificationStatus: "none" | "pending_artisan" | "pending_lgu" | "approved" | "rejected";
  applicationNotes?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsAdmin: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (newRole: "buyer" | "artisan" | "lgu" | "admin") => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  signInAsAdmin: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  switchRole: async () => {},
  authError: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncUserProfile = async (email: string, fullName?: string, avatarUrl?: string) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, avatarUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        if (typeof document !== "undefined") {
          document.cookie = `user_role=${data.data.role || "buyer"}; path=/; max-age=604800; SameSite=Lax`;
        }
      }
    } catch (err) {
      console.error("Failed to sync profile with DB:", err);
    }
  };

  const refreshProfile = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        if (typeof document !== "undefined") {
          document.cookie = `user_role=${data.data.role || "buyer"}; path=/; max-age=604800; SameSite=Lax`;
        }
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const switchRole = async (newRole: "buyer" | "artisan" | "lgu" | "admin") => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, role: newRole };
        setUser(updatedUser);
        if (typeof document !== "undefined") {
          document.cookie = `user_role=${newRole}; path=/; max-age=604800; SameSite=Lax`;
        }
      }
    } catch (err) {
      console.error("Failed to switch user role:", err);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = subscribeToAuthState(async (firebaseUser) => {
        if (firebaseUser?.email) {
          await syncUserProfile(
            firebaseUser.email,
            firebaseUser.displayName || firebaseUser.email.split("@")[0],
            firebaseUser.photoURL || undefined
          );
        } else {
          setUser(null);
          if (typeof document !== "undefined") {
            document.cookie = "user_role=guest; path=/; max-age=604800; SameSite=Lax";
          }
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn("Firebase auth listener error, using fallback:", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const { user: fbUser, error } = await firebaseSignInWithGoogle();
      if (error) {
        console.warn("Firebase sign in error or missing API key, executing dev login:", error);
        await syncUserProfile("sarah.j@singapore.sg", "Sarah Jenkins", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80");
        return;
      }
      if (fbUser?.email) {
        await syncUserProfile(
          fbUser.email,
          fbUser.displayName || fbUser.email.split("@")[0],
          fbUser.photoURL || undefined
        );
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setAuthError(err?.message || "Failed to initiate Google sign in");
      await syncUserProfile("sarah.j@singapore.sg", "Sarah Jenkins", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80");
    }
  };

  const signInAsAdmin = async () => {
    setAuthError(null);
    await syncUserProfile("admin@heritech.io", "System Administrator", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      setUser(null);
      if (typeof document !== "undefined") {
        document.cookie = "user_role=guest; path=/; max-age=0; SameSite=Lax";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInAsAdmin,
        signOut,
        refreshProfile,
        switchRole,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
