"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";

export function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const role = userRole(user);

  const canAccessMap = role === "artisan" || role === "lgu" || role === "admin";
  const canAccessStudio = role === "artisan" || role === "admin";
  const canAccessScanner = role === "lgu";
  const canAccessAdmin = role === "admin";
  const isBuyerOnly = role === "buyer";

  const allTabs = [
    {
      id: "home",
      name: translateSync("Home"),
      href: "/",
      show: true,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? "currentColor" : "none"}
            fillOpacity={active ? "0.15" : "0"}
          />
        </svg>
      ),
    },
    {
      id: "impact",
      name: translateSync("Impact"),
      href: "/impact",
      show: true,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M18 20V10M12 20V4M6 20v-6"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "map",
      name: translateSync("Map"),
      href: "/map",
      show: canAccessMap,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M12 21s-7-5.5-7-11.5a7 7 0 1 1 14 0C19 15.5 12 21 12 21z"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? "currentColor" : "none"}
            fillOpacity={active ? "0.15" : "0"}
          />
          <circle
            cx="12"
            cy="9.5"
            r="2.5"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            fill={active ? "currentColor" : "none"}
          />
        </svg>
      ),
    },
    {
      id: "studio",
      name: translateSync("Studio"),
      href: "/studio",
      show: canAccessStudio,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? "currentColor" : "none"}
            fillOpacity={active ? "0.15" : "0"}
          />
        </svg>
      ),
    },
    {
      id: "scanner",
      name: translateSync("Scanner"),
      href: "/scanner",
      show: canAccessScanner,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth={active ? "2.2" : "1.75"} strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "messages",
      name: translateSync("Messages"),
      href: "/messages",
      show: isBuyerOnly,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? "currentColor" : "none"}
            fillOpacity={active ? "0.15" : "0"}
          />
        </svg>
      ),
    },
    {
      id: "admin",
      name: translateSync("Admin"),
      href: "/admin",
      show: canAccessAdmin,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? "currentColor" : "none"}
            fillOpacity={active ? "0.15" : "0"}
          />
        </svg>
      ),
    },
    {
      id: "profile",
      name: user ? translateSync("Profile") : translateSync("Account"),
      href: "/profile",
      show: true,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth={active ? "2.2" : "1.75"}
            fill={active ? "currentColor" : "none"}
            fillOpacity={active ? "0.15" : "0"}
          />
        </svg>
      ),
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.show);

  return (
    <nav
      aria-label="Mobile navigation bar"
      className="fixed bottom-0 left-0 right-0 z-50 block md:hidden bg-[#F4F8F5]/95 backdrop-blur-xl border-t border-[#D8E6DC] shadow-[0_-4px_24px_rgba(20,56,38,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+4px)] pt-1"
    >
      <div
        className="grid w-full h-14 max-w-lg mx-auto px-1 items-center"
        style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          if (tab.id === "messages") {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-messages"));
                }}
                className="relative flex flex-col items-center justify-center min-h-[48px] py-1 px-0.5 transition-all duration-200 rounded-lg select-none text-[#5B8870] hover:text-[#1E4D34] active:scale-95 cursor-pointer"
              >
                <div className="p-1 rounded-full flex items-center justify-center transition-colors bg-transparent">
                  {tab.icon(false)}
                </div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider leading-none mt-1 truncate max-w-full font-semibold text-[#5B8870]">
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 px-0.5 transition-all duration-200 rounded-lg select-none ${
                isActive
                  ? "text-[#1E4D34]"
                  : "text-[#5B8870] hover:text-[#1E4D34] active:scale-95"
              }`}
            >
              {/* Active Top Glow Pill Indicator */}
              {isActive && (
                <span className="absolute top-0.5 w-6 h-1 rounded-full bg-[#2E6B4A] shadow-xs" />
              )}
              
              <div
                className={`p-1 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? "bg-[#E4EFE7]" : "bg-transparent"
                }`}
              >
                {tab.icon(isActive)}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] uppercase tracking-wider leading-none mt-1 truncate max-w-full ${
                  isActive ? "font-extrabold text-[#1E4D34]" : "font-semibold text-[#5B8870]"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabBar;
