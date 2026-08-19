"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSelector, MobileLanguageSelector } from "@/components/language/LanguageSelector";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { translateSync } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = userRole(user);

  const navLinks = [
    { name: translateSync("Harvest Map"), href: "/map" },
    { name: translateSync("Impact Ledger"), href: "/impact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--forest-dark)] border-b border-[var(--forest-mid)]/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Only (36px, No Wordmark Text) */}
          <Link
            href="/"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] group"
            aria-label="HeriTech Home Feed"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#8FBC8F]/60 bg-[#183324] flex items-center justify-center group-hover:border-[#8FBC8F] transition-colors shadow-xs">
              <Image
                src="/logo heritech.png"
                alt="HeriTech Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </Link>

          {/* Desktop Navigation Links (Max 4 items total) */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 text-xs uppercase tracking-[0.08em] font-medium transition-all rounded-[2px] min-h-[44px] flex items-center ${
                    active
                      ? "text-[#8FBC8F] border-b-2 border-[#8FBC8F] bg-[#2E5A44]/40 font-bold"
                      : "text-[#F4F7F4]/90 hover:text-[#8FBC8F] hover:bg-[#2E5A44]/30"
                  }`}
                >
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Language Selector + Auth Action */}
          <div className="flex items-center space-x-3">
            {/* Language Selector - Desktop */}
            <div className="hidden md:block">
              <LanguageSelector variant="compact" />
            </div>

            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-[#8FBC8F] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-[2px] border border-[#2E5A44] bg-[var(--forest-dark)] hover:border-[#8FBC8F] transition-all cursor-pointer min-h-[44px]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#2E5A44] text-[#EDE0C4] flex items-center justify-center font-bold text-xs">
                    {user.fullName?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-semibold text-[#F4F7F4] hidden sm:inline-block truncate max-w-[100px]">
                    {user.fullName}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8FBC8F]">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-[#3D2B1F] rounded-[2px] shadow-2xl border border-[rgba(200,169,106,0.3)] py-2 z-50 text-xs"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[rgba(200,169,106,0.15)]">
                      <p className="text-[10px] text-[#8FBC8F] uppercase tracking-wider">{translateSync("Signed in as")}</p>
                      <p className="text-xs font-semibold text-[#F4F7F4] truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-[#8FBC8F] bg-[#183324] px-1.5 py-0.5 rounded-[1px] border border-[#2E5A44]">
                        {role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-[#F4F7F4] hover:bg-[#2E5A44]/50 hover:text-[#8FBC8F] min-h-[44px]"
                    >
                      <span>{translateSync("Profile")}</span>
                    </Link>

                    {role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2.5 text-red-200 hover:bg-red-900/40 min-h-[44px]"
                      >
                        <span>{translateSync("Admin Hub")}</span>
                      </Link>
                    )}

                    <div className="border-t border-[rgba(200,169,106,0.15)] my-1"></div>

                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2.5 text-red-300 hover:bg-red-950/40 cursor-pointer text-left min-h-[44px]"
                    >
                      <span>{translateSync("Sign Out")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[2px] bg-[#3E7B5C] hover:bg-[#4E8C68] text-[#F4F7F4] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
              >
                <span>{translateSync("Sign In")}</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[2px] text-[#F4F7F4] hover:text-[#8FBC8F] hover:bg-[#2E5A44]/40 md:hidden cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer (Slides in from right, #3D2B1F bg, linen links) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed top-0 right-0 bottom-0 w-64 bg-[#3D2B1F] p-6 shadow-2xl flex flex-col justify-between border-l border-[#C8A96A]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#C8A96A]/20">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#8FBC8F]">
                  <Image
                    src="/logo heritech.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#EDE0C4] hover:text-[#8FBC8F]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col space-y-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm uppercase tracking-wider text-[#EDE0C4] hover:text-[#C8A96A] hover:bg-white/5 rounded-[2px]"
                >
                  Home (Feed)
                </Link>
                <Link
                  href="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm uppercase tracking-wider text-[#EDE0C4] hover:text-[#C8A96A] hover:bg-white/5 rounded-[2px]"
                >
                  Harvest Map
                </Link>
                <Link
                  href="/impact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm uppercase tracking-wider text-[#EDE0C4] hover:text-[#C8A96A] hover:bg-white/5 rounded-[2px]"
                >
                  Impact Ledger
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm uppercase tracking-wider text-[#EDE0C4] hover:text-[#C8A96A] hover:bg-white/5 rounded-[2px]"
                >
                  Profile
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#C8A96A]/20">
              <MobileLanguageSelector />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
