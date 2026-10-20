"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";

export function Footer() {
  const { translateSync } = useTranslation();

  const columns = [
    {
      title: translateSync("Platform"),
      links: [
        { label: translateSync("Shop crafts"), href: "/" },
        { label: translateSync("Impact record"), href: "/impact" },
      ],
    },
    {
      title: translateSync("For partners"),
      links: [
        { label: translateSync("Artisan studio"), href: "/studio" },
        { label: translateSync("Material map"), href: "/map" },
        { label: translateSync("AI material scanner"), href: "/scanner" },
      ],
    },
    {
      title: translateSync("Account"),
      links: [
        { label: translateSync("Profile & passes"), href: "/profile" },
        { label: translateSync("Messages"), href: "/messages" },
      ],
    },
  ];

  const googleStack = ["Gemini", "Maps Platform", "Maps 3D", "Google Wallet", "Cloud Translation", "Firebase"];

  return (
    <footer className="bg-pine-900 text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo_heritech-removebg-preview.png" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="font-display text-2xl font-semibold text-white">HeriTech</span>
          </Link>
          <p className="text-sm leading-relaxed max-w-sm">
            {translateSync(
              "A circular digital system that traces festival waste from collection to finished craft, and shows exactly where every sale's money goes."
            )}
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-white mb-1.5 font-sans">{col.title}</h2>
              <ul className="text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex items-center min-h-10 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-white/60">{translateSync("Built with")}</span>
            {googleStack.map((g, i) => (
              <span key={g} className="text-white/85">
                {g}
                {i < googleStack.length - 1 && <span className="text-white/30 ml-2">·</span>}
              </span>
            ))}
          </div>
          <p className="text-white/60 lg:mr-44">
            © 2026 HeriTech · {translateSync("University of the Assumption")} · EDUtech Asia 2026
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
