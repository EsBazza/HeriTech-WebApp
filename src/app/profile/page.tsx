"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { apiJson } from "@/lib/api";
import {
  User,
  CheckCircle2,
  Edit3,
  LogOut,
  Globe,
  Layers,
  FileText,
  Sliders,
  ChevronRight,
  X,
} from "lucide-react";

export default function ProfilePage() {
  const { user, signInWithGoogle, signOut, refreshProfile } = useAuth();
  const { formatCurrency, formatNumber, translateSync, currentLanguage } = useTranslation();

  // Active Tab for Sidebar/Tablet/Mobile (6 views or direct scrolling)
  const [activeTab, setActiveTab] = useState<string>("personal");

  // Profile Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editCountry, setEditCountry] = useState("Philippines");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editWorkshop, setEditWorkshop] = useState("");
  const [editStation, setEditStation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Notification settings toggle state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [batchAlerts, setBatchAlerts] = useState(true);

  // Profile Data States
  const [artisanProducts, setArtisanProducts] = useState<any[]>([]);
  const [lguBatches, setLguBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditCountry(user.country || "Philippines");
      setEditAvatarUrl(user.avatarUrl || "");
      setEditWorkshop(user.workshopName || "");
      setEditStation(user.stationName || "");

      // Only this user's own records: their purchases, plus listings or batches for their role.
      const userId = user.id;
      const role = user.role;
      Promise.all([
        apiJson<any[]>("/api/orders"),
        role === "artisan" ? apiJson<any[]>(`/api/products?artisanId=${encodeURIComponent(userId)}`) : null,
        role === "lgu" ? apiJson<any[]>("/api/materials?mine=scanned") : null,
      ]).then(([orderRes, productRes, batchRes]) => {
        if (orderRes.success) setOrders(orderRes.data ?? []);
        if (productRes?.success) setArtisanProducts(productRes.data ?? []);
        if (batchRes?.success) setLguBatches(batchRes.data ?? []);
        setLoadingData(false);
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveError(null);
    const result = await apiJson("/api/user/profile/update", {
      method: "POST",
      body: JSON.stringify({
        fullName: editFullName,
        country: editCountry,
        avatarUrl: editAvatarUrl,
        workshopName: editWorkshop,
        stationName: editStation,
      }),
    });
    if (result.success) {
      await refreshProfile();
      setEditModalOpen(false);
    } else {
      setSaveError(result.error ?? "Couldn't save your profile.");
    }
    setSavingProfile(false);
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface border border-line rounded-md shadow-card p-8 space-y-6">
          <div className="text-center space-y-3">
            <span className="w-12 h-12 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center mx-auto">
              <User className="w-5 h-5" />
            </span>
            <h1 className="font-display text-[32px] leading-tight font-semibold text-ink">{translateSync("Your HeriTech account")}</h1>
            <p className="text-sm text-ink-2">{translateSync("Sign in to keep your impact passes, orders and messages in one place.")}</p>
          </div>
          <ul className="space-y-2.5 text-sm text-ink-2">
            {[
              translateSync("Every Verified Impact Pass you've collected"),
              translateSync("Order history and delivery updates"),
              translateSync("Your total kg diverted and donations made"),
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pine-500 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
          <button
            onClick={signInWithGoogle}
            className="w-full h-12 rounded-md bg-pine-700 hover:bg-pine-600 text-white font-medium transition-colors cursor-pointer"
          >
            {translateSync("Sign in with Google")}
          </button>
          <p className="text-xs text-ink-3 text-center">
            {translateSync("Just browsing?")}{" "}
            <Link href="/" className="text-pine-600 hover:text-pine-700 font-medium">
              {translateSync("Explore the shop")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const role = user.role || "buyer";
  const roleLabel =
    role === "artisan"
      ? "Artisan"
      : role === "lgu"
      ? "LGU Officer"
      : role === "admin"
      ? "Administrator"
      : "Buyer";

  // Activity stats from this user's own records
  const totalBatchesScanned = lguBatches.length;
  const totalOrdersCompleted = orders.length;
  const purchasedKg = orders.reduce((acc, o) => acc + (o.product?.kgDiverted ?? 0) * (o.quantity ?? 1), 0);
  const totalKgDiverted =
    role === "artisan" ? artisanProducts.reduce((acc, p) => acc + (p.kgDiverted ?? 0), 0) : role === "lgu" ? lguBatches.reduce((acc, b) => acc + (b.weightKg ?? 0), 0) : purchasedKg;

  const navigationItems = [
    { id: "personal", label: "Personal info", icon: User },
    ...(role === "artisan" || role === "lgu" || role === "admin"
      ? [{ id: "cooperative", label: "Cooperative record", icon: Layers }]
      : []),
    { id: "activity", label: "Activity summary", icon: Sliders },
    { id: "impact", label: "Impact record", icon: FileText },
    { id: "settings", label: "Account settings", icon: Globe },
  ];

  return (
    <div className="bg-linen min-h-screen py-10 sm:py-14 px-4 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 1. PROFILE HEADER */}
        <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {/* Avatar Circle */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border border-line-strong/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-pine-700 text-white flex items-center justify-center font-display text-2xl font-bold border border-lantern/30">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-medium text-ink leading-tight">
                {user.fullName || "Registered Member"}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-pine-700/10 text-lantern-600 border border-line-strong/20">
                  {roleLabel}
                </span>
                {user.artisanVerified && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-pine-500/10 text-pine-500 border border-pine-300/25">
                    Certified maker
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 rounded-sm border border-[var(--border-mid)] hover:border-line-strong text-lantern-600 hover:bg-paper-2 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit profile</span>
          </button>
        </section>

        {/* Responsive Navigation Selector */}
        {/* Mobile Dropdown View Switcher (<640px) */}
        <div className="sm:hidden space-y-1">
          <label className="text-xs font-bold text-[var(--warm-gray)]">
            Select section
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            aria-label="Select profile section"
            className="w-full p-3 rounded-sm bg-[var(--cream)] border border-[var(--border-mid)] text-sm font-medium text-ink min-h-[44px]"
          >
            {navigationItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tablet Horizontal Tabs (640px - 1023px) */}
        <div className="hidden sm:flex lg:hidden overflow-x-auto border-b border-[var(--border-light)] pb-1 gap-2">
          {navigationItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2.5 text-xs font-bold rounded-sm whitespace-nowrap transition-colors min-h-[44px] ${
                  active
                    ? "bg-pine-700 text-white"
                    : "text-[var(--warm-gray)] hover:bg-paper-2 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar + Content Layout (>=1024px) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 space-y-1 bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-3 h-fit">
            <div className="px-3 py-2 text-xs font-bold text-[var(--warm-gray)] border-b border-[var(--border-light)] mb-2">
              Profile sections
            </div>
            {navigationItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-sm transition-colors text-left cursor-pointer min-h-[44px] ${
                    active
                      ? "bg-pine-700 text-white"
                      : "text-[var(--warm-gray)] hover:bg-paper-2 hover:text-ink"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </aside>

          {/* Right Content Pane (Render All Sections or Focus Active) */}
          <main className="lg:col-span-8 space-y-8">
            {/* 2. PERSONAL INFO SECTION */}
            {(activeTab === "personal" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-[var(--border-light)]">
                  Personal info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[var(--warm-gray)]">
                      Full name
                    </p>
                    <p className="text-[15px] font-medium text-ink">
                      {user.fullName || "Not specified"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[var(--warm-gray)]">
                      Email address
                    </p>
                    <p className="text-[15px] font-mono-data text-ink truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[var(--warm-gray)]">
                      Region or location
                    </p>
                    <p className="text-[15px] font-medium text-ink">
                      {user.country || "Philippines"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[var(--warm-gray)]">
                      Language preference
                    </p>
                    <p className="text-[15px] font-medium text-ink">
                      {currentLanguage?.name || "English (en)"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. COOPERATIVE / ORGANIZATION SECTION (Artisan / LGU) */}
            {(activeTab === "cooperative" || activeTab === "all") &&
              (role === "artisan" || role === "lgu" || role === "admin") && (
                <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-6 sm:p-8 space-y-6">
                  <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-[var(--border-light)]">
                    Cooperative record
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--warm-gray)]">
                        {role === "lgu" ? "Municipal station" : "Cooperative name"}
                      </p>
                      <p className="text-[15px] font-medium text-ink">
                        {user.workshopName || user.stationName || "Cordillera Botanical Cooperative"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--warm-gray)]">
                        Certification status
                      </p>
                      <div className="pt-0.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-pine-500/10 text-pine-500 border border-pine-300/25 inline-block">
                          Verified maker
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--warm-gray)]">
                        Materials handled
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-paper-2 text-ink border border-[var(--border-light)]">
                          Highland Bamboo
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-paper-2 text-ink border border-[var(--border-light)]">
                          Botanical Flora
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-paper-2 text-ink border border-[var(--border-light)]">
                          Mulberry Paper
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--warm-gray)]">
                        Region of operation
                      </p>
                      <p className="text-[15px] font-medium text-ink">
                        Benguet & Cordillera Administrative Region
                      </p>
                    </div>
                  </div>
                </section>
              )}

            {/* 4. ACTIVITY SUMMARY SECTION */}
            {(activeTab === "activity" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-[var(--border-light)]">
                  Activity summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-paper-2 border border-[var(--border-light)] rounded-sm space-y-1">
                    <p className="text-[12px] font-medium text-[var(--warm-gray)]">
                      Batches scanned
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {totalBatchesScanned}
                    </p>
                  </div>

                  <div className="p-4 bg-paper-2 border border-[var(--border-light)] rounded-sm space-y-1">
                    <p className="text-[12px] font-medium text-[var(--warm-gray)]">
                      Orders completed
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {totalOrdersCompleted}
                    </p>
                  </div>

                  <div className="p-4 bg-paper-2 border border-[var(--border-light)] rounded-sm space-y-1">
                    <p className="text-[12px] font-medium text-[var(--warm-gray)]">
                      Kilograms diverted
                    </p>
                    <p className="font-display text-2xl font-semibold text-pine-500">
                      {formatNumber(totalKgDiverted)} kg
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 5. IMPACT RECORD SECTION */}
            {(activeTab === "impact" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
                  <h2 className="font-display text-xl font-medium text-ink">
                    Impact record
                  </h2>
                  <span className="text-xs font-mono-data text-[var(--warm-gray)]">
                    {translateSync("Your purchases")}
                  </span>
                </div>

                {loadingData ? (
                  <p className="text-xs text-[var(--warm-gray)]">{translateSync("Loading…")}</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-ink-2">
                    {translateSync("No purchases yet. Each piece you buy comes with a Verified Impact Pass, listed here.")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-mid)] text-xs text-[var(--warm-gray)]">
                          <th className="pb-3 font-semibold">{translateSync("Date")}</th>
                          <th className="pb-3 font-semibold">{translateSync("Piece")}</th>
                          <th className="pb-3 font-semibold">{translateSync("Quantity")}</th>
                          <th className="pb-3 font-semibold">{translateSync("Paid")}</th>
                          <th className="pb-3 font-semibold text-right">{translateSync("Impact pass")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-light)] text-ink">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-paper-2/50 transition-colors">
                            <td className="py-3.5 font-mono-data text-[var(--warm-gray)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="py-3.5 font-medium">{order.product?.title ?? translateSync("Removed listing")}</td>
                            <td className="py-3.5 font-mono-data">{order.quantity}</td>
                            <td className="py-3.5 font-display text-sm font-semibold text-pine-500">{formatCurrency(order.amountPaid)}</td>
                            <td className="py-3.5 text-right">
                              {order.pass ? (
                                <Link href={`/verify/${order.pass.serial}`} className="font-mono-data text-pine-700 underline">
                                  {order.pass.serial}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* 6. ACCOUNT SETTINGS SECTION */}
            {(activeTab === "settings" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-sm p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-[var(--border-light)]">
                  Account settings
                </h2>

                <div className="space-y-4">
                  {/* Notification preference toggles */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)] min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-ink">Email notifications</p>
                      <p className="text-xs text-[var(--warm-gray)]">
                        Receive harvest reservation updates and shipping confirmations
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      aria-label="Toggle email notifications"
                      className="w-4 h-4 accent-pine-700 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)] min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-ink">Order alerts</p>
                      <p className="text-xs text-[var(--warm-gray)]">
                        Notify immediately when an artisan piece is purchased
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={orderUpdates}
                      onChange={(e) => setOrderUpdates(e.target.checked)}
                      aria-label="Toggle order alerts"
                      className="w-4 h-4 accent-pine-700 cursor-pointer"
                    />
                  </div>

                  {/* Language Selector row */}
                  <div className="flex items-center justify-between py-3 border-b border-[var(--border-light)]">
                    <div>
                      <p className="text-sm font-medium text-ink">Interface language</p>
                      <p className="text-xs text-[var(--warm-gray)]">
                        Change the active UI translation across the platform
                      </p>
                    </div>
                    <LanguageSelector variant="compact" />
                  </div>

                  {/* Destructive Sign Out Button */}
                  <div className="pt-4">
                    <button
                      onClick={signOut}
                      className="w-full py-3 rounded-sm bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out of HeriTech</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--cream)] border border-[var(--border-mid)] rounded-sm max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-pop">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-3">
              <h3 className="font-display text-xl font-medium text-ink">
                Edit personal info
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-sm text-[var(--warm-gray)] hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink">Full name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 rounded-sm bg-paper border border-[var(--border-mid)] text-sm text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Region / country</label>
                <input
                  type="text"
                  required
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full p-2.5 rounded-sm bg-paper border border-[var(--border-mid)] text-sm text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Avatar image URL</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full p-2.5 rounded-sm bg-paper border border-[var(--border-mid)] text-sm text-ink"
                />
              </div>

              {(role === "artisan" || role === "admin") && (
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Cooperative workshop name</label>
                  <input
                    type="text"
                    value={editWorkshop}
                    onChange={(e) => setEditWorkshop(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-paper border border-[var(--border-mid)] text-sm text-ink"
                  />
                </div>
              )}

              {(role === "lgu" || role === "admin") && (
                <div className="space-y-1">
                  <label className="font-semibold text-ink">LGU municipal station</label>
                  <input
                    type="text"
                    value={editStation}
                    onChange={(e) => setEditStation(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-paper border border-[var(--border-mid)] text-sm text-ink"
                  />
                </div>
              )}

              {saveError && (
                <p role="alert" className="text-sm text-danger">
                  {translateSync(saveError)}
                </p>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-light)]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-sm border border-[var(--border-mid)] text-[var(--warm-gray)] text-xs font-bold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-sm bg-pine-700 hover:bg-pine-600 text-white text-xs font-bold transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
