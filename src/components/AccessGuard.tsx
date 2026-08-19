"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { userRole, UserRole } from "@/lib/roleGuard";
import { useTranslation } from "@/contexts/TranslationContext";

interface AccessGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  pageTitle?: string;
  requiredRoleLabel?: string;
  description?: string;
}

export function AccessGuard({
  children,
  allowedRoles,
  pageTitle = "Restricted Page",
  requiredRoleLabel,
  description,
}: AccessGuardProps) {
  const { user, loading, signInWithGoogle } = useAuth();
  const { translateSync } = useTranslation();
  const currentRole = userRole(user);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#2E6B4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAllowed = allowedRoles.includes(currentRole);

  if (!isAllowed) {
    const roleTitle =
      requiredRoleLabel ||
      (allowedRoles.includes("artisan") && allowedRoles.length === 1
        ? "Artisan Access Only"
        : allowedRoles.includes("lgu") && allowedRoles.length === 1
        ? "LGU Officer Access Only"
        : allowedRoles.includes("admin") && allowedRoles.length === 1
        ? "Administrator Access Only"
        : "Restricted Access");

    const defaultDesc =
      description ||
      (currentRole === "guest"
        ? "You need to be signed in with an authorized account to access this page."
        : `Your current role (${currentRole.toUpperCase()}) does not have permission to view ${pageTitle}.`);

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F8F6F0]">
        <div className="max-w-md w-full bg-white border border-[#E6E2D8] rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Decorative Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-[#1A6B3A] to-blue-600" />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            {currentRole === "guest" ? (
              <Lock className="w-8 h-8 text-amber-600" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-amber-800 uppercase bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300 inline-block">
              {translateSync("RBAC SECURITY PROTECTION")}
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {translateSync(roleTitle)}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {translateSync(defaultDesc)}
            </p>
          </div>

          {/* Action buttons depending on signed in vs signed out */}
          <div className="pt-2 space-y-3">
            {currentRole === "guest" ? (
              <button
                onClick={signInWithGoogle}
                className="w-full py-3.5 rounded-xl bg-[#2E6B4A] hover:bg-[#1E4D34] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{translateSync("Sign In with Google")}</span>
              </button>
            ) : (
              <div className="p-3 bg-[#F8F6F0] rounded-xl border border-gray-200 text-[11px] text-gray-500 font-mono-data">
                {translateSync("Signed in as")}: <strong>{user?.email}</strong> ({currentRole.toUpperCase()})
              </div>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{translateSync("Return to Marketplace")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AccessGuard;
