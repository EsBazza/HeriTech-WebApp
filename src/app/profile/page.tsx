"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { DemoSignIn } from "@/components/auth/DemoSignIn";
import { useTranslation } from "@/contexts/TranslationContext";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { apiJson } from "@/lib/api";
import { ImpactPassCard } from "@/components/wallet/ImpactPassCard";
import { LoyaltyCard } from "@/components/wallet/LoyaltyCard";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ApplyRoleCard } from "@/components/profile/ApplyRoleCard";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { Badge, Button, Card, EmptyState, LinkButton, Skeleton, Spinner, Stat, cn } from "@/components/ui";
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
  Handshake,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { formatCurrency, formatNumber, formatDate, translateSync, currentLanguage } = useTranslation();

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

  // Open on what each role comes here for: a buyer's passes, a partner's activity.
  const userRole = user?.role;
  useEffect(() => {
    if (!userRole) return;
    const first = userRole === "buyer" ? "impact" : userRole === "artisan" || userRole === "lgu" ? "activity" : "personal";
    setActiveTab((tab) => (tab === "personal" ? first : tab));
  }, [userRole]);

  const [editModalOpen, setEditModalOpen] = useState(false);

  // Profile Data States
  const [artisanProducts, setArtisanProducts] = useState<ProductView[]>([]);
  const [lguBatches, setLguBatches] = useState<BatchView[]>([]);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [ordersError, setOrdersError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      // Only this user's own records: their purchases, plus listings or batches for their role.
      const userId = user.id;
      const role = user.role;
      Promise.all([
        apiJson<BuyerOrder[]>("/api/orders"),
        role === "artisan" ? apiJson<ProductView[]>(`/api/products?artisanId=${encodeURIComponent(userId)}`) : null,
        role === "lgu" ? apiJson<BatchView[]>("/api/materials?mine=scanned") : null,
      ]).then(([orderRes, productRes, batchRes]) => {
        if (orderRes.success) setOrders(orderRes.data ?? []);
        // A failed load must not look like "no passes" to someone who just paid.
        setOrdersError(!orderRes.success);
        if (productRes?.success) setArtisanProducts(productRes.data ?? []);
        if (batchRes?.success) setLguBatches(batchRes.data ?? []);
        setLoadingData(false);
      });
    }
  }, [user, reloadKey]);

  // Wait for Firebase before deciding, so signed-in users don't flash the sign-in card.
  if (authLoading) {
    return <Spinner label={translateSync("Loading your account…")} className="py-32" />;
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface border border-line rounded-md shadow-card p-8 space-y-6">
          <div className="text-center space-y-3">
            <span className="w-12 h-12 rounded-full bg-pine-100 text-brand flex items-center justify-center mx-auto">
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
                <CheckCircle2 className="w-4 h-4 text-brand-2 shrink-0 mt-0.5" />
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
          <DemoSignIn roles={["buyer", "artisan", "lgu", "admin"]} />
          <p className="text-xs text-ink-3 text-center">
            {translateSync("Just browsing?")}{" "}
            <Link href="/" className="text-brand-2 hover:text-brand font-medium">
              {translateSync("Explore the shop")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const role = user.role || "buyer";
  const roleLabel = translateSync(role === "artisan" ? "Artisan" : role === "lgu" ? "Local government officer" : role === "admin" ? "Administrator" : "Buyer");

  // Materials this user has actually worked with: tags on their listings, or batches they logged.
  const materialsHandled: string[] = [
    ...new Set<string>(role === "artisan" ? artisanProducts.flatMap((p) => p.materialTags ?? []) : lguBatches.map((b) => b.materialType)),
  ].slice(0, 8);

  // Activity stats from this user's own records, only the ones that apply to their role
  const purchasedKg = orders.reduce((acc, o) => acc + (o.product?.kgDiverted ?? 0) * (o.quantity ?? 1), 0);
  const totalKgDiverted =
    role === "artisan"
      ? artisanProducts.reduce((acc, p) => acc + (p.kgDiverted ?? 0), 0)
      : role === "lgu"
      ? lguBatches.reduce((acc, b) => acc + (b.weightKg ?? 0), 0)
      : purchasedKg;
  const activityStats = [
    ...(role === "lgu" ? [{ label: translateSync("Batches logged"), value: formatNumber(lguBatches.length) }] : []),
    ...(role === "artisan" ? [{ label: translateSync("Pieces listed"), value: formatNumber(artisanProducts.length) }] : []),
    { label: translateSync("Orders placed"), value: formatNumber(orders.length) },
    {
      label: translateSync(role === "lgu" ? "Material logged" : role === "artisan" ? "Material in your pieces" : "Material your purchases saved"),
      value: formatNumber(totalKgDiverted),
      unit: "kg",
    },
  ];

  const navigationItems = [
    { id: "impact", label: translateSync("Impact Passes"), icon: FileText },
    { id: "personal", label: translateSync("Personal info"), icon: User },
    ...(role === "buyer" ? [{ id: "partner", label: translateSync("Become a partner"), icon: Handshake }] : []),
    ...(role === "artisan" || role === "lgu" || role === "admin" ? [{ id: "cooperative", label: translateSync("Workshop or station"), icon: Layers }] : []),
    { id: "activity", label: translateSync("Activity"), icon: Sliders },
    { id: "settings", label: translateSync("Settings"), icon: Globe },
  ];

  const field = (label: string, value: React.ReactNode) => (
    <div className="space-y-1">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="text-[15px] font-medium text-ink break-words">{value}</dd>
    </div>
  );

  const sectionTitle = (title: string, aside?: React.ReactNode) => (
    <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-line">
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      {aside}
    </div>
  );

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <section className="ledger-band rounded-lg text-white p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatars can be any https host
              <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-line shrink-0" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-pine-700 text-white flex items-center justify-center font-display text-2xl font-semibold shrink-0">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </span>
            )}
            <div className="space-y-1.5 min-w-0">
              <h1 className="font-display text-[28px] sm:text-3xl font-semibold text-white leading-tight truncate">{user.fullName || translateSync("HeriTech member")}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="pine">{roleLabel}</Badge>
                {user.artisanVerified && (
                  <Badge tone="success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {translateSync("Verified artisan")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setEditModalOpen(true)} className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/15 hover:text-white">
            <Edit3 className="w-4 h-4" />
            {translateSync("Edit profile")}
          </Button>
          </div>
          {/* What this person has done on HeriTech, from their own records */}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activityStats.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-sm text-white/70">{s.label}</dt>
                <dd className="mt-1.5 tabular font-display text-[28px] leading-none font-semibold text-white">
                  {loadingData ? "—" : s.value}
                  {s.unit && <span className="ml-1.5 font-sans text-sm font-medium text-white/70">{s.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Section switcher: scrolling tabs on phones and tablets, a sidebar on desktop */}
        <nav
          aria-label={translateSync("Profile sections")}
          className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,black_88%,transparent)] sm:[mask-image:none]"
        >
          {navigationItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap border transition-colors cursor-pointer",
                  active ? "bg-pine-700 border-pine-700 text-white" : "bg-surface border-line text-ink-2 hover:border-pine-300"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <nav aria-label={translateSync("Profile sections")} className="hidden lg:block lg:col-span-4">
            <Card className="p-2 space-y-1 h-fit">
              {navigationItems.map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3.5 min-h-12 text-[15px] rounded-md transition-colors text-left cursor-pointer",
                      active ? "bg-pine-700 text-white font-medium" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                );
              })}
            </Card>
          </nav>

          <div className="lg:col-span-8 space-y-8">
            {activeTab === "personal" && (
              <Card className="p-5 sm:p-8 space-y-6">
                {sectionTitle(translateSync("Personal info"))}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {field(translateSync("Full name"), user.fullName || translateSync("Not set yet."))}
                  {field(translateSync("Email"), <span className="font-mono-data">{user.email}</span>)}
                  {field(translateSync("Country"), user.country ? translateSync(user.country) : translateSync("Not set yet."))}
                  {field(translateSync("Language"), currentLanguage?.name || "English")}
                </dl>
              </Card>
            )}

            {activeTab === "partner" && role === "buyer" && <ApplyRoleCard />}

            {activeTab === "cooperative" && (role === "artisan" || role === "lgu" || role === "admin") && (
              <Card className="p-5 sm:p-8 space-y-6">
                {sectionTitle(translateSync("Workshop or station"))}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {field(
                    translateSync(role === "lgu" ? "Municipal station" : "Workshop or cooperative"),
                    user.workshopName || user.stationName || translateSync("Not set yet. Add it with Edit profile.")
                  )}
                  {field(
                    translateSync("Verification"),
                    role === "admin" ? (
                      <Badge tone="pine">{translateSync("Administrator")}</Badge>
                    ) : user.verificationStatus === "approved" || (role === "artisan" && user.artisanVerified) ? (
                      <Badge tone="success">{translateSync(role === "artisan" ? "Verified artisan" : "Verified local government officer")}</Badge>
                    ) : (
                      <Badge tone="warn">{translateSync("Not verified yet")}</Badge>
                    )
                  )}
                  {field(
                    translateSync("Materials handled"),
                    materialsHandled.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5 pt-0.5">
                        {materialsHandled.map((material) => (
                          <Badge key={material}>{translateSync(material)}</Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-ink-3 font-normal">{translateSync("None yet.")}</span>
                    )
                  )}
                  {field(translateSync("Country"), user.country ? translateSync(user.country) : translateSync("Not set yet."))}
                </dl>
              </Card>
            )}

            {activeTab === "activity" && (
              <Card className="p-5 sm:p-8 space-y-6">
                {sectionTitle(translateSync("Activity"))}
                <div className={cn("grid grid-cols-1 gap-4", activityStats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                  {activityStats.map((s) => (
                    <div key={s.label} className="p-4 bg-paper border border-line rounded-md">
                      {loadingData ? <Skeleton className="h-14" /> : <Stat label={s.label} value={s.value} unit={s.unit} />}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "impact" && (
              <Card id="passes" className="p-5 sm:p-8 space-y-6 scroll-mt-24">
                {sectionTitle(
                  translateSync("Your Impact Passes"),
                  !loadingData && orders.length > 0 && (
                    <span className="text-sm text-ink-3 tabular">
                      {orders.length} {translateSync(orders.length === 1 ? "purchase" : "purchases")}
                    </span>
                  )
                )}

                <LoyaltyCard />

                {loadingData ? (
                  <div className="grid gap-6 md:grid-cols-2" role="status" aria-label={translateSync("Loading your passes")}>
                    <Skeleton className="h-72 rounded-lg" />
                    <Skeleton className="h-72 rounded-lg hidden md:block" />
                  </div>
                ) : ordersError ? (
                  <EmptyState
                    icon={<FileText className="w-5 h-5" />}
                    title={translateSync("Couldn't load your passes")}
                    description={translateSync("Your passes are safe in the public record. Check your connection and try again.")}
                    action={
                      <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
                        {translateSync("Try again")}
                      </Button>
                    }
                  />
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-5 h-5" />}
                    title={translateSync("No passes yet")}
                    description={translateSync("Each piece you buy comes with a Verified Impact Pass that shows where its material came from. It appears here.")}
                    action={<LinkButton href="/#shop">{translateSync("Browse the shop")}</LinkButton>}
                  />
                ) : (
                  <div className="grid gap-8 md:grid-cols-2">
                    {orders.map((order) => (
                      <div key={order.id} className="space-y-2">
                        <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-3">
                          <span>{formatDate(new Date(order.createdAt))}</span>
                          <span aria-hidden>·</span>
                          {order.paymentMode === "free_claim" ? (
                            <span className="font-medium text-ink-2">{translateSync("Claimed free at the HeriTech booth")}</span>
                          ) : (
                            <>
                              <span className="tabular">
                                {order.quantity} × {formatCurrency(order.unitPrice ?? order.amountPaid / (order.quantity || 1))}
                              </span>
                              <span aria-hidden>·</span>
                              <span className="font-medium text-ink-2 tabular">
                                {translateSync("Paid")} {formatCurrency(order.amountPaid)}
                              </span>
                            </>
                          )}
                        </p>
                        {order.pass ? (
                          <ImpactPassCard
                            serial={order.pass.serial}
                            verifyUrl={order.pass.qrPayload || `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${order.pass.serial}`}
                            title={order.product?.title ?? translateSync("Removed listing")}
                            image={order.product?.image ?? null}
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
              </Card>
            )}

            {activeTab === "settings" && (
              <Card className="p-5 sm:p-8 space-y-6">
                {sectionTitle(translateSync("Settings"))}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-line">
                  <div>
                    <p className="text-[15px] font-medium text-ink">{translateSync("Language")}</p>
                    <p className="text-sm text-ink-3">{translateSync("Changes the language across HeriTech on this device.")}</p>
                  </div>
                  <LanguageSelector />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-line">
                  <div>
                    <p className="text-[15px] font-medium text-ink">{translateSync("Appearance")}</p>
                    <p className="text-sm text-ink-3">{translateSync("Auto follows your phone's setting.")}</p>
                  </div>
                  <ThemeSwitch />
                </div>
                <Button variant="secondary" onClick={signOut} className="w-full text-danger hover:text-danger hover:border-danger">
                  <LogOut className="w-4 h-4" />
                  {translateSync("Sign out of HeriTech")}
                </Button>
                {user.role !== "admin" && !user.isDemo && (
                  <div className="space-y-2 pt-5 border-t border-line">
                    <p className="text-[15px] font-medium text-ink">{translateSync("Delete account")}</p>
                    <p className="text-sm text-ink-3">{translateSync("Permanently remove your account and personal data from HeriTech.")}</p>
                    <DeleteAccount />
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {editModalOpen && <EditProfileModal onClose={() => setEditModalOpen(false)} />}
    </div>
  );
}
