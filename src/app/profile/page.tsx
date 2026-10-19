"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { apiJson } from "@/lib/api";
import { ImpactPassCard } from "@/components/wallet/ImpactPassCard";
import { LoyaltyCard } from "@/components/wallet/LoyaltyCard";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import type { BatchView, ProductView } from "@/lib/server/views";
import type { BuyerOrder } from "@/app/api/orders/route";
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
} from "lucide-react";

export default function ProfilePage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { formatCurrency, formatNumber, translateSync, currentLanguage } = useTranslation();

  // Active Tab for Sidebar/Tablet/Mobile (6 views or direct scrolling)
  const [activeTab, setActiveTab] = useState<string>("personal");

  // "Go to my passes" links to /profile#passes: open the passes tab directly
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#passes") setActiveTab("impact");
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const [editModalOpen, setEditModalOpen] = useState(false);

  // Profile Data States
  const [artisanProducts, setArtisanProducts] = useState<ProductView[]>([]);
  const [lguBatches, setLguBatches] = useState<BatchView[]>([]);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      // Only this user's own records: their purchases, plus listings or batches for their role.
      const userId = user.id;
      const role = user.role;
      Promise.all([
        apiJson<BuyerOrder[]>("/api/orders"),
        role === "artisan" ? apiJson<ProductView[]>(`/api/products?artisanId=${encodeURIComponent(userId)}`) : null,
        role === "lgu" ? apiJson<BatchView[]>("/api/materials?mine=scanned") : null,
      ]).then(([orderRes, productRes, batchRes]) => {
        if (orderRes.success) setOrders(orderRes.data ?? []);
        if (productRes?.success) setArtisanProducts(productRes.data ?? []);
        if (batchRes?.success) setLguBatches(batchRes.data ?? []);
        setLoadingData(false);
      });
    }
  }, [user]);

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
      ? "Local government officer"
      : role === "admin"
      ? "Administrator"
      : "Buyer";

  // Materials this user has actually worked with: tags on their listings, or batches they logged.
  const materialsHandled: string[] = [
    ...new Set<string>(
      role === "artisan" ? artisanProducts.flatMap((p) => p.materialTags ?? []) : lguBatches.map((b) => b.materialType)
    ),
  ].slice(0, 8);

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
    { id: "impact", label: "My Impact Passes", icon: FileText },
    { id: "settings", label: "Account settings", icon: Globe },
  ];

  return (
    <div className="min-h-screen py-10 sm:py-14 px-4 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 1. PROFILE HEADER */}
        <section className="bg-surface border border-line rounded-md p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {/* Avatar Circle */}
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatars can be any https host
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
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-pine-700/10 text-lantern-600 border border-line-strong/20">
                  {roleLabel}
                </span>
                {user.artisanVerified && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-pine-500/10 text-pine-500 border border-pine-300/25">
                    Verified artisan
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 rounded-md border border-line-strong hover:border-line-strong text-lantern-600 hover:bg-paper-2 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit profile</span>
          </button>
        </section>

        {/* Responsive Navigation Selector */}
        {/* Mobile Dropdown View Switcher (<640px) */}
        <div className="sm:hidden space-y-1">
          <label className="text-xs font-bold text-ink-3">
            Select section
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            aria-label="Select profile section"
            className="w-full p-3 rounded-md bg-surface border border-line-strong text-sm font-medium text-ink min-h-[44px]"
          >
            {navigationItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tablet Horizontal Tabs (640px - 1023px) */}
        <div className="hidden sm:flex lg:hidden overflow-x-auto border-b border-line pb-1 gap-2">
          {navigationItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors min-h-[44px] ${
                  active
                    ? "bg-pine-700 text-white"
                    : "text-ink-3 hover:bg-paper-2 hover:text-ink"
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
          <aside className="hidden lg:block lg:col-span-4 space-y-1 bg-surface border border-line rounded-md p-3 h-fit">
            <div className="px-3 py-2 text-xs font-bold text-ink-3 border-b border-line mb-2">
              Profile sections
            </div>
            {navigationItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-md transition-colors text-left cursor-pointer min-h-[44px] ${
                    active
                      ? "bg-pine-700 text-white"
                      : "text-ink-3 hover:bg-paper-2 hover:text-ink"
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
              <section className="bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-line">
                  Personal info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-ink-3">
                      Full name
                    </p>
                    <p className="text-[15px] font-medium text-ink">
                      {user.fullName || "Not specified"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-ink-3">
                      Email address
                    </p>
                    <p className="text-[15px] font-mono-data text-ink truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-ink-3">
                      Region or location
                    </p>
                    <p className="text-[15px] font-medium text-ink">
                      {user.country || "Philippines"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-ink-3">
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
                <section className="bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6">
                  <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-line">
                    Cooperative record
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-ink-3">
                        {role === "lgu" ? "Municipal station" : "Cooperative name"}
                      </p>
                      <p className="text-[15px] font-medium text-ink">
                        {user.workshopName || user.stationName || translateSync("Not set yet. Add it with Edit profile.")}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-ink-3">
                        Verification
                      </p>
                      <div className="pt-0.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-pine-500/10 text-pine-500 border border-pine-300/25 inline-block">
                          {translateSync(role === "artisan" ? (user.artisanVerified ? "Verified artisan" : "Artisan") : role === "lgu" ? "Verified local government officer" : "Administrator")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-ink-3">
                        Materials handled
                      </p>
                      {materialsHandled.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {materialsHandled.map((material) => (
                            <span key={material} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-paper-2 text-ink border border-line">
                              {translateSync(material)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-ink-3">{translateSync("None yet.")}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-ink-3">
                        Country
                      </p>
                      <p className="text-[15px] font-medium text-ink">
                        {user.country || translateSync("Not set yet.")}
                      </p>
                    </div>
                  </div>
                </section>
              )}

            {/* 4. ACTIVITY SUMMARY SECTION */}
            {(activeTab === "activity" || activeTab === "all") && (
              <section className="bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-line">
                  Activity summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-paper-2 border border-line rounded-md space-y-1">
                    <p className="text-[12px] font-medium text-ink-3">
                      Batches scanned
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {totalBatchesScanned}
                    </p>
                  </div>

                  <div className="p-4 bg-paper-2 border border-line rounded-md space-y-1">
                    <p className="text-[12px] font-medium text-ink-3">
                      Orders completed
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">
                      {totalOrdersCompleted}
                    </p>
                  </div>

                  <div className="p-4 bg-paper-2 border border-line rounded-md space-y-1">
                    <p className="text-[12px] font-medium text-ink-3">
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
              <section className="bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h2 className="font-display text-xl font-medium text-ink">
                    {translateSync("Your Impact Passes")}
                  </h2>
                  <span className="text-xs font-mono-data text-ink-3">
                    {translateSync("Your purchases")}
                  </span>
                </div>

                <LoyaltyCard />

                {loadingData ? (
                  <p className="text-xs text-ink-3">{translateSync("Loading…")}</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-ink-2">
                    {translateSync("No purchases yet. Each piece you buy comes with a Verified Impact Pass, listed here.")}
                  </p>
                ) : (
                  <div id="passes" className="grid gap-8 md:grid-cols-2 scroll-mt-24">
                    {orders.map((order) => (
                      <div key={order.id} className="space-y-2">
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span aria-hidden>·</span>
                          <span>
                            {order.quantity} × {formatCurrency(order.unitPrice ?? order.amountPaid / (order.quantity || 1))}
                          </span>
                          <span aria-hidden>·</span>
                          <span className="font-medium text-ink-2">
                            {translateSync("Paid")} {formatCurrency(order.amountPaid)}
                          </span>
                        </p>
                        {order.pass ? (
                          <ImpactPassCard
                            serial={order.pass.serial}
                            verifyUrl={order.pass.qrPayload || `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${order.pass.serial}`}
                            title={order.product?.title ?? translateSync("Removed listing")}
                            maker={order.product?.maker ?? null}
                            origin={order.product?.origin ?? null}
                            kgDiverted={order.product ? order.product.kgDiverted * (order.quantity || 1) : null}
                            issuedAt={order.pass.issuedAt}
                          />
                        ) : (
                          <p className="rounded-md border border-dashed border-line-strong px-4 py-6 text-sm text-ink-3">
                            {translateSync("The pass for this order is still being issued.")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 6. ACCOUNT SETTINGS SECTION */}
            {(activeTab === "settings" || activeTab === "all") && (
              <section className="bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-medium text-ink pb-3 border-b border-line">
                  Account settings
                </h2>

                <div className="space-y-4">
                  {/* Language Selector row */}
                  <div className="flex items-center justify-between py-3 border-b border-line">
                    <div>
                      <p className="text-sm font-medium text-ink">Interface language</p>
                      <p className="text-xs text-ink-3">
                        Change the active UI translation across the platform
                      </p>
                    </div>
                    <LanguageSelector variant="compact" />
                  </div>

                  {/* Destructive Sign Out Button */}
                  <div className="pt-4">
                    <button
                      onClick={signOut}
                      className="w-full py-3 rounded-md bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
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

      {editModalOpen && <EditProfileModal onClose={() => setEditModalOpen(false)} />}
    </div>
  );
}
