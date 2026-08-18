"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import {
  ShieldCheck,
  MapPin,
  Heart,
  Scale,
  Leaf,
  ArrowLeft,
} from "lucide-react";

export default function PublicVerificationPage() {
  const params = useParams();
  const serial = params?.serial as string;
  const { formatCurrency, formatNumber } = useTranslation();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerification() {
      try {
        const res = await fetch(`/api/verify/${serial}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Verification fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (serial) loadVerification();
  }, [serial]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3A] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 mt-4"><TranslatableText>Auditing cryptographic provenance record...</TranslatableText></p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <TranslatableHeading level={2} className="text-lg font-bold text-gray-900">Invalid or Unregistered Impact Pass</TranslatableHeading>
        <TranslatableParagraph className="text-xs text-gray-500">
          No verified harvest records found for serial <strong>{serial}</strong>.
        </TranslatableParagraph>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1A6B3A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <TranslatableText>Return to HeriTech Home</TranslatableText>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Verification Badge */}
      <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-300 shadow-lg space-y-3 text-center">
        <div className="w-14 h-14 bg-emerald-100 text-[#1A6B3A] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <TranslatableText className="text-[10px] font-mono-data font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            GOOGLE WALLET AUDITED IMPACT PASS
          </TranslatableText>
          <TranslatableHeading level={1} className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            Provenance Record Verified
          </TranslatableHeading>
          <p className="text-xs text-emerald-900 font-mono-data font-semibold mt-1">
            SERIAL: <strong>{data.serial}</strong>
          </p>
        </div>
      </div>

      {/* Main Chain-of-Custody Card */}
      <div className="bg-white rounded-3xl border border-[#E6E2D8] p-8 space-y-6 shadow-sm">
        <div>
          <TranslatableText className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Product Upcycle
          </TranslatableText>
          <TranslatableHeading level={2} className="text-xl font-bold text-gray-900 mt-0.5"><TranslatableText>{data.product.title}</TranslatableText></TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-600 leading-relaxed mt-1">{data.product.description}</TranslatableParagraph>
        </div>

        {/* Origin Harvest Telemetry */}
        <div className="p-5 bg-[#F8F6F0] rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <span className="font-bold text-gray-800 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#1A6B3A]" />
              <span>
                <TranslatableText>Origin</TranslatableText>: <TranslatableText>{data.originHarvest.festival}</TranslatableText> (<TranslatableText>{data.originHarvest.country}</TranslatableText>)
              </span>
            </span>
            <span className="font-mono-data text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              {formatNumber(data.product.kgDiverted)} kg diverted
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-gray-600">
            <div>
              <TranslatableText className="text-[10px] text-gray-400 block font-bold uppercase">Material</TranslatableText>
              <p className="font-semibold text-gray-900"><TranslatableText>{data.originHarvest.materialType}</TranslatableText></p>
            </div>
            <div>
              <TranslatableText className="text-[10px] text-gray-400 block font-bold uppercase">
                GPS Coordinates
              </TranslatableText>
              <p className="font-mono-data font-semibold text-gray-900">
                {data.originHarvest.gpsCoordinates?.lat.toFixed(4)}° N,{" "}
                {data.originHarvest.gpsCoordinates?.lng.toFixed(4)}° E
              </p>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
            <TranslatableText>Logged on-site by Officer</TranslatableText>: <strong><TranslatableText>{data.originHarvest.loggedByOfficer}</TranslatableText></strong> (
            <TranslatableText>{data.originHarvest.municipalityStation}</TranslatableText>)
          </p>
        </div>

        {/* Master Artisan Maker */}
        <div className="p-4 rounded-2xl bg-white border border-[#E6E2D8] flex items-center justify-between text-xs">
          <div>
            <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">Master Maker</TranslatableText>
            <p className="text-sm font-bold text-gray-900"><TranslatableText>{data.maker.name}</TranslatableText></p>
            <p className="text-xs text-gray-500"><TranslatableText>{data.maker.workshop}</TranslatableText></p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            <TranslatableText>VERIFIED GUILD</TranslatableText>
          </span>
        </div>

        {/* 70/20/10 Escrow Settlement Audit */}
        <div className="p-5 bg-white rounded-2xl border border-[#E6E2D8] space-y-3 text-xs">
          <TranslatableText className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            70/20/10 Escrow Settlement Audit
          </TranslatableText>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-blue-600" />
                <TranslatableText>70% Direct Artisan Payout</TranslatableText>
              </span>
              <span className="font-mono-data font-bold text-blue-700">
                {formatCurrency(data.escrowAudit.artisanPayout)} USD
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <TranslatableText>20% LGU & Platform Infrastructure</TranslatableText>
              </span>
              <span className="font-mono-data font-bold text-emerald-700">
                {formatCurrency(data.escrowAudit.platformFee)} USD
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Leaf className="w-3.5 h-3.5 text-amber-600" />
                <span>10% NGO: <TranslatableText>{data.escrowAudit.ngoFundName}</TranslatableText></span>
              </span>
              <span className="font-mono-data font-bold text-amber-700">
                {formatCurrency(data.escrowAudit.ngoContribution)} USD
              </span>
            </div>
          </div>
        </div>

        {/* SHA-256 Hash */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono-data text-xs space-y-1">
          <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">
            Tamper-Evident SHA-256 Provenance Hash
          </TranslatableText>
          <p className="text-gray-700 text-[10px] break-all">{data.tamperEvidentHarvestHash}</p>
        </div>
      </div>
    </div>
  );
}
