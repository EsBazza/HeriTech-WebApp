"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, BarChart3, FileSignature, MapPin, Palette, QrCode, ScanLine, MessageSquare, ShieldCheck, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import { cn } from "@/components/ui";

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Dispatches a window event instead of navigating. */
  event?: string;
}

// At most five tabs, ordered by each role's demo path. Everything else is in the header menu.
const TABS_BY_ROLE: Record<string, string[]> = {
  buyer: ["home", "impact", "messages", "profile"],
  artisan: ["home", "map", "handover", "studio", "profile"],
  lgu: ["map", "scanner", "handover", "agreements", "profile"],
  admin: ["home", "map", "scanner", "admin", "profile"],
};
const GUEST_TABS = ["home", "impact", "profile"];

export function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const role = userRole(user);
  // Set when the maker's message arrives after checkout; cleared when Messages opens.
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const onNew = () => setHasNew(true);
    const onOpen = () => setHasNew(false);
    window.addEventListener("new-message", onNew);
    window.addEventListener("open-messages", onOpen);
    return () => {
      window.removeEventListener("new-message", onNew);
      window.removeEventListener("open-messages", onOpen);
    };
  }, []);

  const all: Record<string, Tab> = {
    home: { name: translateSync("Shop"), href: "/", icon: Store },
    impact: { name: translateSync("Impact"), href: "/impact", icon: BarChart3 },
    map: { name: translateSync("Map"), href: "/map", icon: MapPin },
    scanner: { name: translateSync("Scan"), href: "/scanner", icon: ScanLine },
    handover: { name: translateSync("Pickup"), href: "/handover", icon: QrCode },
    agreements: { name: translateSync("Agreements"), href: "/agreements", icon: FileSignature },
    studio: { name: translateSync("Studio"), href: "/studio", icon: Palette },
    admin: { name: translateSync("Admin"), href: "/admin", icon: ShieldCheck },
    messages: { name: translateSync("Messages"), href: "/messages", icon: MessageSquare, event: "open-messages" },
    profile: { name: user ? translateSync("Me") : translateSync("Sign in"), href: "/profile", icon: User },
  };
  const tabs = (TABS_BY_ROLE[role] ?? GUEST_TABS).map((id) => ({ id, ...all[id] }));

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/products") : pathname.startsWith(href));
  const activeIndex = tabs.findIndex((t) => !t.event && isActive(t.href));

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface shadow-[0_-8px_24px_-16px_rgb(20_40_30/0.35)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="relative grid h-16 max-w-lg mx-auto" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {/* One indicator that slides to the active tab */}
        {activeIndex >= 0 && (
          <span
            className="absolute top-0 h-0.5 transition-[left] duration-300 ease-sheet"
            style={{ left: `${(activeIndex / tabs.length) * 100}%`, width: `${100 / tabs.length}%` }}
            aria-hidden
          >
            <span className="block mx-auto w-1/2 h-full rounded-full bg-brand" />
          </span>
        )}
        {tabs.map((tab) => {
          const active = !tab.event && isActive(tab.href);
          const Icon = tab.icon;
          const dot = tab.event === "open-messages" && hasNew;
          const inner = (
            <>
              <span className={cn("relative transition-transform duration-200", active && "-translate-y-0.5")}>
                <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.1 : 1.75} />
                {dot && <span className="absolute -top-0.5 -right-1 h-2.5 w-2.5 rounded-full bg-lantern ring-2 ring-surface" aria-hidden />}
              </span>
              <span className={cn("text-xs leading-none mt-1.5 truncate max-w-full px-1", active && "font-semibold")}>{tab.name}</span>
            </>
          );
          const cls = cn(
            "relative flex flex-col items-center justify-center transition-colors cursor-pointer",
            active ? "text-brand" : "text-ink-3 hover:text-ink"
          );

          return tab.event ? (
            <button
              key={tab.id}
              type="button"
              className={cls}
              aria-label={dot ? `${tab.name}: ${translateSync("New message")}` : undefined}
              onClick={() => window.dispatchEvent(new CustomEvent(tab.event!))}
            >
              {inner}
            </button>
          ) : (
            <Link key={tab.id} href={tab.href} aria-current={active ? "page" : undefined} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabBar;
