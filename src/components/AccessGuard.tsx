"use client";

import React, { ReactNode, useState } from "react";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { userRole, UserRole } from "@/lib/roleGuard";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button, Card, LinkButton, Spinner } from "@/components/ui";

interface AccessGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  pageTitle?: string;
  requiredRoleLabel?: string;
  description?: string;
}

const ROLE_NAMES: Record<UserRole, string> = {
  artisan: "artisan",
  lgu: "LGU officer",
  admin: "admin",
  buyer: "buyer",
  guest: "guest",
};

export function AccessGuard({ children, allowedRoles, pageTitle = "this page", requiredRoleLabel, description }: AccessGuardProps) {
  const { user, loading, authError, demoMode, signInWithGoogle, signInAsDemo } = useAuth();
  const { translateSync } = useTranslation();
  const [switching, setSwitching] = useState(false);
  const currentRole = userRole(user);

  if (loading) {
    return <Spinner className="min-h-[60vh]" />;
  }

  if (allowedRoles.includes(currentRole)) {
    return <>{children}</>;
  }

  const isGuest = currentRole === "guest";
  const needed = allowedRoles.map((r) => translateSync(ROLE_NAMES[r])).join(" / ");
  // Demo deployments offer the showcase account of the first non-admin role that can open this page.
  const demoRole = (allowedRoles.find((r) => r !== "admin" && r !== "guest") ?? "admin") as Exclude<UserRole, "guest">;

  const title = requiredRoleLabel || (isGuest ? translateSync("Sign in to continue") : `${translateSync(pageTitle)} ${translateSync("is for")} ${needed} ${translateSync("accounts")}`);
  const body =
    description ||
    (isGuest
      ? `${translateSync(pageTitle)} ${translateSync("is available to")} ${needed} ${translateSync("accounts. Sign in to continue.")}`
      : `${translateSync("You're signed in as")} ${translateSync(ROLE_NAMES[currentRole])} (${user?.email}).`);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <span className="w-12 h-12 rounded-full bg-paper-2 text-ink-2 flex items-center justify-center mx-auto">
          {isGuest ? <Lock className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </span>
        <div className="space-y-2">
          <h1 className="font-display text-[28px] leading-tight font-semibold text-ink">{title}</h1>
          <p className="text-sm text-ink-2">{body}</p>
        </div>

        <div className="space-y-3">
          {isGuest && (
            <Button size="lg" className="w-full" onClick={signInWithGoogle}>
              {translateSync("Sign in with Google")}
            </Button>
          )}
          {demoMode && (
            <Button
              size="lg"
              variant={isGuest ? "secondary" : "primary"}
              className="w-full"
              loading={switching}
              onClick={async () => {
                setSwitching(true);
                await signInAsDemo(demoRole);
                setSwitching(false);
              }}
            >
              {translateSync("Demo: sign in as")} {translateSync(ROLE_NAMES[demoRole])}
            </Button>
          )}
          {authError && <p className="text-sm text-danger">{translateSync(authError)}</p>}
          <LinkButton href="/" variant="secondary" size="lg" className="w-full">
            <ArrowLeft className="w-4 h-4" />
            {translateSync("Back to shop")}
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}

export default AccessGuard;
