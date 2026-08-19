"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import { WeaveDivider } from "@/components/WeaveDivider";
import { Shield, Sparkles, MapPin, Camera, Palette, FileCheck2, BarChart3 } from "lucide-react";

export function Footer() {
  const { translateSync } = useTranslation();

  return (
    <footer className="bg-[var(--bark)] text-[var(--linen)]">
      {/* Top Border Weave Divider */}
      <WeaveDivider height={16} bgColor="#2C1A0E" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[2px] bg-[#6B4226] border border-[#C9A96E]/40 flex items-center justify-center">
                <span className="font-display text-lg font-bold text-[#C9A96E]">H</span>
              </div>
              <span className="font-display text-2xl font-semibold text-[#C9A96E] tracking-tight">
                Heri<span className="font-normal text-[#E8D8B0]">Tech</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded-[1px] bg-[#6B4226]/50 text-[#C9A96E] border border-[#C9A96E]/30">
                V4
              </span>
            </div>

            <p className="text-xs text-[#A8BFA3] max-w-sm leading-relaxed">
              {translateSync(
                "Pan-Asian circular material provenance ledger intercepting ceremonial waste across Thailand, India, Taiwan, and the Philippines with Google Gemini AI and 70/20/10 escrow."
              )}
            </p>

            <div className="pt-2 text-[10px] text-[#A8BFA3]/70 font-mono-data">
              {translateSync("EDUtech Asia 2026 • Planet Protectors Sustainability Challenge")}
            </div>
          </div>

          {/* Column 2: Digital Systems & Workflows */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.14em] text-[#C9A96E] font-bold">
              {translateSync("Circular Ecosystem")}
            </h4>
            <ul className="space-y-2 text-xs text-[#E8D8B0]/60">
              <li>
                <Link href="/" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Marketplace & Certified Goods")}
                </Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Public Impact & Canopy Ledger")}
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Interactive Harvest Depot Map")}
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Artisan Studio & Origin Minting")}
                </Link>
              </li>
              <li>
                <Link href="/scanner" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Google Gemini Multimodal Scanner")}
                </Link>
              </li>
              <li>
                <Link href="/agreements" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Material Release Agreements")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Governance & Verification */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.14em] text-[#C9A96E] font-bold">
              {translateSync("Verification & Ledger")}
            </h4>
            <ul className="space-y-2 text-xs text-[#E8D8B0]/60">
              <li>
                <Link href="/handover" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("2D QR Chain-of-Custody Audit")}
                </Link>
              </li>
              <li>
                <Link href="/messages" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Threaded Maker Messaging")}
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#C9A96E] transition-colors">
                  {translateSync("Artisan Guild Verification")}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-red-300 transition-colors flex items-center space-x-1 text-red-400/80"
                >
                  <Shield className="w-3 h-3 text-red-400" />
                  <span>{translateSync("Admin Control Portal")}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#C9A96E]/15 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A8BFA3]/50">
          <p>© 2026 HeriTech V4 • Pan-Asian Circular Origin Ledger</p>
          <p className="font-mono-data text-[10px] mt-2 sm:mt-0 text-[#C9A96E]/70">
            {translateSync("SHA-256 Origin Ledger & Google Wallet Pass Integration")}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
