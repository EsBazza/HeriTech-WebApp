"use client";

import React, { useState } from "react";
import { Camera, Clock, Palette, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { apiJson } from "@/lib/api";
import { Button, Card, Input, Textarea, cn } from "@/components/ui";

type ApplyType = "artisan" | "lgu";

/**
 * Lets a buyer ask an admin to verify them as an artisan or a local government
 * officer. Shows the waiting state while an application is pending, and lets
 * someone whose application was rejected apply again.
 */
export function ApplyRoleCard() {
  const { user, refreshProfile } = useAuth();
  const { translateSync } = useTranslation();
  const [type, setType] = useState<ApplyType>("artisan");
  const [workshopName, setWorkshopName] = useState(user?.workshopName ?? "");
  const [craftTypology, setCraftTypology] = useState("");
  const [stationName, setStationName] = useState(user?.stationName ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  if (!user || user.role !== "buyer") return null;

  const status = user.verificationStatus;
  if (status === "pending_artisan" || status === "pending_lgu") {
    return (
      <Card className="p-5 sm:p-6 flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-warn-100 text-warn flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </span>
        <div>
          <p className="font-medium text-ink">
            {translateSync(status === "pending_artisan" ? "Your artisan application is waiting for review" : "Your local government officer application is waiting for review")}
          </p>
          <p className="text-sm text-ink-3 mt-0.5">{sent ? translateSync(sent) : translateSync("An admin checks every application. Your access changes once you are approved.")}</p>
        </div>
      </Card>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await apiJson("/api/user/apply", {
      method: "POST",
      body: JSON.stringify(
        type === "artisan" ? { type, workshopName, craftTypology, country, bio } : { type, stationName, country, bio }
      ),
    });
    if (result.success) {
      setSent(result.message ?? "Your application was sent for admin review.");
      await refreshProfile();
    } else {
      setError(result.error ?? "Couldn't send your application.");
    }
    setSubmitting(false);
  };

  const options: { id: ApplyType; label: string; body: string; icon: typeof Palette }[] = [
    { id: "artisan", label: "Artisan", body: "Reserve festival material and sell what you make.", icon: Palette },
    { id: "lgu", label: "Local government officer", body: "Log collected material and hand it over to artisans.", icon: Camera },
  ];

  return (
    <Card className="p-5 sm:p-8 space-y-5">
      <div className="pb-3 border-b border-line">
        <h2 className="font-display text-2xl font-semibold text-ink">{translateSync("Join as a partner")}</h2>
        <p className="text-sm text-ink-3 mt-1">{translateSync("Everyone starts as a buyer. Apply here and an admin will verify you.")}</p>
      </div>

      {status === "rejected" && (
        <p className="flex items-start gap-2 rounded-md bg-danger-100 border border-danger/20 px-3 py-2.5 text-sm text-danger">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {translateSync("Your last application wasn't approved. You can apply again with more detail.")}
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={translateSync("Apply as")}>
          {options.map((o) => {
            const Icon = o.icon;
            const active = type === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(o.id)}
                className={cn(
                  "flex items-start gap-3 rounded-md border p-4 text-left transition-colors cursor-pointer",
                  active ? "border-pine-500 bg-pine-50 ring-1 ring-pine-500" : "border-line bg-surface hover:border-pine-300"
                )}
              >
                <Icon className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <span>
                  <span className="block text-[15px] font-medium text-ink">{translateSync(o.label)}</span>
                  <span className="block text-sm text-ink-3">{translateSync(o.body)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {type === "artisan" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={translateSync("Workshop or cooperative")} required value={workshopName} onChange={(e) => setWorkshopName(e.target.value)} />
            <Input label={translateSync("What you make")} value={craftTypology} onChange={(e) => setCraftTypology(e.target.value)} />
          </div>
        ) : (
          <Input label={translateSync("Local government office")} required value={stationName} onChange={(e) => setStationName(e.target.value)} />
        )}
        <Input label={translateSync("Country")} required value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
        <Textarea label={translateSync("A few words about you (optional)")} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {translateSync(error)}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={submitting}>
          {translateSync("Send application")}
        </Button>
      </form>
    </Card>
  );
}

export default ApplyRoleCard;
