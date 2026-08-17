"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Heart,
  Scale,
  Leaf,
  ExternalLink,
  ArrowLeft,
  QrCode,
} from "lucide-react";

export default function PublicVerificationPage() {
  const params = useParams();
  const serial = params?.serial as string;

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
        <p className="text-xs text-gray-500 mt-4">Auditing cryptographic provenance record...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Invalid or Unregistered Impact Pass</h2>
        <p className="text-xs text-gray-500">
          No verified harvest records found for serial <strong>{serial}</strong>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1A6B3A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to HeriTech Home</span>
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
          <span className="text-[10px] font-mono-data font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            GOOGLE WALLET AUDITED IMPACT PASS
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            Provenance Record Verified
          </h1>
          <p className="text-xs text-emerald-900 font-mono-data font-semibold mt-1">
            SERIAL: <strong>{data.serial}</strong>
          </p>
        </div>
      </div>

      {/* Main Chain-of-Custody Card */}
      <div className="bg-white rounded-3xl border border-[#E6E2D8] p-8 space-y-6 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Product Upcycle
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">{data.product.title}</h2>
          <p className="text-xs text-gray-600 leading-relaxed mt-1">{data.product.description}</p>
        </div>

        {/* Origin Harvest Telemetry */}
        <div className="p-5 bg-[#F8F6F0] rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <span className="font-bold text-gray-800 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#1A6B3A]" />
              <span>
                Origin: {data.originHarvest.festival} ({data.originHarvest.country})
              </span>
            </span>
            <span className="font-mono-data text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              {data.product.kgDiverted} kg diverted
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-gray-600">
            <div>
              <span className="text-[10px] text-gray-400 block font-bold uppercase">Material</span>
              <p className="font-semibold text-gray-900">{data.originHarvest.materialType}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-bold uppercase">
                GPS Coordinates
              </span>
              <p className="font-mono-data font-semibold text-gray-900">
                {data.originHarvest.gpsCoordinates?.lat.toFixed(4)}° N,{" "}
                {data.originHarvest.gpsCoordinates?.lng.toFixed(4)}° E
              </p>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
            Logged on-site by Officer: <strong>{data.originHarvest.loggedByOfficer}</strong> (
            {data.originHarvest.municipalityStation})
          </p>
        </div>

        {/* Master Artisan Maker */}
        <div className="p-4 rounded-2xl bg-white border border-[#E6E2D8] flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Master Maker</span>
            <p className="text-sm font-bold text-gray-900">{data.maker.name}</p>
            <p className="text-xs text-gray-500">{data.maker.workshop}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            VERIFIED GUILD
          </span>
        </div>

        {/* 70/20/10 Escrow Settlement Audit */}
        <div className="p-5 bg-white rounded-2xl border border-[#E6E2D8] space-y-3 text-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            70/20/10 Escrow Settlement Audit
          </span>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-blue-600" />
                <span>70% Direct Artisan Payout</span>
              </span>
              <span className="font-mono-data font-bold text-blue-700">
                ${data.escrowAudit.artisanPayout.toFixed(2)} USD
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>20% LGU & Platform Infrastructure</span>
              </span>
              <span className="font-mono-data font-bold text-emerald-700">
                ${data.escrowAudit.platformFee.toFixed(2)} USD
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center space-x-1.5">
                <Leaf className="w-3.5 h-3.5 text-amber-600" />
                <span>10% NGO: {data.escrowAudit.ngoFundName}</span>
              </span>
              <span className="font-mono-data font-bold text-amber-700">
                ${data.escrowAudit.ngoContribution.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* SHA-256 Hash */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono-data text-xs space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase">
            Tamper-Evident SHA-256 Provenance Hash
          </span>
          <p className="text-gray-700 text-[10px] break-all">{data.tamperEvidentHarvestHash}</p>
        </div>
      </div>
    </div>
  );
}
