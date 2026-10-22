"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui";
import type { UserRole } from "@/lib/roleGuard";

type DemoRole = Exclude<UserRole, "guest">;

const ROLE_NAMES: Record<DemoRole, string> = {
  buyer: "buyer",
  artisan: "artisan",
  lgu: "local government officer",
  admin: "admin",
};

/**
 * One-tap showcase sign-in, shown next to Google wherever a guest is asked to
 * sign in. Renders nothing outside demo deployments.
 */
export function DemoSignIn({ roles = ["buyer"], className }: { roles?: DemoRole[]; className?: string }) {
  const { demoMode, signInAsDemo, authError } = useAuth();
  const { translateSync } = useTranslation();
  const [switching, setSwitching] = useState<DemoRole | null>(null);

  if (!demoMode) return null;

  return (
    <div className={className ?? "space-y-2"}>
      {roles.map((role) => (
        <Button
          key={role}
          type="button"
          size="lg"
          variant="secondary"
          className="w-full"
          loading={switching === role}
          disabled={switching !== null}
          onClick={async () => {
            setSwitching(role);
            await signInAsDemo(role);
            setSwitching(null);
          }}
        >
          {translateSync("Demo: sign in as")} {translateSync(ROLE_NAMES[role])}
        </Button>
      ))}
      {authError && (
        <p role="alert" className="text-sm text-danger">
          {translateSync(authError)}
        </p>
      )}
    </div>
  );
}
