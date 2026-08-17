import React from "react";
import Link from "next/link";
import { Sparkles, Shield, HeartHandshake, Leaf, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#141312] text-gray-300 border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#1A6B3A] flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">HeriTech V4</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Continent-wide circular digital infrastructure intercepting festival waste, empowering Asian artisans, and minting verifiable Google Wallet Impact Passes.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono-data">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Supabase PostgreSQL + Google AI Active</span>
            </div>
          </div>

          {/* Escrow Standard */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              70/20/10 Global Standard
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center space-x-2">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-400" />
                <span><strong>70%</strong> Direct Artisan Fair Payout</span>
              </li>
              <li className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span><strong>20%</strong> LGU & Platform Operations</span>
              </li>
              <li className="flex items-center space-x-2">
                <Leaf className="w-3.5 h-3.5 text-amber-400" />
                <span><strong>10%</strong> Verified Environmental NGO Trust</span>
              </li>
            </ul>
          </div>

          {/* Proof Cases */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Pan-Asian Pilot Proofs
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="font-semibold text-white">Panagbenga 🇵🇭</span>
                <p className="text-[10px] text-gray-400">Baguio Bamboo & Florals</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="font-semibold text-white">Yi Peng 🇹🇭</span>
                <p className="text-[10px] text-gray-400">Chiang Mai Lanterns</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="font-semibold text-white">Ganesh Chaturthi 🇮🇳</span>
                <p className="text-[10px] text-gray-400">Thane Nirmalaya Inks</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="font-semibold text-white">Pingxi 🇹🇼</span>
                <p className="text-[10px] text-gray-400">Mulberry Paper Guild</p>
              </div>
            </div>
          </div>

          {/* Governance & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">System Links</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Marketplace</Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-white transition-colors">Public Impact Ledger</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">Artisan & LGU Verification</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-red-400" />
                  <span>Admin Control Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2026 HeriTech V4 • EDUtech Asia Planet Protectors Challenge</p>
          <p className="font-mono-data text-[10px] mt-2 md:mt-0">
            SHA-256 Provenance Ledger & Google Wallet Pass Integration
          </p>
        </div>
      </div>
    </footer>
  );
}
