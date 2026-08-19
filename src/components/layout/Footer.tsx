"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";

export function Footer() {
  const { translateSync } = useTranslation();

  return (
    <footer className="bg-[var(--forest-dark)] text-[#F4F7F4] border-t border-[var(--forest-mid)]/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-14 pb-8">
        {/* 4-Column Grid (Desktop 4-col, Tablet 2-col, Mobile 1-col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1 (Wide): Brand + 28px Logo */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-3.5">
            <Link href="/" className="inline-flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#8FBC8F]/60 bg-[#183324] flex items-center justify-center">
                <Image
                  src="/logo heritech.png"
                  alt="HeriTech Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <span className="font-display text-[24px] font-semibold text-[#8FBC8F] tracking-tight">
                HeriTech
              </span>
            </Link>

            <p className="text-[13px] text-[#F4F7F4]/90 max-w-sm leading-relaxed">
              {translateSync("Recovering festival materials across Asia, one cooperative at a time.")}
            </p>
          </div>

          {/* Column 2: Platform Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#8FBC8F] font-bold">
              {translateSync("Platform")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#F4F7F4]/85">
              <li>
                <Link href="/map" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Harvest Map")}
                </Link>
              </li>
              <li>
                <Link href="/scanner" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Material scanner")}
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Orders & Profile")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Regions */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#8FBC8F] font-bold">
              {translateSync("Regions")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#F4F7F4]/85">
              <li>
                <Link href="/map" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Philippines")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("India")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Thailand")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Indonesia")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Malaysia")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: About */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#8FBC8F] font-bold">
              {translateSync("About")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#F4F7F4]/85">
              <li>
                <Link href="/impact" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Impact ledger")}
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("Artisan cooperatives")}
                </Link>
              </li>
              <li>
                <Link href="/agreements" className="hover:underline hover:text-[#8FBC8F] transition-colors">
                  {translateSync("For LGU officers")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--forest-mid)]/60 flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#F4F7F4]/75 gap-2">
          <p>2026 HeriTech. {translateSync("All rights reserved.")}</p>
          <p>{translateSync("Powered by Gemini and Google Maps")}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
