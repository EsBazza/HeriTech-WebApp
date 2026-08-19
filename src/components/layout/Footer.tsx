"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  ShieldCheck,
  Cpu,
  Globe2,
  Award,
  Mail,
  Send,
  MessageCircle,
  HelpCircle,
  FileText,
  Share2,
} from "lucide-react";

export function Footer() {
  const { translateSync } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail("");
    }, 3000);
  };

  return (
    <div className="w-full">
      {/* ── PRE-FOOTER: IMPACT & TRUST SECTION ── */}
      <section className="bg-[#FAF8F5] border-t border-[#E6E2D8] py-14 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Projected Impact Banner */}
          <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#F0ECE1]">
              <div>
                <span className="text-[10px] uppercase font-mono-data font-bold tracking-[0.2em] text-[#1A6B3A] block">
                  {translateSync("OUR IMPACT")}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#1A6B3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start md:self-auto">
                {translateSync("Projected Regional Impact")}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-2xl sm:text-3xl font-extrabold font-mono-data text-[#1A6B3A]">
                  <span>♻</span>
                  <span>12,450+</span>
                  <span className="text-xs font-normal text-gray-500">kg</span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-normal">
                  {translateSync("Materials diverted from Asian landfills")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-2xl sm:text-3xl font-extrabold font-mono-data text-[#1A6B3A]">
                  <span>🧑‍🎨</span>
                  <span>320+</span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-normal">
                  {translateSync("Artisans supported across cooperatives")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-2xl sm:text-3xl font-extrabold font-mono-data text-[#1A6B3A]">
                  <span>🏛</span>
                  <span>18</span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-normal">
                  {translateSync("Community & municipal partners")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-2xl sm:text-3xl font-extrabold font-mono-data text-[#1A6B3A]">
                  <span>🌱</span>
                  <span>2,400+</span>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-normal">
                  {translateSync("Trees funded via watershed trusts")}
                </p>
              </div>
            </div>
          </div>

          {/* Why HeriTech Trust Cards Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-2 shadow-sm">
              <div className="flex items-center space-x-2.5 text-[#1A6B3A]">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#1A6B3A]">
                  <Cpu className="w-5 h-5 shrink-0" />
                </div>
                <span className="font-extrabold text-sm text-gray-900">
                  {translateSync("Fair Value Distribution")}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {translateSync("Guaranteed 70% Artisan / 20% LGU Municipal Trust / 10% Watershed NGO revenue split.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-2 shadow-sm">
              <div className="flex items-center space-x-2.5 text-[#1A6B3A]">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#1A6B3A]">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                </div>
                <span className="font-extrabold text-sm text-gray-900">
                  {translateSync("Verifiable Heritage")}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {translateSync("Google Wallet Digital Origin Passes & Badges secured via cryptographic SHA-256 batch hashes.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-2 shadow-sm">
              <div className="flex items-center space-x-2.5 text-[#1A6B3A]">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#1A6B3A]">
                  <Globe2 className="w-5 h-5 shrink-0" />
                </div>
                <span className="font-extrabold text-sm text-gray-900">
                  {translateSync("Built for Communities")}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {translateSync("Seamless multi-language regional access supporting English, Tagalog, Thai, Hindi, and more.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-2 shadow-sm">
              <div className="flex items-center space-x-2.5 text-[#1A6B3A]">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#1A6B3A]">
                  <Award className="w-5 h-5 shrink-0" />
                </div>
                <span className="font-extrabold text-sm text-gray-900">
                  {translateSync("Trusted Partnerships")}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {translateSync("Developed in partnership with EDUtech ASIA and University of the Assumption.")}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER: NAVIGATION, COMPLIANCE, TECH BADGES & ESSENTIAL LINKS ── */}
      <footer className="bg-[#122B1E] text-white border-t border-[#1F4732] pb-16 pt-14">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          {/* Main 4 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Column 1: HeriTech Brand Area (High Contrast Text) */}
            <div className="md:col-span-2 lg:col-span-4 space-y-4">
              <Link href="/" className="inline-flex items-center space-x-3.5 group">
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
                  <span className="font-display text-2xl font-extrabold text-[#95E2B3] tracking-tight block leading-none">
                    HeriTech
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-[#C4E8D1] block pt-1">
                    {translateSync("Preserving culture. Reimagining waste.")}
                  </span>
                </div>
              </Link>

              {/* High Contrast WCAG AA Compliant Subtext */}
              <p className="text-xs sm:text-sm text-[#F0F5F2] leading-relaxed font-medium max-w-sm">
                {translateSync("Turn post-festival materials into authenticated heritage crafts while creating value for artisans, LGUs, and communities.")}
              </p>

              {/* Concise Technology Badges */}
              <div className="pt-2">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#95E2B3] block mb-2">
                  {translateSync("BUILT WITH GOOGLE TECH STACK")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#1C3E2C] border border-[#2B5E43] text-[11px] font-semibold text-[#E2EFE7]">
                    Gemini AI
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#1C3E2C] border border-[#2B5E43] text-[11px] font-semibold text-[#E2EFE7]">
                    Google Maps & Earth
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#1C3E2C] border border-[#2B5E43] text-[11px] font-semibold text-[#E2EFE7]">
                    Google Wallet API
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#1C3E2C] border border-[#2B5E43] text-[11px] font-semibold text-[#E2EFE7]">
                    Cloud Translation
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Platform Navigation */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#95E2B3] font-extrabold">
                {translateSync("Platform")}
              </h4>
              <ul className="space-y-2.5 text-xs text-[#F0F5F2]">
                <li>
                  <Link href="/map" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("Harvest & GIS Mapping")}
                  </Link>
                </li>
                <li>
                  <Link href="/scanner" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("AI Material Scanner")}
                  </Link>
                </li>
                <li>
                  <Link href="/impact" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("Provenance Ledger")}
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("Digital Origin Pass")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: For Partners */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#95E2B3] font-extrabold">
                {translateSync("For Partners")}
              </h4>
              <ul className="space-y-2.5 text-xs text-[#F0F5F2]">
                <li>
                  <Link href="/agreements" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("LGU Portal")}
                  </Link>
                </li>
                <li>
                  <Link href="/studio" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("Artisan Cooperatives")}
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("Collectors & Buyers")}
                  </Link>
                </li>
                <li>
                  <Link href="/impact" className="hover:text-[#95E2B3] hover:underline transition-colors">
                    {translateSync("NGO / Watershed Partners")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Essential Links, Contact & Newsletter */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#95E2B3] font-extrabold">
                {translateSync("Support & Contact")}
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#F0F5F2]">
                <Link href="/impact" className="hover:text-[#95E2B3] hover:underline transition-colors flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#95E2B3]" />
                  <span>{translateSync("Support / FAQ")}</span>
                </Link>
                <Link href="/impact" className="hover:text-[#95E2B3] hover:underline transition-colors flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#95E2B3]" />
                  <span>{translateSync("Contact Us")}</span>
                </Link>
                <Link href="/agreements" className="hover:text-[#95E2B3] hover:underline transition-colors flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#95E2B3]" />
                  <span>{translateSync("Media Kit")}</span>
                </Link>
                <Link href="/map" className="hover:text-[#95E2B3] hover:underline transition-colors flex items-center space-x-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#95E2B3]" />
                  <span>{translateSync("Social Links")}</span>
                </Link>
              </div>

              {/* Newsletter Form */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#E2EFE7] block mb-1.5">
                  {translateSync("Stay updated on circular harvests:")}
                </span>
                {newsletterSubscribed ? (
                  <p className="text-xs font-semibold text-[#95E2B3] bg-[#1C3E2C] p-2.5 rounded-xl border border-[#2B5E43]">
                    ✓ {translateSync("Thank you for subscribing to HeriTech dispatch!")}
                  </p>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex items-center space-x-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={translateSync("Enter your email...")}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#1C3E2C] border border-[#2B5E43] text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#95E2B3]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#95E2B3] hover:bg-[#7ED8A0] text-[#122B1E] text-xs font-bold transition-all shadow-xs shrink-0 flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Legal, Copyright & Badge Bar */}
          <div className="pt-6 border-t border-[#1F4732] flex flex-col md:flex-row items-center justify-between text-xs text-[#C4E8D1] gap-4 text-center md:text-left">
            {/* Left */}
            <div>
              © 2026 HeriTech. {translateSync("All rights reserved.")}
            </div>

            {/* Center: Legal Policies */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[#F0F5F2] font-medium">
              <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Privacy")}</span>
              <span className="text-[#2B5E43]">·</span>
              <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Terms")}</span>
              <span className="text-[#2B5E43]">·</span>
              <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Governance")}</span>
              <span className="text-[#2B5E43]">·</span>
              <span className="hover:text-white transition-colors cursor-pointer">{translateSync("Protocol Audit")}</span>
            </div>

            {/* Right: Subtle Tech Statement */}
            <div className="text-[11px] text-[#C4E8D1]">
              <span className="font-semibold text-white">{translateSync("Powered by Google technologies")}</span>
              <span className="block text-[10px] text-[#95E2B3] pt-0.5">
                Gemini · Maps · Earth · Wallet · Cloud Translation
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default Footer;
