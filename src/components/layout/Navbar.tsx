"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartContext";
import {
  Sparkles,
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || "guest";

  const navLinks = [
    { name: "Marketplace", href: "/", icon: ShoppingBag, show: true },
    { name: "Impact Ledger", href: "/impact", icon: BarChart3, show: true },
    {
      name: "Harvest Map",
      href: "/map",
      icon: MapPin,
      show: role === "artisan" || role === "lgu" || role === "admin",
    },
    {
      name: "Artisan Studio",
      href: "/studio",
      icon: Palette,
      show: role === "artisan" || role === "admin",
    },
    {
      name: "AI Scanner",
      href: "/scanner",
      icon: Camera,
      show: role === "lgu" || role === "admin",
    },
    {
      name: "Agreements",
      href: "/agreements",
      icon: FileCheck2,
      show: role === "lgu" || role === "admin",
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      show: true,
    },
    {
      name: "Admin Hub",
      href: "/admin",
      icon: ShieldCheck,
      show: role === "admin",
      adminBadge: true,
    },
  ];

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "admin":
        return { label: "ADMIN", bg: "bg-red-100 text-red-800 border-red-200" };
      case "lgu":
        return { label: "LGU OFFICER", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "artisan":
        return { label: "VERIFIED ARTISAN", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      default:
        return { label: "HERITAGE BUYER", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F8F6F0]/95 backdrop-blur-md border-b border-[#E6E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1A6B3A] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-[#141312]">HeriTech</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1A6B3A]/10 text-[#1A6B3A] border border-[#1A6B3A]/20">
                  V4
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium tracking-wide">
                PAN-ASIAN CIRCULAR PROVENANCE
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#1A6B3A] text-white shadow-sm"
                        : link.adminBadge
                        ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        : "text-gray-700 hover:bg-black/5 hover:text-[#141312]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-white" : ""}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Right Action: Cart Drawer Button + Auth Button */}
          <div className="flex items-center space-x-3">
            {/* Cart Drawer Trigger */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl border border-[#E6E2D8] bg-white hover:border-[#1A6B3A] text-gray-800 transition-all shadow-xs flex items-center justify-center"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#D9532F] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-[#1A6B3A] border-t-transparent animate-spin" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-full border border-[#E6E2D8] bg-white hover:border-[#1A6B3A]/40 transition-all shadow-sm"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#141312] truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 py-0.2 rounded border self-start ${
                        getRoleBadge(user.role).bg
                      }`}
                    >
                      {getRoleBadge(user.role).label}
                    </span>
                  </div>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1A6B3A] text-white flex items-center justify-center font-bold text-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E6E2D8] py-2 z-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 space-x-2.5"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Profile, Badges & Guild Sales</span>
                    </Link>

                    <Link
                      href="/messages"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 space-x-2.5"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span>Messages & Logistics</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50/50 hover:bg-red-50 space-x-2.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-600" />
                        <span>Admin Control Dashboard</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 space-x-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white border border-[#E6E2D8] hover:border-[#1A6B3A] text-sm font-medium text-gray-800 shadow-sm transition-all hover:bg-gray-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In with Google</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-black/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#E6E2D8] space-y-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active
                        ? "bg-[#1A6B3A] text-white"
                        : link.adminBadge
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700 hover:bg-black/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </header>
  );
}
