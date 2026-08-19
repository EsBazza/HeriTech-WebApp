"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Home",
      href: "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
            stroke={active ? "#C8A96A" : "#B0C4AB"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Map",
      href: "/map",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21s-7-5.5-7-11.5a7 7 0 1 1 14 0C19 15.5 12 21 12 21z"
            stroke={active ? "#C8A96A" : "#B0C4AB"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="9.5"
            r="2.5"
            stroke={active ? "#C8A96A" : "#B0C4AB"}
            strokeWidth="1.75"
          />
        </svg>
      ),
    },
    {
      name: "Ledger",
      href: "/impact",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 20V10M12 20V4M6 20v-6"
            stroke={active ? "#C8A96A" : "#B0C4AB"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: "/profile",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={active ? "#C8A96A" : "#B0C4AB"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke={active ? "#C8A96A" : "#B0C4AB"}
            strokeWidth="1.75"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation bar"
      className="fixed bottom-0 left-0 right-0 h-14 bg-[#3D2B1F] border-t border-[#C8A96A]/15 z-40 block md:hidden shadow-lg"
    >
      <div className="grid grid-cols-4 h-full">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
                isActive ? "text-[#C8A96A]" : "text-[#B0C4AB] hover:text-[#C8A96A]"
              }`}
            >
              <div className="flex items-center justify-center">
                {tab.icon(isActive)}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold mt-0.5 ${
                  isActive ? "text-[#C8A96A]" : "text-[#B0C4AB]"
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
