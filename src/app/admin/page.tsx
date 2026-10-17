"use client";

import React, { useEffect, useState } from "react";
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
import { AccessGuard } from "@/components/AccessGuard";
import { apiJson } from "@/lib/api";
import { SPLIT, SPLIT_LABEL } from "@/lib/escrow";

function AdminDashboardPageContent() {
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAdminData = async () => {
    const [statsRes, appsRes, usersRes] = await Promise.all([
      apiJson<any>("/api/admin/stats"),
      apiJson<any[]>("/api/admin/applications"),
      apiJson<any[]>("/api/admin/users"),
    ]);
    if (statsRes.success) setStats(statsRes.data);
    if (appsRes.success) setApplications(appsRes.data ?? []);
    if (usersRes.success) setUsers(usersRes.data ?? []);
    setActionError([statsRes, appsRes, usersRes].find((r) => !r.success)?.error ?? null);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const submitAdminAction = async (body: Record<string, string>) => {
    setActionMessage(null);
    setActionError(null);
    const result = await apiJson("/api/admin/applications", { method: "POST", body: JSON.stringify(body) });
    if (result.success) {
      setActionMessage(result.message ?? null);
      await loadAdminData();
    } else {
      setActionError(result.error ?? "That action failed.");
    }
  };

  const handleReview = (userId: string, action: "approve" | "reject") => submitAdminAction({ userId, action });

  const pendingApps = applications.filter(
    (a) => a.verificationStatus === "pending_artisan" || a.verificationStatus === "pending_lgu"
  );

  const escrowColors = ["#1f3a2b", "#8fb09c", "#c2602f"]; // split-artisan, split-platform, split-ngo

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-500">
            <ShieldCheck className="w-4 h-4" />
            <TranslatableText>Admin</TranslatableText>
          </div>
          <TranslatableHeading level={1} className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink mt-2">
            Admin console
          </TranslatableHeading>
          <TranslatableParagraph className="text-base text-ink-2 mt-2 max-w-2xl">
            Approve artisan and LGU applications, review payment splits and track festival collection quotas.
          </TranslatableParagraph>
        </div>

        <div className="flex items-center space-x-2">
          <span className={pendingApps.length ? "px-3 py-1 rounded-full bg-warn-100 text-warn text-sm font-medium border border-warn/20" : "px-3 py-1 rounded-full bg-paper-2 text-ink-3 text-sm font-medium border border-line"}>
            {pendingApps.length} <TranslatableText>pending applications</TranslatableText>
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-lg bg-pine-50 border border-pine-200 text-xs font-bold text-pine-700 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-pine-500 flex-shrink-0" />
          <span><TranslatableText>{actionMessage}</TranslatableText></span>
        </div>
      )}
      {actionError && (
        <div role="alert" className="p-4 rounded-lg bg-danger-100 border border-danger/20 text-xs font-bold text-danger">
          {translateSync(actionError)}
        </div>
      )}

      {/* Verification Applications Review Queue */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <TranslatableHeading level={2} className="text-lg font-bold text-ink flex items-center space-x-2">
            <Clock className="w-5 h-5 text-pine-500" />
            <span>Artisan & LGU Verification Applications Queue</span>
          </TranslatableHeading>
          <span className="text-xs text-ink-3">
            <TranslatableText>
              {pendingApps.length === 0 ? "All applications reviewed" : "Requires manual approval"}
            </TranslatableText>
          </span>
        </div>

        {pendingApps.length === 0 ? (
          <div className="p-8 bg-surface rounded-lg border border-line text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-pine-500 mx-auto" />
            <TranslatableHeading level={3} className="text-sm font-bold text-ink">
              Application Queue is Clear
            </TranslatableHeading>
            <TranslatableParagraph className="text-xs text-ink-3">
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
                  className="bg-surface rounded-lg border border-line p-6 space-y-4 shadow-card hover:border-pine-500 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isArtisan
                              ? "bg-warn-100 text-warn"
                              : "bg-pine-100 text-pine-700"
                          }`}
                        >
                          {isArtisan ? <Palette className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-ink">{applicant.fullName}</h3>
                          <p className="text-xs text-ink-3 font-mono-data">{applicant.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          isArtisan
                            ? "bg-warn-100 text-warn border-warn/20"
                            : "bg-pine-50 text-pine-700 border-pine-300"
                        }`}
                      >
                        <TranslatableText>
                          {isArtisan ? "APPLYING: ARTISAN" : "APPLYING: LGU OFFICER"}
                        </TranslatableText>
                      </span>
                    </div>

                    {/* Applicant Details */}
                    <div className="p-3.5 bg-paper rounded-lg space-y-1 text-xs">
                      {isArtisan ? (
                        <>
                          <p className="font-semibold text-ink">
                            <TranslatableText>Workshop</TranslatableText>: <strong>{applicant.workshopName || translateSync("Not specified")}</strong>
                          </p>
                          <p className="text-ink-2">
                            <TranslatableText>Craft</TranslatableText>: <TranslatableText>{applicant.applicationDetails?.craftTypology || "Not given"}</TranslatableText>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-ink">
                            <TranslatableText>Station</TranslatableText>: <strong>{applicant.stationName || translateSync("Not specified")}</strong>
                          </p>
                          <p className="text-ink-2">
                            <TranslatableText>Country</TranslatableText>: <TranslatableText>{applicant.country || "Philippines"}</TranslatableText>
                          </p>
                        </>
                      )}
                      {applicant.applicationDetails?.bio && (
                        <p className="text-xs text-ink-3 italic mt-1">
                          &ldquo;{applicant.applicationDetails.bio}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
                    <button
                      onClick={() => handleReview(applicant.id, "reject")}
                      className="py-2.5 rounded-md border border-danger/20 bg-danger-100 text-danger font-bold text-xs hover:bg-danger-100 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <TranslatableText>Reject</TranslatableText>
                    </button>

                    <button
                      onClick={() => handleReview(applicant.id, "approve")}
                      className="py-2.5 rounded-md bg-pine-700 hover:bg-pine-600 text-white font-bold text-xs shadow-card transition-all flex items-center justify-center space-x-1.5"
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

      {/* User Role Management Table (Prisma Studio Equivalent for Admin) */}
      <section className="space-y-4 pt-6 border-t border-line">
        <div className="flex items-center justify-between">
          <div>
            <TranslatableHeading level={2} className="text-lg font-bold text-ink flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-pine-500" />
              <span>User Accounts & Role Administration</span>
            </TranslatableHeading>
            <TranslatableParagraph className="text-xs text-ink-3 mt-0.5">
              Admin control panel to manage registered user permissions and update roles (Buyer, Artisan, LGU, Admin).
            </TranslatableParagraph>
          </div>
          <span className="text-xs font-bold text-ink-3 font-mono-data">
            {users.length} <TranslatableText>Total users</TranslatableText>
          </span>
        </div>

        <div className="bg-surface rounded-lg border border-line overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-paper border-b border-line text-xs font-bold text-ink-3">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-pine-700 text-white flex items-center justify-center font-bold text-xs">
                        {u.fullName?.slice(0, 2).toUpperCase() || "U"}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="py-3 px-4 text-ink-2 font-mono-data">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pine-50 text-pine-600 border border-pine-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex space-x-1">
                        {(["buyer", "artisan", "lgu", "admin"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => u.role !== r && submitAdminAction({ userId: u.id, action: "change_role", targetRole: r })}
                            className={`px-2 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                              u.role === r
                                ? "bg-pine-700 text-white border-pine-500"
                                : "bg-surface text-ink-2 border-line hover:bg-paper-2"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Analytics & KPI Dashboard */}
      <section className="space-y-6 pt-6 border-t border-line">
        <div>
          <TranslatableHeading level={2} className="text-lg font-bold text-ink flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-pine-600" />
            <span>Payments & material overview</span>
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-ink-3 mt-0.5">
            Gross volume, how every sale was split, and festival collection metrics.
          </TranslatableParagraph>
        </div>

        {/* 4 Key Admin Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-lg bg-surface border border-line shadow-card space-y-1">
            <TranslatableText className="text-xs font-bold text-ink-3">Gross Volume</TranslatableText>
            <p className="font-display text-[34px] leading-none font-semibold text-ink tabular">
              {formatCurrency(stats?.kpis?.grossVolume ?? 0)}
            </p>
            <TranslatableText className="text-xs text-ink-3 font-medium">Simulated payments, no real money yet</TranslatableText>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-line shadow-card space-y-1">
            <p className="text-xs font-bold text-ink-3">{SPLIT.artisan}% {translateSync("Artisan payouts")}</p>
            <p className="font-display text-[34px] leading-none font-semibold text-ink tabular">
              {formatCurrency(stats?.kpis?.artisanPayoutTotal ?? 0)}
            </p>
            <TranslatableText className="text-xs text-pine-500 font-medium">To Certified Maker Cooperatives</TranslatableText>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-line shadow-card space-y-1">
            <p className="text-xs font-bold text-ink-3">{SPLIT.lgu}% {translateSync("LGU share")}</p>
            <p className="font-display text-[34px] leading-none font-semibold text-lantern-600 tabular">
              {formatCurrency(stats?.kpis?.lguShareTotal ?? 0)}
            </p>
            <TranslatableText className="text-xs text-ink-3">For municipal collection and logistics</TranslatableText>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-line shadow-card space-y-1">
            <TranslatableText className="text-xs font-bold text-ink-3">Total Diverted</TranslatableText>
            <p className="font-display text-[34px] leading-none font-semibold text-ink tabular">
              {formatNumber(stats?.kpis?.totalKgCollected ?? 0)} <span className="text-xs font-normal">kg</span>
            </p>
            <TranslatableText className="text-xs text-pine-600 font-medium">From Asian Landfills</TranslatableText>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Festival Quota Progress */}
          <div className="bg-surface rounded-lg border border-line p-6 space-y-4 shadow-card">
            <TranslatableHeading level={3} className="text-sm font-bold text-ink">
              Festival collection quotas (kg collected vs target)
            </TranslatableHeading>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.festivals || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4ded3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#3c6b52" name="Collected (kg)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="allocated" fill="#e4ded3" name="Target Quota (kg)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: payment split breakdown */}
          <div className="bg-surface rounded-lg border border-line p-6 space-y-4 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {translateSync("Payment split")} ({SPLIT_LABEL})
              </h3>
              <TranslatableParagraph className="text-xs text-ink-3 mt-0.5">
                How completed sales were divided between artisans, LGUs, and charity & app upkeep.
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

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-line">
              <div>
                <span className="flex items-center justify-center gap-1.5 text-ink font-semibold tabular"><span className="w-2 h-2 rounded-full bg-split-artisan" aria-hidden />{SPLIT.artisan}%</span>
                <TranslatableText className="text-xs text-ink-3">Artisan payout</TranslatableText>
              </div>
              <div>
                <span className="flex items-center justify-center gap-1.5 text-ink font-semibold tabular"><span className="w-2 h-2 rounded-full bg-split-platform" aria-hidden />{SPLIT.lgu}%</span>
                <TranslatableText className="text-xs text-ink-3">LGU</TranslatableText>
              </div>
              <div>
                <span className="flex items-center justify-center gap-1.5 text-ink font-semibold tabular"><span className="w-2 h-2 rounded-full bg-split-ngo" aria-hidden />{SPLIT.charityMaintenance}%</span>
                <TranslatableText className="text-xs text-ink-3">Charity & app upkeep</TranslatableText>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AccessGuard allowedRoles={["admin"]} pageTitle="System Administration">
      <AdminDashboardPageContent />
    </AccessGuard>
  );
}
