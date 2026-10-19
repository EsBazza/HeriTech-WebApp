"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, ShoppingBag, User, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/context/CartContext";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { cn } from "@/components/ui";

type DemoRole = keyof typeof DEMO_ACCOUNTS;

const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer",
  artisan: "Artisan",
  lgu: "Local government officer",
  admin: "Admin",
  guest: "Guest",
};

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="HeriTech home">
      <Image src="/logo_heritech-removebg-preview.png" alt="" width={36} height={36} className="w-9 h-9 object-contain" priority />
      <span className="font-display text-[22px] font-semibold text-ink leading-none">HeriTech</span>
    </Link>
  );
}

function CartButton() {
  const { itemCount, setIsCartOpen } = useCart();
  const { translateSync } = useTranslation();
  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative w-10 h-10 rounded-md flex items-center justify-center text-ink-2 hover:bg-pine-50 hover:text-ink transition-colors cursor-pointer"
      aria-label={`${translateSync("Open cart")} (${itemCount})`}
    >
      <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
      {itemCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-lantern text-white text-xs font-semibold leading-[18px] text-center tabular">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function AccountMenu() {
  const { user, loading, demoMode, signInWithGoogle, signInAsDemo, signOut } = useAuth();
  const { translateSync } = useTranslation();
  const [open, setOpen] = useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const role = userRole(user);

  if (loading) {
    return <div className="w-9 h-9 rounded-full border-2 border-pine-200 border-t-pine-700 animate-spin" aria-label="Loading account" />;
  }

  if (!user) {
    if (!demoMode) {
      return (
        <button
          onClick={signInWithGoogle}
          className="h-10 px-4 rounded-md bg-pine-700 text-white text-sm font-medium hover:bg-pine-600 transition-colors cursor-pointer"
        >
          {translateSync("Sign in")}
        </button>
      );
    }

    return (
      <div className="relative" ref={ref}>
        <div className="flex items-center rounded-md bg-pine-700 text-white">
          <button
            onClick={signInWithGoogle}
            className="h-10 pl-4 pr-3 text-sm font-medium hover:bg-pine-600 rounded-l-md transition-colors cursor-pointer"
          >
            {translateSync("Sign in")}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-10 px-2 border-l border-white/20 hover:bg-pine-600 rounded-r-md transition-colors cursor-pointer"
            aria-label={translateSync("Demo accounts")}
            aria-expanded={open}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-surface rounded-md border border-line shadow-pop p-2 z-50">
            <p className="px-2 pt-1 pb-2 text-xs text-ink-3">{translateSync("Demo accounts for presentations")}</p>
            {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  close();
                  signInAsDemo(r);
                }}
                className="w-full flex items-center gap-2.5 px-2 h-10 rounded-sm text-sm text-ink-2 hover:bg-pine-50 cursor-pointer"
              >
                {r === "admin" ? <ShieldCheck className="w-4 h-4 text-ink-3" /> : <User className="w-4 h-4 text-ink-3" />}
                {translateSync("Demo")} {translateSync(ROLE_LABELS[r])}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const initials = (user.fullName || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-md hover:bg-pine-50 transition-colors cursor-pointer"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="w-8 h-8 rounded-full bg-pine-700 text-white text-xs font-semibold flex items-center justify-center">{initials}</span>
        <span className="hidden lg:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-ink truncate max-w-[120px]">{user.fullName}</span>
          <span className="text-xs text-ink-3">{translateSync(ROLE_LABELS[role] ?? role)}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-ink-3" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-surface rounded-md border border-line shadow-pop py-2 z-50" role="menu">
          <div className="px-4 pb-3 border-b border-line">
            <p className="text-sm font-medium text-ink truncate">{user.fullName}</p>
            <p className="text-xs text-ink-3 truncate">{user.email}</p>
          </div>

          <Link href="/profile" onClick={close} className="flex items-center gap-2.5 px-4 h-10 text-sm text-ink-2 hover:bg-pine-50" role="menuitem">
            <User className="w-4 h-4 text-ink-3" />
            {translateSync("Profile & passes")}
          </Link>
          {role === "admin" && (
            <Link href="/admin" onClick={close} className="flex items-center gap-2.5 px-4 h-10 text-sm text-ink-2 hover:bg-pine-50" role="menuitem">
              <ShieldCheck className="w-4 h-4 text-ink-3" />
              {translateSync("Admin console")}
            </Link>
          )}

          {demoMode && (
            <div className="border-t border-line mt-2 pt-2 px-4">
              <p className="text-xs text-ink-3 pb-1.5">{translateSync("Demo: switch account")}</p>
              <div className="grid grid-cols-2 gap-1">
                {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((r) => {
                  const current = user.id === DEMO_ACCOUNTS[r];
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        close();
                        if (!current) signInAsDemo(r);
                      }}
                      className={cn(
                        "h-8 px-2 rounded-sm text-xs font-medium flex items-center justify-between cursor-pointer border",
                        current ? "bg-pine-100 border-pine-200 text-pine-700" : "border-line text-ink-2 hover:border-pine-300"
                      )}
                    >
                      {translateSync(ROLE_LABELS[r])}
                      {current && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-line mt-2 pt-2">
            <button
              onClick={() => {
                close();
                signOut();
              }}
              className="w-full flex items-center gap-2.5 px-4 h-10 text-sm text-danger hover:bg-danger-100 cursor-pointer"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              {translateSync("Sign out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const role = userRole(user);

  // Role rules unchanged: map → artisan/lgu/admin, studio → artisan/admin, scanner → lgu/admin
  const navLinks = [
    { name: translateSync("Shop"), href: "/", show: true },
    { name: translateSync("Impact"), href: "/impact", show: true },
    { name: translateSync("Material map"), href: "/map", show: role === "artisan" || role === "lgu" || role === "admin" },
    { name: translateSync("Studio"), href: "/studio", show: role === "artisan" || role === "admin" },
    { name: translateSync("Scanner"), href: "/scanner", show: role === "lgu" || role === "admin" },
  ].filter((l) => l.show);

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/products") : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 h-full" aria-label="Main">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative h-full px-3 flex items-center text-[15px] transition-colors",
                  active ? "text-ink font-medium" : "text-ink-3 hover:text-ink"
                )}
              >
                {link.name}
                {active && <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-pine-700 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSelector variant="compact" />
          <CartButton />
          <div className="hidden md:block">
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
