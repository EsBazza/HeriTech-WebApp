"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button, Card, Eyebrow, controlClass, cn } from "@/components/ui";

export default function VerifyLookupPage() {
  const router = useRouter();
  const { translateSync } = useTranslation();
  const [serial, setSerial] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = serial.trim();
    if (s) router.push(`/verify/${encodeURIComponent(s)}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center space-y-4">
        <span className="w-12 h-12 mx-auto rounded-full bg-pine-100 text-pine-700 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
        </span>
        <Eyebrow>{translateSync("Public verification")}</Eyebrow>
        <h1 className="font-display text-[44px] leading-[1.05] font-semibold text-ink">{translateSync("Check a Verified Impact Pass")}</h1>
        <p className="text-base text-ink-2">
          {translateSync("Enter the serial printed on the pass, or scan its QR code with your phone camera. You'll see the full chain of custody and payment split.")}
        </p>
      </div>

      <Card className="mt-10 p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="serial" className="block text-sm font-medium text-ink">
            {translateSync("Pass serial")}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="serial"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="HT-519-PH"
              autoFocus
              autoCapitalize="characters"
              className={cn(controlClass, "h-12 font-mono-data text-base flex-1")}
            />
            <Button type="submit" size="lg" disabled={!serial.trim()}>
              {translateSync("Verify")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
        <div className="mt-5 pt-5 border-t border-line flex items-start gap-3 text-sm text-ink-3">
          <QrCode className="w-5 h-5 shrink-0 text-ink-3" />
          <p>{translateSync("Every pass in Google Wallet carries a QR code that opens this page directly. No app or account needed.")}</p>
        </div>
      </Card>
    </div>
  );
}
