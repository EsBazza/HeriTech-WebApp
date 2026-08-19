"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import { ShieldCheck, Cpu, Globe2, Award } from "lucide-react";

export function Footer() {
  const { translateSync } = useTranslation();

  return (
    <footer className="bg-[#143826] text-[#F4F7F4] border-t border-[#23543A]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-14 pb-8 space-y-10">
        
        {/* 4-Column Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center space-x-3 group">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo_heritech-removebg-preview.png"
                  alt="HeriTech Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span className="font-display text-[26px] font-bold text-[#A3D9B5] tracking-tight block leading-none">
                  HeriTech
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#8FBC8F] block pt-1">
                  {translateSync("Preserving Culture Through Circular Innovation.")}
                </span>
              </div>
            </Link>

            <p className="text-[13px] text-[#D8EADB] leading-relaxed max-w-sm">
              {translateSync("A Pan-Asian circular digital infrastructure transforming post-festival waste into authenticated heritage crafts.")}
            </p>
          </div>

          {/* Column 2: Platform Features */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#A3D9B5] font-extrabold">
              {translateSync("Platform Features")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#D8EADB]">
              <li>
                <Link href="/map" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Harvest Map & GIS Clustering")}</span>
                </Link>
              </li>
              <li>
                <Link href="/scanner" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("AI Material Scanner")}</span>
                </Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Live Provenance Ledger")}</span>
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Origin Passes & Badges")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Stakeholder Portals */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#A3D9B5] font-extrabold">
              {translateSync("Stakeholder Portals")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#D8EADB]">
              <li>
                <Link href="/agreements" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Municipal LGU Portal")}</span>
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Artisan Cooperatives")}</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Collector & Buyer Hub")}</span>
                </Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-[#A3D9B5] hover:underline transition-colors flex items-center space-x-2">
                  <span className="text-[#8FBC8F]">•</span>
                  <span>{translateSync("Watershed NGO Trust")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Google Infrastructure */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#A3D9B5] font-extrabold">
              {translateSync("Google Infrastructure")}
            </h4>
            <ul className="space-y-3 text-[13px] text-[#D8EADB]">
              <li>
                <div className="flex items-start space-x-2">
                  <span className="text-[#8FBC8F] mt-0.5">•</span>
                  <div>
                    <span className="font-semibold text-[#F4F7F4] block">Gemini 3.5 Flash Lite</span>
                    <span className="text-[11px] text-[#A3D9B5]/80 block">
                      (AI Material & Cultural Storytelling)
                    </span>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-start space-x-2">
                  <span className="text-[#8FBC8F] mt-0.5">•</span>
                  <div>
                    <span className="font-semibold text-[#F4F7F4] block">Maps & Earth 3D</span>
                    <span className="text-[11px] text-[#A3D9B5]/80 block">
                      (GIS Clustering & Canopy Tracking)
                    </span>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-start space-x-2">
                  <span className="text-[#8FBC8F] mt-0.5">•</span>
                  <div>
                    <span className="font-semibold text-[#F4F7F4] block">Google Wallet API</span>
                    <span className="text-[11px] text-[#A3D9B5]/80 block">
                      (SHA-256 Origin Passes & Badges)
                    </span>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-start space-x-2">
                  <span className="text-[#8FBC8F] mt-0.5">•</span>
                  <div>
                    <span className="font-semibold text-[#F4F7F4] block">Google Cloud Translation</span>
                    <span className="text-[11px] text-[#A3D9B5]/80 block">
                      (Multilingual Accessibility)
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Trust & Technology Bar */}
        <div className="pt-8 border-t border-[#23543A]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-[#D8EADB]">
            
            {/* Trust Item 1 */}
            <div className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#183F2C] border border-[#2B6145]/40">
              <Cpu className="w-5 h-5 text-[#A3D9B5] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F4F7F4] block mb-1">
                  {translateSync("Automated Revenue Engine")}
                </span>
                <p className="text-[11px] leading-relaxed text-[#D8EADB]/90">
                  {translateSync("Guaranteed 70% Artisan / 20% LGU Municipal Trust / 10% Watershed NGO split on every purchase.")}
                </p>
              </div>
            </div>

            {/* Trust Item 2 */}
            <div className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#183F2C] border border-[#2B6145]/40">
              <ShieldCheck className="w-5 h-5 text-[#A3D9B5] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F4F7F4] block mb-1">
                  {translateSync("Cryptographic Verification")}
                </span>
                <p className="text-[11px] leading-relaxed text-[#D8EADB]/90">
                  {translateSync("Google Wallet Digital Origin Passes & Badges secured via SHA-256 batch hashes.")}
                </p>
              </div>
            </div>

            {/* Trust Item 3 */}
            <div className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#183F2C] border border-[#2B6145]/40">
              <Globe2 className="w-5 h-5 text-[#A3D9B5] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F4F7F4] block mb-1">
                  {translateSync("Pan-Asian Multilingual Support")}
                </span>
                <p className="text-[11px] leading-relaxed text-[#D8EADB]/90">
                  {translateSync("Powered by Google Cloud Translation (EN | FIL | TH | HI | ID | JA | ZH).")}
                </p>
              </div>
            </div>

            {/* Trust Item 4 */}
            <div className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#183F2C] border border-[#2B6145]/40">
              <Award className="w-5 h-5 text-[#A3D9B5] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F4F7F4] block mb-1">
                  {translateSync("Academic & Impact Partners")}
                </span>
                <p className="text-[11px] leading-relaxed text-[#D8EADB]/90">
                  {translateSync("In partnership with EDUtech ASIA and University of the Assumption.")}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-6 border-t border-[#23543A] flex flex-col md:flex-row items-center justify-between text-[11px] sm:text-[12px] text-[#A3D9B5]/80 gap-4 text-center md:text-left">
          {/* Left */}
          <div>
            © 2026 HeriTech. {translateSync("All rights reserved.")}
          </div>

          {/* Center */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[#D8EADB]/90">
            <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Privacy Policy")}</span>
            <span className="text-[#2B6145]">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Terms of Service")}</span>
            <span className="text-[#2B6145]">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">{translateSync("LGU Governance")}</span>
            <span className="text-[#2B6145]">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Escrow & Protocol Audit")}</span>
          </div>

          {/* Right */}
          <div className="text-[#A3D9B5]/90 font-medium">
            Google Wallet Compatible <span className="text-[#2B6145] px-1">|</span> Powered by Gemini & Google Maps
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
