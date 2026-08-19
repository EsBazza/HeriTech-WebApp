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
      adminBadge: true,
    },
  ];

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "admin":
        return { label: translateSync("ADMIN"), bg: "bg-red-900/60 text-red-300 border-red-700/50" };
      case "lgu":
        return { label: translateSync("LGU OFFICER"), bg: "bg-blue-900/60 text-blue-300 border-blue-700/50" };
      case "artisan":
        return { label: translateSync("VERIFIED ARTISAN"), bg: "bg-[#6B4226]/80 text-[#E8D8B0] border-[#C9A96E]/40" };
      default:
        return { label: translateSync("HERITAGE BUYER"), bg: "bg-[#4A6741]/80 text-[#E8D8B0] border-[#6B8F62]/40" };
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--bark)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-[2px] bg-[#6B4226] border border-[#C9A96E]/40 flex items-center justify-center shadow-xs group-hover:border-[#C9A96E] transition-colors">
              <span className="font-display text-base font-bold text-[#C9A96E]">H</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-display text-2xl font-semibold tracking-tight text-[#C9A96E]">
                  Heri<span className="font-normal text-[#E8D8B0]">Tech</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-[1px] bg-[#6B4226]/50 text-[#C9A96E] border border-[#C9A96E]/30">
                  V4
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-[#A8BFA3] font-medium hidden sm:block">
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
                    className={`px-3 py-1.5 text-[13px] uppercase tracking-[0.05em] font-medium transition-all rounded-[2px] ${
                      active
                        ? "text-[#C9A96E] border-b-2 border-[#C9A96E] bg-[#6B4226]/20 font-semibold"
                        : link.adminBadge
                        ? "text-red-300 hover:text-red-200 border border-red-800/60 bg-red-950/40"
                        : "text-[#E8D8B0]/80 hover:text-[#C9A96E] hover:bg-[#6B4226]/15"
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
              className="relative p-2 rounded-[2px] border border-[#6B4226] bg-[#2C1A0E] hover:border-[#C9A96E] text-[#E8D8B0] transition-colors cursor-pointer"
              title={translateSync("View Cart")}
            >
              <ShoppingBag className="w-4 h-4 text-[#E8D8B0]" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-[1px] bg-[#C9A96E] text-[#2C1A0E] text-[9px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {loading ? (
              <div className="w-7 h-7 rounded-[2px] border-2 border-[#C9A96E] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-[2px] border border-[#6B4226] bg-[#2C1A0E] hover:border-[#C9A96E]/60 transition-all cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#E8D8B0] truncate max-w-[110px]">
                      {user.fullName}
                    </span>
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded-[1px] border self-start ${
                        getRoleBadge(user.role).bg
                      }`}
                    >
                      {getRoleBadge(user.role).label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#A8BFA3]" />
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-[var(--bark)] rounded-[2px] shadow-2xl border border-[#6B4226] py-2 z-50 text-xs"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[#6B4226]/50">
                      <p className="text-[10px] text-[#A8BFA3] uppercase tracking-wider">{translateSync("Signed in as")}</p>
                      <p className="text-xs font-semibold text-[#E8D8B0] truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 text-[#E8D8B0] hover:bg-[#6B4226]/30 hover:text-[#C9A96E] space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span>{translateSync("Profile, Badges & Guild Sales")}</span>
                    </Link>

                    <Link
                      href="/messages"
                      className="flex items-center px-3 py-2 text-[#E8D8B0] hover:bg-[#6B4226]/30 hover:text-[#C9A96E] space-x-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span>{translateSync("Messages & Logistics")}</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center px-3 py-2 font-semibold text-red-300 bg-red-950/40 hover:bg-red-900/30 space-x-2 border-t border-[#6B4226]/30"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                        <span>{translateSync("Admin Control Dashboard")}</span>
                      </Link>
                    )}

                    <div className="border-t border-[#6B4226]/50 my-1"></div>

                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-950/30 space-x-2 cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{translateSync("Sign Out")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#C9A96E] hover:bg-[#E0C48A] text-[#2C1A0E] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>{translateSync("Sign In")}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-[2px] text-[#E8D8B0] hover:text-[#C9A96E] hover:bg-[#6B4226]/30 lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded WeaveDivider as bottom border */}
      <WeaveDivider height={8} bgColor="#2C1A0E" />

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#6B4226] bg-[var(--bark)] px-4 pt-2 pb-5 space-y-2">
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
                    className={`px-3 py-2 text-xs uppercase tracking-[0.05em] font-medium rounded-[2px] transition-colors ${
                      active
                        ? "bg-[#6B4226] text-[#C9A96E] font-bold"
                        : "text-[#E8D8B0] hover:bg-[#6B4226]/30 hover:text-[#C9A96E]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
          </nav>
          <div className="pt-2 border-t border-[#6B4226]/50">
            <MobileLanguageSelector />
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
