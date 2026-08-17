"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  authError: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabase = createClient();

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
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Failsafe timeout to prevent infinite spinner
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email && isMounted) {
          await syncUserProfile(
            session.user.email,
            session.user.user_metadata?.full_name || session.user.email.split("@")[0],
            session.user.user_metadata?.avatar_url
          );
        }
      } catch (e: any) {
        console.warn("Auth session check warning:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email && isMounted) {
        await syncUserProfile(
          session.user.email,
          session.user.user_metadata?.full_name || session.user.email.split("@")[0],
          session.user.user_metadata?.avatar_url
        );
      } else if (isMounted) {
        setUser(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        console.error("Google OAuth error:", error);
        setAuthError(error.message);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setAuthError(err?.message || "Failed to initiate Google sign in");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
