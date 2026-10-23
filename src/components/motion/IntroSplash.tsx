"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, Handshake, Hammer, QrCode } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

/** Lasts this long, then lifts away (matches .intro in globals.css). */
const INTRO_MS = 2750;

// Ring geometry: r=88 inside a 200×200 box, nodes at 12, 3, 6 and 9 o'clock
const NODES = [
  { icon: Camera, label: "Collect", x: 100, y: 12 },
  { icon: Handshake, label: "Match", x: 188, y: 100 },
  { icon: Hammer, label: "Craft", x: 100, y: 188 },
  { icon: QrCode, label: "Verify", x: 12, y: 100 },
];
// The ring starts at 12 o'clock (0.15s) and takes 1.5s, so each node pops as the stroke reaches it
const NODE_DELAY = (i: number) => 0.15 + i * 0.375;

/** First-load intro: the logo, HeriTech's loop drawing around it, and its four steps. */
export function IntroSplash() {
  const { translateSync } = useTranslation();
  const [visible, setVisible] = useState(true);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("no-intro")) {
      setVisible(false);
      return;
    }
    // Hold the page still under the intro
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const done = () => {
      document.body.style.overflow = prevOverflow;
      setVisible(false);
    };
    const timer = window.setTimeout(done, INTRO_MS);
    // Hero entrances are offset while the intro plays (.intro-on); clear it once they have all finished
    window.setTimeout(() => root.classList.remove("intro-on"), INTRO_MS + 2600);
    const skip = () => {
      setSkipped(true);
      window.clearTimeout(timer);
      window.setTimeout(done, 300);
    };
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper ${skipped ? "is-skipped" : ""}`} aria-hidden="true">
      <div className="relative w-[200px] h-[200px]">
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90" fill="none">
          <circle cx="100" cy="100" r="88" stroke="var(--color-line)" strokeWidth="1.5" />
          <circle className="intro-ring" cx="100" cy="100" r="88" stroke="var(--color-pine-500)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <div className="intro-logo absolute inset-[38px] flex items-center justify-center">
          <Image src="/logo_heritech-removebg-preview.png" alt="" width={124} height={124} priority className="logo-plate w-full h-full object-contain" />
        </div>

        {NODES.map((n, i) => {
          const Icon = n.icon;
          return (
            <span
              key={n.label}
              className="intro-node absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-full bg-surface border border-brand-line text-brand shadow-card flex items-center justify-center"
              style={{ left: `${(n.x / 200) * 100}%`, top: `${(n.y / 200) * 100}%`, ["--node-delay" as string]: `${NODE_DELAY(i)}s` }}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </span>
          );
        })}
      </div>

      <p className="intro-fade mt-8 font-display text-[34px] leading-none font-semibold text-ink" style={{ ["--rise-delay" as string]: "0.45s" }}>
        HeriTech
      </p>
      <p className="mt-3 flex items-center gap-2 text-sm font-medium">
        {NODES.map((n, i) => (
          <React.Fragment key={n.label}>
            {i > 0 && <span className="text-line-strong">·</span>}
            <span className="intro-word" style={{ ["--node-delay" as string]: `${NODE_DELAY(i)}s` }}>
              {translateSync(n.label)}
            </span>
          </React.Fragment>
        ))}
      </p>
      <p className="intro-fade mt-6 text-[13px] text-ink-3" style={{ ["--rise-delay" as string]: "1.2s" }}>
        {translateSync("Festival leftovers, traced into heritage craft")}
      </p>
    </div>
  );
}

export default IntroSplash;
