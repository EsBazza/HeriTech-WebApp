"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { DeleteAccount, DeletionTerms } from "@/components/profile/DeleteAccount";
import { Button, Card, Spinner } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/contact";

/** Public account deletion page, linked from the Google Play listing and the privacy policy. */
export default function DeleteAccountPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { translateSync } = useTranslation();
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-[36px] sm:text-[44px] leading-[1.05] font-semibold text-ink">{translateSync("Delete your HeriTech account")}</h1>
        <p className="text-[15px] text-ink-2">
          {translateSync("Sign in with the Google account you use for HeriTech, then delete it here. In the app it's under Profile → Settings.")}
        </p>
      </header>

      <Card className="p-5 sm:p-6 space-y-5">
        <DeletionTerms />
        {deleted ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success" role="status">
            <CheckCircle2 className="w-5 h-5" />
            {translateSync("Your account has been deleted.")}
          </p>
        ) : loading ? (
          <Spinner label={translateSync("Checking sign-in…")} />
        ) : !user ? (
          <Button size="lg" className="w-full" onClick={signInWithGoogle}>
            {translateSync("Sign in with Google")}
          </Button>
        ) : user.role === "admin" || user.isDemo ? (
          <p className="text-sm text-ink-3">
            {translateSync(user.isDemo ? "Demo accounts are shared and can't be deleted." : "Admin accounts can't delete themselves. Ask another admin to change your role first.")}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-ink-3">
              {translateSync("Signed in as")} <span className="text-ink">{user.email}</span>
            </p>
            <DeleteAccount onDeleted={() => setDeleted(true)} />
          </div>
        )}
      </Card>

      <p className="text-sm text-ink-3">
        {CONTACT_EMAIL ? (
          <>
            {translateSync("Can't sign in any more? Email")}{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20HeriTech%20account`} className="text-pine-600 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>{" "}
            {translateSync("from the address on your account and we'll delete it within 30 days.")}
          </>
        ) : null}{" "}
        <Link href="/privacy" className="text-pine-600 underline underline-offset-2">
          {translateSync("Privacy policy")}
        </Link>
      </p>
    </div>
  );
}
