"use client";

import React from "react";
import Link from "next/link";
import { WeaveDivider } from "@/components/WeaveDivider";

export function Footer() {
  return (
    <footer className="bg-[var(--bark)] text-[var(--linen)]">
      {/* Full-width weave band as top border (24px tall) */}
      <WeaveDivider height={24} bgColor="#3D2B1F" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 pb-7">
        {/* 4-Column Grid (Desktop 4-col, Tablet 2-col, Mobile 1-col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1 (Wide): Brand */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-display text-[22px] font-semibold text-[#C8A96A] tracking-tight">
                HeriTech
              </span>
            </Link>

            <p className="text-[13px] text-[var(--sage)] max-w-sm leading-relaxed">
              Recovering festival materials across Asia, one cooperative at a time.
            </p>

            {/* Embedded 12px Hand-Woven SVG Band below tagline */}
            <div className="pt-1 max-w-[240px]">
              <WeaveDivider height={12} bgColor="#3D2B1F" />
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#C8A96A] font-bold">
              Platform
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#EDE0C4]/65">
              <li>
                <Link href="/map" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Harvest map
                </Link>
              </li>
              <li>
                <Link href="/scanner" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Material scanner
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/messages" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Regions */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#C8A96A] font-bold">
              Regions
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#EDE0C4]/65">
              <li>
                <Link href="/map" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Philippines
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  India
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Thailand
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Indonesia
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Malaysia
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: About */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#C8A96A] font-bold">
              About
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#EDE0C4]/65">
              <li>
                <Link href="/#marketplace-grid" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Artisan cooperatives
                </Link>
              </li>
              <li>
                <Link href="/agreements" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  For LGU officers
                </Link>
              </li>
              <li>
                <Link href="/messages" className="hover:underline hover:text-[#C8A96A] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar Separated by Single 1px Gold Line */}
        <div className="mt-10 pt-5 border-t border-[#C8A96A]/15 flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#B0C4AB]/50 gap-2">
          <p>2026 HeriTech. All rights reserved.</p>
          <p>Powered by Gemini and Google Maps</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
