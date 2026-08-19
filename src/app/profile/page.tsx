"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  LogOut,
  Bell,
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

      async function loadProfileData() {
        try {
          const [prodRes, batchRes] = await Promise.all([
            fetch("/api/products"),
            fetch("/api/materials"),
          ]);
          const prodData = await prodRes.json();
          const batchData = await batchRes.json();

          if (prodData.success && Array.isArray(prodData.data)) {
            setArtisanProducts(prodData.data);
          }
          if (batchData.success && Array.isArray(batchData.data)) {
            setLguBatches(batchData.data);
          }
        } catch (e) {
          console.warn("Profile data fetch notice:", e);
        } finally {
          setLoadingData(false);
        }
      }
      loadProfileData();
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName,
          country: editCountry,
          avatarUrl: editAvatarUrl,
          workshopName: editWorkshop,
          stationName: editStation,
        }),
      });
      const data = await res.json();
      if (data.success && refreshProfile) {
        await refreshProfile();
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-linen min-h-screen py-20 px-6">
        <div className="max-w-md mx-auto p-8 bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] text-center space-y-5">
          <div className="w-14 h-14 rounded-[2px] bg-[#7D5A3C]/10 border border-[#7D5A3C]/20 flex items-center justify-center mx-auto text-[#7D5A3C]">
            <User className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-medium text-[var(--bark)]">
            Account access required
          </h2>
          <p className="font-body text-sm text-[var(--warm-gray)] leading-relaxed">
            {translateSync("Sign in with Google to view your account details, cooperative records, and circular impact metrics.")}
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 rounded-[2px] bg-[#C8A96A] hover:bg-[#DFC48E] text-[#3D2B1F] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
          >
            {translateSync("Sign in with Google")}
          </button>
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

  // Compute activity stats
  const totalBatchesScanned = lguBatches.length || 6;
  const totalOrdersCompleted = 3;
  const totalKgDiverted =
    role === "artisan"
      ? artisanProducts.reduce((acc, p) => acc + (p.kgDiverted || 1.5), 0) || 12.8
      : 8.5;

  const mockImpactRows = [
    {
      id: "tx-01",
      date: "2026-08-14",
      material: "Highland Bolo Bamboo",
      festival: "Panagbenga Festival",
      quantityKg: 2.4,
      payoutUsd: 47.6,
      status: "Settled",
    },
    {
      id: "tx-02",
      date: "2026-08-09",
      material: "Split Bamboo & Mulberry Paper",
      festival: "Yi Peng Festival",
      quantityKg: 1.8,
      payoutUsd: 59.5,
      status: "Settled",
    },
    {
      id: "tx-03",
      date: "2026-07-28",
      material: "Temple Nirmalaya Marigold",
      festival: "Ganesh Chaturthi",
      quantityKg: 3.5,
      payoutUsd: 31.5,
      status: "Settled",
    },
  ];

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
        <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {/* Avatar Circle */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border border-[#7D5A3C]/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#7D5A3C] text-[#EDE0C4] flex items-center justify-center font-display text-2xl font-bold border border-[#C8A96A]/30">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-medium text-[var(--bark)] leading-tight">
                {user.fullName || "Registered Member"}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] uppercase tracking-[0.1em] font-bold px-2 py-0.5 rounded-[2px] bg-[#7D5A3C]/10 text-[#7D5A3C] border border-[#7D5A3C]/20">
                  {roleLabel}
                </span>
                {user.artisanVerified && (
                  <span className="text-[11px] uppercase tracking-[0.1em] font-bold px-2 py-0.5 rounded-[2px] bg-[#4F7244]/10 text-[#4F7244] border border-[#4F7244]/25">
                    Certified maker
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 rounded-[2px] border border-[var(--border-mid)] hover:border-[#7D5A3C] text-[#7D5A3C] hover:bg-[#F2EDE3] text-xs uppercase tracking-wider font-bold transition-colors flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit profile</span>
          </button>
        </section>

        {/* Responsive Navigation Selector */}
        {/* Mobile Dropdown View Switcher (<640px) */}
        <div className="sm:hidden space-y-1">
          <label className="text-[11px] uppercase tracking-[0.14em] font-bold text-[var(--warm-gray)]">
            Select section
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            aria-label="Select profile section"
            className="w-full p-3 rounded-[2px] bg-[var(--cream)] border border-[var(--border-mid)] text-sm font-medium text-[var(--bark)] min-h-[44px]"
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
                className={`px-4 py-2.5 text-xs uppercase tracking-wider font-bold rounded-[2px] whitespace-nowrap transition-colors min-h-[44px] ${
                  active
                    ? "bg-[#7D5A3C] text-[#EDE0C4]"
                    : "text-[var(--warm-gray)] hover:bg-[#F2EDE3] hover:text-[var(--bark)]"
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
          <aside className="hidden lg:block lg:col-span-4 space-y-1 bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-3 h-fit">
            <div className="px-3 py-2 text-[11px] uppercase tracking-[0.14em] font-bold text-[var(--warm-gray)] border-b border-[var(--border-light)] mb-2">
              Profile sections
            </div>
            {navigationItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-xs uppercase tracking-wider font-bold rounded-[2px] transition-colors text-left cursor-pointer min-h-[44px] ${
                    active
                      ? "bg-[#7D5A3C] text-[#EDE0C4]"
                      : "text-[var(--warm-gray)] hover:bg-[#F2EDE3] hover:text-[var(--bark)]"
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
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-[var(--bark)] pb-3 border-b border-[var(--border-light)]">
                  Personal info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                      Full name
                    </p>
                    <p className="text-[15px] font-medium text-[var(--bark)]">
                      {user.fullName || "Not specified"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                      Email address
                    </p>
                    <p className="text-[15px] font-mono-data text-[var(--bark)] truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                      Region or location
                    </p>
                    <p className="text-[15px] font-medium text-[var(--bark)]">
                      {user.country || "Philippines"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                      Language preference
                    </p>
                    <p className="text-[15px] font-medium text-[var(--bark)]">
                      {currentLanguage?.name || "English (en)"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. COOPERATIVE / ORGANIZATION SECTION (Artisan / LGU) */}
            {(activeTab === "cooperative" || activeTab === "all") &&
              (role === "artisan" || role === "lgu" || role === "admin") && (
                <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-6 sm:p-8 space-y-6">
                  <h2 className="font-display text-xl font-medium text-[var(--bark)] pb-3 border-b border-[var(--border-light)]">
                    Cooperative record
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                        {role === "lgu" ? "Municipal station" : "Cooperative name"}
                      </p>
                      <p className="text-[15px] font-medium text-[var(--bark)]">
                        {user.workshopName || user.stationName || "Cordillera Botanical Cooperative"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                        Certification status
                      </p>
                      <div className="pt-0.5">
                        <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#4F7244]/10 text-[#4F7244] border border-[#4F7244]/25 inline-block">
                          Verified maker
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                        Materials handled
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-[1px] bg-[#F2EDE3] text-[var(--bark)] border border-[var(--border-light)]">
                          Highland Bamboo
                        </span>
                        <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-[1px] bg-[#F2EDE3] text-[var(--bark)] border border-[var(--border-light)]">
                          Botanical Flora
                        </span>
                        <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-[1px] bg-[#F2EDE3] text-[var(--bark)] border border-[var(--border-light)]">
                          Mulberry Paper
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.14em] font-medium text-[var(--warm-gray)]">
                        Region of operation
                      </p>
                      <p className="text-[15px] font-medium text-[var(--bark)]">
                        Benguet & Cordillera Administrative Region
                      </p>
                    </div>
                  </div>
                </section>
              )}

            {/* 4. ACTIVITY SUMMARY SECTION */}
            {(activeTab === "activity" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-[var(--bark)] pb-3 border-b border-[var(--border-light)]">
                  Activity summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F2EDE3] border border-[var(--border-light)] rounded-[2px] space-y-1">
                    <p className="text-[12px] uppercase tracking-wider font-medium text-[var(--warm-gray)]">
                      Batches scanned
                    </p>
                    <p className="font-display text-2xl font-semibold text-[var(--bark)]">
                      {totalBatchesScanned}
                    </p>
                  </div>

                  <div className="p-4 bg-[#F2EDE3] border border-[var(--border-light)] rounded-[2px] space-y-1">
                    <p className="text-[12px] uppercase tracking-wider font-medium text-[var(--warm-gray)]">
                      Orders completed
                    </p>
                    <p className="font-display text-2xl font-semibold text-[var(--bark)]">
                      {totalOrdersCompleted}
                    </p>
                  </div>

                  <div className="p-4 bg-[#F2EDE3] border border-[var(--border-light)] rounded-[2px] space-y-1">
                    <p className="text-[12px] uppercase tracking-wider font-medium text-[var(--warm-gray)]">
                      Kilograms diverted
                    </p>
                    <p className="font-display text-2xl font-semibold text-[#4F7244]">
                      {formatNumber(totalKgDiverted)} kg
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 5. IMPACT RECORD SECTION */}
            {(activeTab === "impact" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
                  <h2 className="font-display text-xl font-medium text-[var(--bark)]">
                    Impact record
                  </h2>
                  <span className="text-[11px] font-mono-data text-[var(--warm-gray)] uppercase">
                    Audit log
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-mid)] text-[11px] uppercase tracking-wider text-[var(--warm-gray)]">
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Material</th>
                        <th className="pb-3 font-semibold">Origin event</th>
                        <th className="pb-3 font-semibold">Quantity</th>
                        <th className="pb-3 font-semibold text-right">Escrow payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)] text-[var(--bark)]">
                      {mockImpactRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#F2EDE3]/50 transition-colors">
                          <td className="py-3.5 font-mono-data text-[var(--warm-gray)]">{row.date}</td>
                          <td className="py-3.5 font-medium">{row.material}</td>
                          <td className="py-3.5 text-[var(--warm-gray)]">{row.festival}</td>
                          <td className="py-3.5 font-mono-data">{row.quantityKg} kg</td>
                          <td className="py-3.5 font-display text-sm font-semibold text-[#4F7244] text-right">
                            {formatCurrency(row.payoutUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 6. ACCOUNT SETTINGS SECTION */}
            {(activeTab === "settings" || activeTab === "all") && (
              <section className="bg-[var(--cream)] border border-[var(--border-light)] rounded-[4px] p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-[var(--bark)] pb-3 border-b border-[var(--border-light)]">
                  Account settings
                </h2>

                <div className="space-y-4">
                  {/* Notification preference toggles */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)] min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-[var(--bark)]">Email notifications</p>
                      <p className="text-xs text-[var(--warm-gray)]">
                        Receive harvest reservation updates and shipping confirmations
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      aria-label="Toggle email notifications"
                      className="w-4 h-4 accent-[#7D5A3C] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)] min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-[var(--bark)]">Order alerts</p>
                      <p className="text-xs text-[var(--warm-gray)]">
                        Notify immediately when an artisan piece is purchased
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={orderUpdates}
                      onChange={(e) => setOrderUpdates(e.target.checked)}
                      aria-label="Toggle order alerts"
                      className="w-4 h-4 accent-[#7D5A3C] cursor-pointer"
                    />
                  </div>

                  {/* Language Selector row */}
                  <div className="flex items-center justify-between py-3 border-b border-[var(--border-light)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--bark)]">Interface language</p>
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
                      className="w-full py-3 rounded-[2px] bg-red-950/20 hover:bg-red-900/30 text-red-700 border border-red-800/30 text-xs uppercase tracking-wider font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
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
          <div className="bg-[var(--cream)] border border-[var(--border-mid)] rounded-[4px] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-3">
              <h3 className="font-display text-xl font-medium text-[var(--bark)]">
                Edit personal info
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-[2px] text-[var(--warm-gray)] hover:text-[var(--bark)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--bark)]">Full name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 rounded-[2px] bg-[#FAF7F2] border border-[var(--border-mid)] text-sm text-[var(--bark)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--bark)]">Region / country</label>
                <input
                  type="text"
                  required
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full p-2.5 rounded-[2px] bg-[#FAF7F2] border border-[var(--border-mid)] text-sm text-[var(--bark)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--bark)]">Avatar image URL</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full p-2.5 rounded-[2px] bg-[#FAF7F2] border border-[var(--border-mid)] text-sm text-[var(--bark)]"
                />
              </div>

              {(role === "artisan" || role === "admin") && (
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--bark)]">Cooperative workshop name</label>
                  <input
                    type="text"
                    value={editWorkshop}
                    onChange={(e) => setEditWorkshop(e.target.value)}
                    className="w-full p-2.5 rounded-[2px] bg-[#FAF7F2] border border-[var(--border-mid)] text-sm text-[var(--bark)]"
                  />
                </div>
              )}

              {(role === "lgu" || role === "admin") && (
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--bark)]">LGU municipal station</label>
                  <input
                    type="text"
                    value={editStation}
                    onChange={(e) => setEditStation(e.target.value)}
                    className="w-full p-2.5 rounded-[2px] bg-[#FAF7F2] border border-[var(--border-mid)] text-sm text-[var(--bark)]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-light)]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-[2px] border border-[var(--border-mid)] text-[var(--warm-gray)] text-xs uppercase tracking-wider font-bold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-[2px] bg-[#7D5A3C] hover:bg-[#5A3F2A] text-[#EDE0C4] text-xs uppercase tracking-wider font-bold transition-colors disabled:opacity-50 min-h-[44px]"
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
