"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, BarChart3, MapPin, Palette, ScanLine, MessageSquare, ShieldCheck, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import { cn } from "@/components/ui";

interface Tab {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  show: boolean;
  /** Dispatches a window event instead of navigating. */
  event?: string;
}

export function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const role = userRole(user);

  const roleTabs: Tab[] = [
    { id: "studio", name: translateSync("Studio"), href: "/studio", icon: Palette, show: role === "artisan" || role === "admin" },
    { id: "scanner", name: translateSync("Scanner"), href: "/scanner", icon: ScanLine, show: role === "lgu" },
    { id: "map", name: translateSync("Map"), href: "/map", icon: MapPin, show: role === "artisan" || role === "lgu" },
    { id: "admin", name: translateSync("Admin"), href: "/admin", icon: ShieldCheck, show: role === "admin" },
    { id: "messages", name: translateSync("Messages"), href: "/messages", icon: MessageSquare, show: role === "buyer", event: "open-messages" },
  ];

  // Max five tabs: Shop, Impact, up to two role tabs, Profile.
  const tabs: Tab[] = [
    { id: "home", name: translateSync("Shop"), href: "/", icon: Store, show: true },
    { id: "impact", name: translateSync("Impact"), href: "/impact", icon: BarChart3, show: true },
    ...roleTabs.filter((t) => t.show).slice(0, 2),
    { id: "profile", name: user ? translateSync("Profile") : translateSync("Sign in"), href: "/profile", icon: User, show: true },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/products") : pathname.startsWith(href));

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid h-16 max-w-lg mx-auto" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const active = !tab.event && isActive(tab.href);
          const Icon = tab.icon;
          const inner = (
            <>
              {active && <span className="absolute top-0 inset-x-1/4 h-0.5 rounded-full bg-pine-700" />}
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.1 : 1.75} />
              <span className={cn("text-xs leading-none mt-1.5 truncate max-w-full px-1", active && "font-semibold")}>{tab.name}</span>
            </>
          );
          const cls = cn(
            "relative flex flex-col items-center justify-center transition-colors cursor-pointer",
            active ? "text-pine-700" : "text-ink-3 hover:text-ink"
          );

          return tab.event ? (
            <button key={tab.id} type="button" className={cls} onClick={() => window.dispatchEvent(new CustomEvent(tab.event!))}>
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
