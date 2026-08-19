"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartContext";
import { LanguageSelector, MobileLanguageSelector } from "@/components/language/LanguageSelector";
import { useTranslation } from "@/contexts/TranslationContext";
import { WeaveDivider } from "@/components/WeaveDivider";
import {
  ShoppingBag,
  MapPin,
  Camera,
  Palette,
  FileCheck2,
  BarChart3,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { openCart, itemCount } = useCart();
  const { translateSync } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || "guest";

  const navLinks = [
    { name: translateSync("Marketplace"), href: "/", icon: ShoppingBag, show: true },
    { name: translateSync("Impact Ledger"), href: "/impact", icon: BarChart3, show: true },
    {
      name: translateSync("Harvest Map"),
      href: "/map",
      icon: MapPin,
      show: role === "artisan" || role === "lgu" || role === "admin",
    },
    {
      name: translateSync("Artisan Studio"),
      href: "/studio",
      icon: Palette,
      show: role === "artisan" || role === "admin",
    },
    {
      name: translateSync("AI Scanner"),
      href: "/scanner",
      icon: Camera,
      show: role === "lgu" || role === "admin",
    },
    {
      name: translateSync("Agreements"),
      href: "/agreements",
      icon: FileCheck2,
      show: role === "lgu" || role === "admin",
    },
    {
      name: translateSync("Messages"),
      href: "/messages",
      icon: MessageSquare,
      show: true,
    },
    {
      name: translateSync("Admin Hub"),
      href: "/admin",
      icon: ShieldCheck,
      show: role === "admin",
      isAdmin: true,
    },
  ];

  const getRoleTag = (r: string) => {
    switch (r) {
      case "admin":
        return { label: translateSync("ADMIN"), bg: "bg-red-900/60 text-red-200 border-red-700/50" };
      case "lgu":
        return { label: translateSync("LGU OFFICER"), bg: "bg-blue-900/60 text-blue-200 border-blue-700/50" };
      case "artisan":
        return { label: translateSync("VERIFIED ARTISAN"), bg: "bg-[#7D5A3C] text-[#FAF7F2] border-[#C8A96A]/60" };
      default:
        return { label: translateSync("HERITAGE BUYER"), bg: "bg-[#4F7244] text-[#FAF7F2] border-[#72956A]/60" };
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--bark)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center space-x-3 group min-h-[44px]">
            <div className="w-8 h-8 rounded-[2px] bg-[#7D5A3C] border border-[#C8A96A]/60 flex items-center justify-center shadow-xs group-hover:border-[#C8A96A] transition-colors">
              <span className="font-display text-base font-bold text-[#DFC48E]">H</span>
            </div>
            <div>
              <span className="font-display text-2xl font-semibold tracking-tight text-[#DFC48E]">
                Heri<span className="font-normal text-[#FAF7F2]">Tech</span>
              </span>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-medium hidden sm:block">
                {translateSync("PAN-ASIAN CIRCULAR ORIGIN")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-[13px] uppercase tracking-[0.05em] font-medium transition-all rounded-[2px] min-h-[44px] flex items-center ${
                      active
                        ? "text-[#DFC48E] border-b-2 border-[#DFC48E] bg-[#7D5A3C]/30 font-bold"
                        : link.isAdmin
                        ? "text-red-200 hover:text-white border border-red-800/80 bg-red-950/60"
                        : "text-[#FAF7F2]/90 hover:text-[#DFC48E] hover:bg-[#7D5A3C]/20"
                    }`}
                  >
                    <span>{link.name}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Right Actions: Language Selector + Cart Drawer + Auth Button */}
          <div className="flex items-center space-x-3">
            {/* Language Selector - Desktop */}
            <div className="hidden md:block">
              <LanguageSelector variant="compact" />
            </div>

            {/* Cart Drawer Trigger */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-[2px] border border-[#7D5A3C] bg-[#3D2B1F] hover:border-[#C8A96A] text-[#FAF7F2] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={translateSync("View Cart")}
            >
              <ShoppingBag className="w-4 h-4 text-[#FAF7F2]" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-[1px] bg-[#C8A96A] text-[#3D2B1F] text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {loading ? (
              <div className="w-8 h-8 rounded-[2px] border-2 border-[#C8A96A] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-[2px] border border-[#7D5A3C] bg-[#3D2B1F] hover:border-[#C8A96A] transition-all cursor-pointer min-h-[44px]"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#FAF7F2] truncate max-w-[110px]">
                      {user.fullName}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[1px] border self-start ${
                        getRoleTag(user.role).bg
                      }`}
                    >
                      {getRoleTag(user.role).label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#DFC48E]" />
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-[var(--bark)] rounded-[2px] shadow-2xl border border-[#7D5A3C] py-2 z-50 text-xs"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#7D5A3C]/50">
                      <p className="text-[11px] text-[#DFC48E] uppercase tracking-wider">{translateSync("Signed in as")}</p>
                      <p className="text-xs font-semibold text-[#FAF7F2] truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-[#FAF7F2] hover:bg-[#7D5A3C]/40 hover:text-[#DFC48E] space-x-2.5 min-h-[44px]"
                    >
                      <User className="w-4 h-4 text-[#DFC48E]" />
                      <span>{translateSync("Profile & Cooperative Record")}</span>
                    </Link>

                    <Link
                      href="/messages"
                      className="flex items-center px-4 py-2.5 text-[#FAF7F2] hover:bg-[#7D5A3C]/40 hover:text-[#DFC48E] space-x-2.5 min-h-[44px]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#DFC48E]" />
                      <span>{translateSync("Messages & Logistics")}</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2.5 font-semibold text-red-200 bg-red-950/50 hover:bg-red-900/40 space-x-2.5 border-t border-[#7D5A3C]/30 min-h-[44px]"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-300" />
                        <span>{translateSync("Admin Control Dashboard")}</span>
                      </Link>
                    )}

                    <div className="border-t border-[#7D5A3C]/50 my-1"></div>

                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2.5 text-red-300 hover:bg-red-950/40 space-x-2.5 cursor-pointer text-left min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{translateSync("Sign Out")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[2px] bg-[#C8A96A] hover:bg-[#DFC48E] text-[#3D2B1F] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
              >
                <span>{translateSync("Sign In")}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[2px] text-[#FAF7F2] hover:text-[#DFC48E] hover:bg-[#7D5A3C]/30 lg:hidden cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded WeaveDivider as bottom border */}
      <WeaveDivider height={10} bgColor="#3D2B1F" />

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#7D5A3C] bg-[var(--bark)] px-4 pt-2 pb-5 space-y-2">
          <nav className="flex flex-col space-y-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-3 text-sm uppercase tracking-[0.05em] font-medium rounded-[2px] transition-colors min-h-[44px] flex items-center ${
                      active
                        ? "bg-[#7D5A3C] text-[#DFC48E] font-bold"
                        : "text-[#FAF7F2] hover:bg-[#7D5A3C]/40 hover:text-[#DFC48E]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
          </nav>
          <div className="pt-2 border-t border-[#7D5A3C]/50">
            <MobileLanguageSelector />
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
