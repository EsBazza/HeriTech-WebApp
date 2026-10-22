"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText } from "@/components/translation/TranslatableText";
import { CheckCircle2, XCircle, Clock, Palette, Camera, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AccessGuard } from "@/components/AccessGuard";
import { BoothClaimsCard } from "@/components/admin/BoothClaimsCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiJson } from "@/lib/api";
import type { UserDoc, UserRole } from "@/lib/firebase/types";
import type { AdminStats } from "@/app/api/admin/stats/route";
import { SPLIT, SPLIT_LABEL } from "@/lib/escrow";
import { Badge, Button, Card, Dialog, EmptyState, Input, PageHeader, Select, Skeleton, Stat, type BadgeTone } from "@/components/ui";

type Applicant = UserDoc & { applicationDetails: UserDoc["application"] };

const ROLES: UserRole[] = ["buyer", "artisan", "lgu", "admin"];
const ROLE_LABEL: Record<string, string> = { buyer: "Buyer", artisan: "Artisan", lgu: "Local government officer", admin: "Admin" };
const ROLE_TONE: Record<string, BadgeTone> = { buyer: "neutral", artisan: "accent", lgu: "pine", admin: "warn" };

// Recharts needs literal colours; these are the pine-500, line, and split tokens from globals.css.
const CHART = { collected: "#3c6b52", target: "#d3cbbd", grid: "#e4ded3", tick: "#5f6661" };
const SPLIT_COLORS = ["#1f3a2b", "#8fb09c", "#c2602f"];

/** A step that needs a second tap: rejecting an applicant or changing someone's role. */
interface PendingAction {
  title: string;
  body: string;
  confirm: string;
  danger?: boolean;
  key: string;
  payload: Record<string, string>;
}

function AdminDashboardPageContent() {
  const { user } = useAuth();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Which button is working, e.g. "approve:uid", so only that one shows a spinner.
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [search, setSearch] = useState("");

  const loadAdminData = async () => {
    const [statsRes, appsRes, usersRes] = await Promise.all([
      apiJson<AdminStats>("/api/admin/stats"),
      apiJson<Applicant[]>("/api/admin/applications"),
      apiJson<UserDoc[]>("/api/admin/users"),
    ]);
    if (statsRes.success) setStats(statsRes.data ?? null);
    if (appsRes.success) setApplications(appsRes.data ?? []);
    if (usersRes.success) setUsers(usersRes.data ?? []);
    setActionError([statsRes, appsRes, usersRes].find((r) => !r.success)?.error ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const run = async (key: string, body: Record<string, string>) => {
    setBusy(key);
    setActionMessage(null);
    setActionError(null);
    const result = await apiJson("/api/admin/applications", { method: "POST", body: JSON.stringify(body) });
    if (result.success) {
      setActionMessage(result.message ?? "Done.");
      await loadAdminData();
    } else {
      setActionError(result.error ?? "That action failed.");
    }
    setBusy(null);
    setPending(null);
  };

  const pendingApps = applications.filter((a) => a.verificationStatus === "pending_artisan" || a.verificationStatus === "pending_lgu");
  const roleName = (r: string) => translateSync(ROLE_LABEL[r] ?? r);

  const askRoleChange = (u: UserDoc, role: UserRole) => {
    if (u.role === role) return;
    setPending({
      title: translateSync("Change this person's role?"),
      body: `${u.fullName || u.email}: ${roleName(u.role)} → ${roleName(role)}. ${translateSync("Their access changes the next time they open the app.")}`,
      confirm: translateSync("Change role"),
      key: `role:${u.id}`,
      payload: { userId: u.id, action: "change_role", targetRole: role },
    });
  };

  const shorten = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s);
  const query = search.trim().toLowerCase();
  const shownUsers = query ? users.filter((u) => `${u.fullName} ${u.email}`.toLowerCase().includes(query)) : users;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <PageHeader
        eyebrow={translateSync("Admin")}
        title={translateSync("Admin console")}
        description={translateSync("Approve artisan and local government applications, review payment splits and track festival collection targets.")}
        actions={
          !loading && (
            <Badge tone={pendingApps.length ? "warn" : "neutral"}>
              {pendingApps.length} {translateSync("pending applications")}
            </Badge>
          )
        }
      />

      {actionMessage && (
        <p role="status" className="flex items-center gap-2 p-4 rounded-md bg-pine-50 border border-pine-200 text-sm text-pine-800">
          <CheckCircle2 className="w-5 h-5 text-pine-500 shrink-0" />
          <TranslatableText>{actionMessage}</TranslatableText>
        </p>
      )}
      {actionError && (
        <p role="alert" className="flex items-start gap-2 p-4 rounded-md bg-danger-100 border border-danger/20 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {translateSync(actionError)}
        </p>
      )}

      {/* Applications */}
      <section className="space-y-4" aria-labelledby="admin-apps">
        <h2 id="admin-apps" className="flex items-center gap-2 text-lg font-semibold text-ink font-sans">
          <Clock className="w-5 h-5 text-pine-500" />
          {translateSync("Applications to join")}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-52 rounded-md" />
            <Skeleton className="h-52 rounded-md hidden md:block" />
          </div>
        ) : pendingApps.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="w-5 h-5" />} title={translateSync("No applications waiting")} description={translateSync("New applications will show up here.")} />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingApps.map((applicant) => {
              const isArtisan = applicant.verificationStatus === "pending_artisan";
              return (
                <li key={applicant.id}>
                  <Card className="h-full p-5 sm:p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${isArtisan ? "bg-lantern-100 text-lantern-600" : "bg-pine-100 text-pine-700"}`}
                      >
                        {isArtisan ? <Palette className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-ink font-sans">{applicant.fullName}</h3>
                        <p className="text-sm text-ink-3 break-all">{applicant.email}</p>
                        <Badge tone={isArtisan ? "accent" : "pine"} className="mt-2">
                          {translateSync(isArtisan ? "Wants to join as an artisan" : "Wants to join as a local government officer")}
                        </Badge>
                      </div>
                    </div>

                    <dl className="p-3.5 bg-paper rounded-md space-y-1 text-sm">
                      {isArtisan ? (
                        <>
                          <div className="flex gap-2">
                            <dt className="text-ink-3">{translateSync("Workshop")}:</dt>
                            <dd className="font-medium text-ink">{applicant.workshopName || translateSync("Not given")}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-ink-3">{translateSync("Craft")}:</dt>
                            <dd className="text-ink-2">
                              <TranslatableText>{applicant.applicationDetails?.craftTypology || "Not given"}</TranslatableText>
                            </dd>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <dt className="text-ink-3">{translateSync("Station")}:</dt>
                            <dd className="font-medium text-ink">{applicant.stationName || translateSync("Not given")}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-ink-3">{translateSync("Country")}:</dt>
                            <dd className="text-ink-2">
                              <TranslatableText>{applicant.country || "Not given"}</TranslatableText>
                            </dd>
                          </div>
                        </>
                      )}
                      {applicant.applicationDetails?.bio && <p className="text-ink-3 italic pt-1">&ldquo;{applicant.applicationDetails.bio}&rdquo;</p>}
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-3 border-t border-line">
                      <Button
                        variant="secondary"
                        className="text-danger hover:text-danger hover:border-danger"
                        disabled={busy !== null}
                        onClick={() =>
                          setPending({
                            title: translateSync("Reject this application?"),
                            body: `${applicant.fullName}. ${translateSync("They stay a buyer and can apply again.")}`,
                            confirm: translateSync("Reject"),
                            danger: true,
                            key: `reject:${applicant.id}`,
                            payload: { userId: applicant.id, action: "reject" },
                          })
                        }
                      >
                        <XCircle className="w-4 h-4" />
                        {translateSync("Reject")}
                      </Button>
                      <Button
                        loading={busy === `approve:${applicant.id}`}
                        disabled={busy !== null && busy !== `approve:${applicant.id}`}
                        onClick={() => run(`approve:${applicant.id}`, { userId: applicant.id, action: "approve" })}
                      >
                        {busy !== `approve:${applicant.id}` && <CheckCircle2 className="w-4 h-4" />}
                        {translateSync("Approve")}
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BoothClaimsCard />

      {/* People and roles */}
      <section className="space-y-4 pt-8 border-t border-line" aria-labelledby="admin-users">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="admin-users" className="flex items-center gap-2 text-lg font-semibold text-ink font-sans">
              <Users className="w-5 h-5 text-pine-500" />
              {translateSync("People and roles")}
            </h2>
            <p className="text-sm text-ink-3 mt-0.5">{translateSync("Change what each person can do: buyer, artisan, local government officer or admin.")}</p>
          </div>
          {!loading && (
            <span className="text-sm text-ink-3 tabular">
              {shownUsers.length === users.length ? users.length : `${shownUsers.length} / ${users.length}`} {translateSync("people")}
            </span>
          )}
        </div>

        {!loading && users.length > 0 && (
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translateSync("Search by name or email")}
            aria-label={translateSync("Search people")}
            wrapperClassName="sm:max-w-sm"
          />
        )}

        {loading ? (
          <Skeleton className="h-64 rounded-md" />
        ) : (
          <Card className="overflow-hidden">
            {/* Phones: one card per person. Wider screens: a table. */}
            <ul className="md:hidden divide-y divide-line">
              {shownUsers.map((u) => (
                <li key={u.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-pine-700 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {u.fullName?.slice(0, 2).toUpperCase() || "U"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-ink truncate">{u.fullName}</p>
                      <p className="text-sm text-ink-3 truncate">{u.email}</p>
                    </div>
                  </div>
                  <Select
                    label={translateSync("Role")}
                    value={u.role}
                    disabled={busy === `role:${u.id}` || u.id === user?.id}
                    hint={u.id === user?.id ? translateSync("You can't change your own role.") : undefined}
                    onChange={(e) => askRoleChange(u, e.target.value as UserRole)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleName(r)}
                      </option>
                    ))}
                  </Select>
                </li>
              ))}
            </ul>

            <table className="hidden md:table w-full text-left text-sm">
              <thead>
                <tr className="bg-paper border-b border-line text-ink-3">
                  <th scope="col" className="py-3 px-4 font-medium">{translateSync("Person")}</th>
                  <th scope="col" className="py-3 px-4 font-medium">{translateSync("Email")}</th>
                  <th scope="col" className="py-3 px-4 font-medium">{translateSync("Role")}</th>
                  <th scope="col" className="py-3 px-4 font-medium w-64">{translateSync("Change role")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shownUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-paper/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-2.5 font-medium text-ink">
                        <span className="w-8 h-8 rounded-full bg-pine-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {u.fullName?.slice(0, 2).toUpperCase() || "U"}
                        </span>
                        {u.fullName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-2 break-all">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>{roleName(u.role)}</Badge>
                    </td>
                    <td className="py-2 px-4">
                      <Select
                        aria-label={`${translateSync("Change role")}: ${u.fullName}`}
                        value={u.role}
                        disabled={busy === `role:${u.id}` || u.id === user?.id}
                        title={u.id === user?.id ? translateSync("You can't change your own role.") : undefined}
                        onChange={(e) => askRoleChange(u, e.target.value as UserRole)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleName(r)}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Payments & material */}
      <section className="space-y-6 pt-8 border-t border-line" aria-labelledby="admin-overview">
        <div>
          <h2 id="admin-overview" className="flex items-center gap-2 text-lg font-semibold text-ink font-sans">
            <TrendingUp className="w-5 h-5 text-pine-600" />
            {translateSync("Payments and material")}
          </h2>
          <p className="text-sm text-ink-3 mt-0.5">{translateSync("Total sales, how every sale was split, and festival collection.")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            { label: translateSync("Total sales"), value: formatCurrency(stats?.kpis?.grossVolume ?? 0), hint: translateSync("Demo payments, no real money yet") },
            { label: `${translateSync("Paid to artisans")} · ${SPLIT.artisan}%`, value: formatCurrency(stats?.kpis?.artisanPayoutTotal ?? 0) },
            { label: `${translateSync("Paid to local governments")} · ${SPLIT.lgu}%`, value: formatCurrency(stats?.kpis?.lguShareTotal ?? 0) },
            { label: translateSync("Material collected"), value: formatNumber(stats?.kpis?.totalKgCollected ?? 0), unit: "kg" },
          ].map((s) => (
            <Card key={s.label} className="p-4 sm:p-6">
              {loading ? <Skeleton className="h-16" /> : <Stat label={s.label} value={s.value} unit={s.unit} hint={s.hint} />}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Card className="p-5 sm:p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-ink font-sans">{translateSync("Festival collection: kg collected against the agreed amount")}</h3>
            <div className="h-64 w-full">
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.festivals || []} margin={{ left: -12, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART.tick }} tickFormatter={shorten} interval={0} angle={-20} textAnchor="end" height={48} />
                    <YAxis tick={{ fontSize: 12, fill: CHART.tick }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="collected" fill={CHART.collected} name={translateSync("Collected (kg)")} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="allocated" fill={CHART.target} name={translateSync("Agreed (kg)")} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6 space-y-4 flex flex-col">
            <div>
              <h3 className="text-[15px] font-semibold text-ink font-sans">
                {translateSync("Payment split")} ({SPLIT_LABEL})
              </h3>
              <p className="text-sm text-ink-3 mt-0.5">{translateSync("How completed sales were divided between artisans, local governments, and charity & app upkeep.")}</p>
            </div>
            <div className="h-56 w-full">
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats?.escrowSplitDistribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {(stats?.escrowSplitDistribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SPLIT_COLORS[index % SPLIT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <ul className="grid grid-cols-3 gap-2 text-center text-sm pt-3 border-t border-line">
              {[
                { pct: SPLIT.artisan, color: "bg-split-artisan", label: "Artisan" },
                { pct: SPLIT.lgu, color: "bg-split-platform", label: "Local government" },
                { pct: SPLIT.charityMaintenance, color: "bg-split-ngo", label: "Charity & app upkeep" },
              ].map((s) => (
                <li key={s.label}>
                  <span className="flex items-center justify-center gap-1.5 text-ink font-semibold tabular">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} aria-hidden />
                    {s.pct}%
                  </span>
                  <span className="text-ink-3">{translateSync(s.label)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <Dialog
        open={Boolean(pending)}
        onClose={() => busy === null && setPending(null)}
        dismissible={busy === null}
        size="sm"
        closeLabel={translateSync("Close")}
        title={pending?.title ?? ""}
        footer={
          pending && (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPending(null)} disabled={busy !== null}>
                {translateSync("Cancel")}
              </Button>
              <Button variant={pending.danger ? "danger" : "primary"} className="flex-1" loading={busy === pending.key} onClick={() => run(pending.key, pending.payload)}>
                {pending.confirm}
              </Button>
            </div>
          )
        }
      >
        <p className="text-[15px] text-ink-2">{pending?.body}</p>
      </Dialog>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AccessGuard allowedRoles={["admin"]} pageTitle="Admin">
      <AdminDashboardPageContent />
    </AccessGuard>
  );
}
