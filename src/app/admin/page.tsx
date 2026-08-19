"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Palette,
  Camera,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/applications"),
      ]);
      const statsData = await statsRes.json();
      const appsData = await appsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (appsData.success) setApplications(appsData.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleReview = async (userId: string, action: "approve" | "reject") => {
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        await loadAdminData();
      }
    } catch (err) {
      console.error("Review action error:", err);
    }
  };

  const pendingApps = applications.filter(
    (a) => a.verificationStatus === "pending_artisan" || a.verificationStatus === "pending_lgu"
  );

  const escrowColors = ["#2563EB", "#10B981", "#F59E0B"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E2D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-red-700">
            <ShieldCheck className="w-4 h-4" />
            <TranslatableText>CENTRAL GOVERNANCE & CONTROL PORTAL</TranslatableText>
          </div>
          <TranslatableHeading level={1} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            HeriTech System Administration
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-1">
            Review and approve Artisan & LGU applications, inspect live escrow distributions, and monitor continent-wide festival waste quotas.
          </TranslatableParagraph>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-mono-data text-xs font-bold border border-red-300">
            {pendingApps.length} <TranslatableText>PENDING APPLICATIONS</TranslatableText>
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span><TranslatableText>{actionMessage}</TranslatableText></span>
        </div>
      )}

      {/* Verification Applications Review Queue */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <TranslatableHeading level={2} className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Artisan & LGU Verification Applications Queue</span>
          </TranslatableHeading>
          <span className="text-xs text-gray-500">
            <TranslatableText>
              {pendingApps.length === 0 ? "All applications reviewed" : "Requires manual approval"}
            </TranslatableText>
          </span>
        </div>

        {pendingApps.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-[#E6E2D8] text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <TranslatableHeading level={3} className="text-sm font-bold text-gray-900">
              Application Queue is Clear
            </TranslatableHeading>
            <TranslatableParagraph className="text-xs text-gray-500">
              There are no pending verification requests awaiting administrative review.
            </TranslatableParagraph>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingApps.map((applicant) => {
              const isArtisan = applicant.verificationStatus === "pending_artisan";
              return (
                <div
                  key={applicant.id}
                  className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-4 shadow-sm hover:border-[#1A6B3A] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            isArtisan
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isArtisan ? <Palette className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">{applicant.fullName}</h3>
                          <p className="text-xs text-gray-500 font-mono-data">{applicant.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isArtisan
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-blue-50 text-blue-800 border-blue-300"
                        }`}
                      >
                        <TranslatableText>
                          {isArtisan ? "APPLYING: ARTISAN" : "APPLYING: LGU OFFICER"}
                        </TranslatableText>
                      </span>
                    </div>

                    {/* Applicant Details */}
                    <div className="p-3.5 bg-[#F8F6F0] rounded-2xl space-y-1 text-xs">
                      {isArtisan ? (
                        <>
                          <p className="font-semibold text-gray-900">
                            <TranslatableText>Workshop</TranslatableText>: <strong>{applicant.workshopName || translateSync("Not specified")}</strong>
                          </p>
                          <p className="text-gray-600">
                            <TranslatableText>Craft</TranslatableText>: <TranslatableText>{applicant.applicationDetails?.craftTypology || "Bamboo/Paper"}</TranslatableText>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-900">
                            <TranslatableText>Station</TranslatableText>: <strong>{applicant.stationName || translateSync("Not specified")}</strong>
                          </p>
                          <p className="text-gray-600">
                            <TranslatableText>Country</TranslatableText>: <TranslatableText>{applicant.country || "Philippines"}</TranslatableText>
                          </p>
                        </>
                      )}
                      {applicant.applicationDetails?.bio && (
                        <p className="text-[11px] text-gray-500 italic mt-1">
                          "{applicant.applicationDetails.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleReview(applicant.id, "reject")}
                      className="py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <TranslatableText>Reject</TranslatableText>
                    </button>

                    <button
                      onClick={() => handleReview(applicant.id, "approve")}
                      className="py-2.5 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <TranslatableText>Approve Role</TranslatableText>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Analytics & KPI Dashboard */}
      <section className="space-y-6 pt-6 border-t border-[#E6E2D8]">
        <div>
          <TranslatableHeading level={2} className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#1A6B3A]" />
            <span>Platform Financial & Material Telemetry</span>
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-0.5">
            Aggregated gross volume, automated 70/20/10 disbursements, and festival diversion metrics.
          </TranslatableParagraph>
        </div>

        {/* 4 Key Admin Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-white border border-[#E6E2D8] shadow-sm space-y-1">
            <TranslatableText className="text-[10px] font-bold text-gray-400 uppercase">Gross Volume</TranslatableText>
            <p className="text-3xl font-black text-gray-900 font-mono-data">
              {formatCurrency(stats?.kpis?.grossVolume || 162.00)}
            </p>
            <TranslatableText className="text-[11px] text-gray-500 font-medium">100% Escrow Transacted</TranslatableText>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E6E2D8] shadow-sm space-y-1">
            <TranslatableText className="text-[10px] font-bold text-gray-400 uppercase">70% Artisan Payouts</TranslatableText>
            <p className="text-3xl font-black text-blue-700 font-mono-data">
              {formatCurrency(stats?.kpis?.artisanPayoutTotal || 113.40)}
            </p>
            <TranslatableText className="text-[11px] text-blue-600 font-medium">To Certified Maker Cooperatives</TranslatableText>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E6E2D8] shadow-sm space-y-1">
            <TranslatableText className="text-[10px] font-bold text-gray-400 uppercase">10% NGO Trust Funds</TranslatableText>
            <p className="text-3xl font-black text-amber-700 font-mono-data">
              {formatCurrency(stats?.kpis?.ngoFundTotal || 16.20)}
            </p>
            <TranslatableText className="text-[11px] text-amber-600 font-medium">Clean Air & River Trusts</TranslatableText>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E6E2D8] shadow-sm space-y-1">
            <TranslatableText className="text-[10px] font-bold text-gray-400 uppercase">Total Diverted</TranslatableText>
            <p className="text-3xl font-black text-[#1A6B3A] font-mono-data">
              {formatNumber(stats?.kpis?.totalKgCollected || 303.2)} <span className="text-xs font-normal">kg</span>
            </p>
            <TranslatableText className="text-[11px] text-emerald-700 font-medium">From Asian Landfills</TranslatableText>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Festival Quota Progress */}
          <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-4 shadow-sm">
            <TranslatableHeading level={3} className="text-sm font-bold text-gray-900">
              Pan-Asian Festival Waste Quotas (kg Collected vs Target)
            </TranslatableHeading>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.festivals || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#1A6B3A" name="Collected (kg)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="allocated" fill="#E6E2D8" name="Target Quota (kg)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 70/20/10 Escrow Breakdown */}
          <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <TranslatableHeading level={3} className="text-sm font-bold text-gray-900">
                Fixed 70/20/10 Escrow Distribution
              </TranslatableHeading>
              <TranslatableParagraph className="text-xs text-gray-500 mt-0.5">
                Direct economic routing across artisans, infrastructure, and clean-up funds.
              </TranslatableParagraph>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.escrowSplitDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(stats?.escrowSplitDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={escrowColors[index % escrowColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-data pt-2 border-t border-gray-100">
              <div>
                <span className="block text-blue-700 font-bold">70%</span>
                <TranslatableText className="text-[10px] text-gray-500">Artisan Payout</TranslatableText>
              </div>
              <div>
                <span className="block text-emerald-700 font-bold">20%</span>
                <TranslatableText className="text-[10px] text-gray-500">LGU & Platform</TranslatableText>
              </div>
              <div>
                <span className="block text-amber-700 font-bold">10%</span>
                <TranslatableText className="text-[10px] text-gray-500">NGO Fund</TranslatableText>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
