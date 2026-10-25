"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronDown,
  FileSignature,
  Info,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Palette,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/context/CartContext";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { ThemeSwitch, ThemeToggleButton } from "@/components/ThemeSwitch";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { buttonClass, cn, Dialog, IconButton } from "@/components/ui";
import { apiJson } from "@/lib/api";
import { countUnreadThreads, type ServerMessage } from "@/components/MessagesPanel";

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
    <Link href="/" className="nav-logo group flex items-center gap-2.5 shrink-0" aria-label="HeriTech home">
      <Image src="/logo_heritech-removebg-preview.png" alt="" width={36} height={36} className="logo-plate nav-logo-mark w-9 h-9 object-contain" priority />
      <span className="font-display text-[20px] min-[360px]:text-[23px] font-semibold text-ink leading-none tracking-[-0.01em]">HeriTech</span>
    </Link>
  );
}

function CartButton() {
  const { itemCount, setIsCartOpen } = useCart();
  const { translateSync } = useTranslation();
  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative w-11 h-11 rounded-md flex items-center justify-center text-ink-2 hover:bg-pine-50 hover:text-ink transition-colors cursor-pointer"
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

/** How often the header checks for new buyer messages while the panel is closed. */
const CHATS_POLL_MS = 30_000;

/**
 * Artisans sell rather than buy, so their header has Chats where buyers have the cart:
 * it opens their buyer conversations and shows how many have a reply waiting.
 */
function ChatsButton() {
  const { user } = useAuth();
  const { translateSync, translateTemplate } = useTranslation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const result = await apiJson<ServerMessage[]>("/api/messages");
      if (alive && result.success) setUnread(countUnreadThreads(result.data ?? [], user.id));
    };
    check();
    const timer = setInterval(check, CHATS_POLL_MS);
    // Reading in the panel clears the count; a fresh check once it is opened catches up.
    const onOpen = () => setUnread(0);
    window.addEventListener("open-messages", onOpen);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("open-messages", onOpen);
    };
  }, [user]);

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-messages"))}
      className="relative h-11 pl-2.5 pr-2.5 md:pr-3.5 rounded-full flex items-center gap-2 text-ink-2 hover:bg-pine-50 hover:text-ink transition-colors cursor-pointer"
      aria-label={unread > 0 ? translateTemplate("Chats, {count} new", { count: unread }) : translateSync("Chats")}
    >
      <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
      <span className="hidden md:inline text-[15px] font-medium">{translateSync("Chats")}</span>
      {unread > 0 && (
        <span className="chats-badge absolute top-1 left-6 min-w-[18px] h-[18px] px-1 rounded-full bg-lantern text-white text-xs font-semibold leading-[18px] text-center tabular">
          {unread}
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
    return <div className="w-9 h-9 rounded-full border-2 border-brand-line border-t-pine-700 animate-spin" aria-label="Loading account" />;
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
          {/* Top-bar links that don't fit yet appear here, then the ones that never sit in the bar */}
          {[
            ...roleLinks(role, translateSync).filter((l) => l.primary).map((l, i) => ({ ...l, fold: menuFoldClass(i) })),
            ...roleLinks(role, translateSync).filter((l) => !l.primary).map((l) => ({ ...l, fold: "" })),
          ]
            .filter((l) => l.fold !== "hidden")
            .map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className={cn("flex items-center gap-2.5 px-4 h-10 text-sm text-ink-2 hover:bg-pine-50", l.fold)} role="menuitem">
                <l.icon className="w-4 h-4 text-ink-3" />
                {l.name}
              </Link>
            ))}

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
                        "min-h-11 px-2 rounded-sm text-xs font-medium flex items-center justify-between cursor-pointer border",
                        current ? "bg-pine-100 border-brand-line text-brand" : "border-line text-ink-2 hover:border-pine-300"
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

/** Pages each role can open. Map → artisan/lgu/admin, studio → artisan/admin, scanner and agreements → lgu/admin. */
function roleLinks(role: string, t: (s: string) => string) {
  return [
    { name: t("Shop"), href: "/", icon: Store, show: true, primary: true },
    { name: t("Impact"), href: "/impact", icon: BarChart3, show: true, primary: true },
    { name: t("About"), href: "/about", icon: Info, show: true, primary: true },
    { name: t("Material map"), href: "/map", icon: MapPin, show: role === "artisan" || role === "lgu" || role === "admin", primary: true },
    { name: t("Studio"), href: "/studio", icon: Palette, show: role === "artisan" || role === "admin", primary: true },
    { name: t("Scanner"), href: "/scanner", icon: ScanLine, show: role === "lgu" || role === "admin", primary: true },
    { name: t("Pickup"), href: "/handover", icon: QrCode, show: role === "artisan" || role === "lgu" || role === "admin", primary: false },
    { name: t("Agreements"), href: "/agreements", icon: FileSignature, show: role === "lgu" || role === "admin", primary: role === "lgu" },
    { name: t("Admin console"), href: "/admin", icon: ShieldCheck, show: role === "admin", primary: true },
  ].filter((l) => l.show);
}

// The top bar holds three links on a tablet, four from 1024px and all of them from 1280px;
// the rest wait in the account menu until there is room.
function barFoldClass(i: number) {
  return i < 3 ? "flex" : i === 3 ? "hidden lg:flex" : "hidden xl:flex";
}
function menuFoldClass(i: number) {
  return i < 3 ? "hidden" : i === 3 ? "lg:hidden" : "xl:hidden";
}

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/products") : pathname.startsWith(href);
}

/** Phones only: everything the desktop header and account menu hold, in one sheet. */
function MobileMenu() {
  const pathname = usePathname();
  const { user, loading, demoMode, signInWithGoogle, signInAsDemo, signOut } = useAuth();
  const { translateSync } = useTranslation();
  const [open, setOpen] = useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const role = userRole(user);
  // Guests already have the sign-in button at the top of the sheet.
  const links = [...roleLinks(role, translateSync), ...(user ? [{ name: translateSync("Profile & passes"), href: "/profile", icon: User }] : [])];

  // Close when a link navigates.
  useEffect(() => close(), [pathname, close]);

  return (
    <>
      <IconButton aria-label={translateSync("Open menu")} aria-expanded={open} onClick={() => setOpen(true)} className="md:hidden">
        <Menu className="w-5 h-5" />
      </IconButton>
      <Dialog open={open} onClose={close} title={translateSync("Menu")} closeLabel={translateSync("Close")} size="sm">
        {loading ? (
          <div className="h-16 rounded-md bg-paper-2 animate-pulse" aria-hidden />
        ) : user ? (
          <div className="flex items-center gap-3 p-3 rounded-md bg-paper">
            <span className="w-11 h-11 rounded-full bg-pine-700 text-white text-sm font-semibold flex items-center justify-center shrink-0">
              {(user.fullName || user.email || "U").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-ink truncate">{user.fullName}</p>
              <p className="text-sm text-ink-3 truncate">{translateSync(ROLE_LABELS[role] ?? role)}</p>
            </div>
          </div>
        ) : (
          <button onClick={signInWithGoogle} className={buttonClass("primary", "lg", "w-full")}>
            {translateSync("Sign in with Google")}
          </button>
        )}

        <nav aria-label={translateSync("Menu")} className="menu-stagger mt-4 -mx-2">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 min-h-12 rounded-md text-[16px] transition-colors",
                  active ? "bg-pine-50 text-brand font-medium" : "text-ink-2 hover:bg-pine-50"
                )}
              >
                <Icon className="w-5 h-5 text-ink-3 shrink-0" strokeWidth={1.75} />
                {link.name}
              </Link>
            );
          })}
          <button
            onClick={() => {
              close();
              window.dispatchEvent(new CustomEvent("open-messages"));
            }}
            className="w-full flex items-center gap-3 px-3 min-h-12 rounded-md text-[16px] text-ink-2 hover:bg-pine-50 cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-ink-3 shrink-0" strokeWidth={1.75} />
            {translateSync(role === "artisan" ? "Chats with buyers" : "Messages and assistant")}
          </button>
        </nav>

        {demoMode && (
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-sm text-ink-3 pb-2">{translateSync(user ? "Demo: switch account" : "Demo accounts for presentations")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((r) => {
                const current = user?.id === DEMO_ACCOUNTS[r];
                return (
                  <button
                    key={r}
                    onClick={() => {
                      close();
                      if (!current) signInAsDemo(r);
                    }}
                    aria-pressed={current}
                    className={cn(
                      "min-h-11 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between gap-2 text-left cursor-pointer border",
                      current ? "bg-pine-100 border-brand-line text-brand" : "border-line text-ink-2 hover:border-pine-300"
                    )}
                  >
                    {translateSync(ROLE_LABELS[r])}
                    {current && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-2">{translateSync("Appearance")}</span>
          <ThemeSwitch />
        </div>

        {user && (
          <button
            onClick={() => {
              close();
              signOut();
            }}
            className="mt-4 w-full flex items-center gap-3 px-3 min-h-12 rounded-md text-[16px] text-danger hover:bg-danger-100 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            {translateSync("Sign out")}
          </button>
        )}
      </Dialog>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const role = userRole(user);

  const navLinks = roleLinks(role, translateSync).filter((l) => l.primary);
  const isActive = (href: string) => isActivePath(pathname, href);

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Out of the way while reading down the page, back as soon as you scroll up
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 160);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // One underline that slides to the hovered link and settles back on the current page
  const navRef = useRef<HTMLElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number; on: boolean }>({ x: 0, w: 0, on: false });
  const moveBar = (el: HTMLElement | null) => {
    if (!el || !navRef.current) return setBar((b) => ({ ...b, on: false }));
    const nav = navRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setBar({ x: r.left - nav.left + 12, w: r.width - 24, on: true });
  };
  const settleBar = () => moveBar(navRef.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? null);
  useEffect(() => {
    settleBar();
    window.addEventListener("resize", settleBar);
    return () => window.removeEventListener("resize", settleBar);
    // Re-measure whenever the page or the links change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navLinks.length, translateSync]);

  return (
    <header data-scrolled={scrolled} data-hidden={hidden} className="site-header sticky top-0 z-40 bg-paper pt-[env(safe-area-inset-top,0px)]">
      <div className="site-header-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3 sm:gap-6">
        <Logo />

        <nav ref={navRef} onMouseLeave={settleBar} className="relative hidden md:flex items-center gap-1 h-full" aria-label="Main">
          <span
            aria-hidden
            className="nav-bar absolute bottom-0 left-0 h-[3px] rounded-full bg-brand"
            style={{ transform: `translateX(${bar.x}px)`, width: bar.w, opacity: bar.on ? 1 : 0 }}
          />
          {navLinks.map((link, i) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={(e) => moveBar(e.currentTarget)}
                onFocus={(e) => moveBar(e.currentTarget)}
                onBlur={settleBar}
                className={cn(
                  "nav-link relative h-full px-3 items-center text-[16px] transition-colors",
                  barFoldClass(i),
                  active ? "text-ink font-medium" : "text-ink-2 hover:text-ink"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <ThemeToggleButton className="hidden md:inline-flex" />
          <LanguageSelector />
          {role === "artisan" ? <ChatsButton /> : <CartButton />}
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
