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

  // Harvest Map is ONLY accessible to artisan, lgu, and admin (NOT buyer or guest)
  const canAccessMap = role === "artisan" || role === "lgu" || role === "admin";

  // Artisan Studio is ONLY accessible to artisans and admins
  const canAccessStudio = role === "artisan" || role === "admin";

  // Navbar navigation links including Home
  const navLinks = [
    { name: translateSync("Home"), href: "/", show: true },
    { name: translateSync("Impact Ledger"), href: "/impact", show: true },
    { name: translateSync("Harvest Map"), href: "/map", show: canAccessMap },
    { name: translateSync("Artisan Studio"), href: "/studio", show: canAccessStudio },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F4F8F5]/95 backdrop-blur-md border-b border-[#D8E6DC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Left space filler for balance since logo is removed from header */}
          <div className="w-10 h-10 hidden md:block opacity-0" />

          {/* Light Sage Pill Navigation Container (Centered & containing Home) */}
          <nav className="flex items-center bg-[#E4EFE7] p-1.5 rounded-full border border-[#C5DCD0] shadow-inner mx-auto md:mx-0">
            {navLinks
              .filter((link) => link.show)
              .map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                const isStudio = link.href === "/studio";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-5 py-2 text-xs uppercase tracking-[0.09em] font-bold transition-all rounded-full min-h-[36px] flex items-center whitespace-nowrap ${
                      isStudio
                        ? active
                          ? "bg-[#7D5A3C] text-white shadow-xs"
                          : "text-[#7D5A3C] hover:text-[#5C3D20] hover:bg-[#F5EDE4]"
                        : active
                          ? "bg-[#2E6B4A] text-white shadow-xs"
                          : "text-[#2B523E] hover:text-[#1E4D34] hover:bg-[#D5E6DC]"
                    }`}
                  >
                    {isStudio && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="mr-1.5 flex-shrink-0">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
                      </svg>
                    )}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Right Utility Actions */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="hidden md:block">
              <LanguageSelector variant="compact" />
            </div>

            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-[#2E6B4A] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 pl-2.5 rounded-full border border-[#C5DCD0] bg-white hover:bg-[#F0F6F2] transition-all cursor-pointer min-h-[44px] shadow-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-[#2E6B4A] text-white flex items-center justify-center font-bold text-xs">
                    {user.fullName?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-bold text-[#1E4D34] hidden sm:inline-block truncate max-w-[110px]">
                    {user.fullName}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#3A7B59]">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-[#D8E6DC] py-2 z-50 text-xs"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#E8F0EA]">
                      <p className="text-[10px] text-[#5B8870] uppercase tracking-wider font-semibold">{translateSync("Signed in as")}</p>
                      <p className="text-xs font-bold text-[#1E4D34] truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-[#2E6B4A] bg-[#E8F3ED] px-2 py-0.5 rounded-full border border-[#C5DCD0]">
                        {role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-[#2B523E] hover:bg-[#F0F6F2] hover:text-[#1E4D34] font-medium min-h-[44px]"
                    >
                      <span>{translateSync("Profile & Cooperative Record")}</span>
                    </Link>

                    {role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 font-medium min-h-[44px]"
                      >
                        <span>{translateSync("Admin Hub")}</span>
                      </Link>
                    )}

                    <div className="border-t border-[#E8F0EA] my-1"></div>

                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 font-medium cursor-pointer text-left min-h-[44px]"
                    >
                      <span>{translateSync("Sign Out")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-[#2E6B4A] hover:bg-[#23543A] text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer min-h-[40px] shadow-xs"
              >
                <span>{translateSync("Sign In")}</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-[#1E4D34] hover:bg-[#E4EFE7] md:hidden cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed top-0 right-0 bottom-0 w-64 bg-[#F4F8F5] p-6 shadow-2xl flex flex-col justify-between border-l border-[#D8E6DC]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D8E6DC]">
                <span className="font-display text-lg font-bold text-[#1E4D34]">
                  HeriTech
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#5B8870] hover:text-[#1E4D34]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col space-y-1">
                {navLinks.filter((l) => l.show).map((link) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  const isStudio = link.href === "/studio";
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 text-xs uppercase tracking-wider font-bold rounded-lg flex items-center ${
                        isStudio
                          ? active
                            ? "bg-[#7D5A3C] text-white"
                            : "text-[#7D5A3C] hover:bg-[#F5EDE4]"
                          : active
                            ? "bg-[#2E6B4A] text-white"
                            : "text-[#2B523E] hover:bg-[#E4EFE7]"
                      }`}
                    >
                      {isStudio && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="mr-2 flex-shrink-0">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#D8E6DC]">
              <MobileLanguageSelector />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

