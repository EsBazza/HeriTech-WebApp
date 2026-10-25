"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, Flower2, Hammer, Handshake, Lamp, QrCode, Recycle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { EscrowBar } from "@/components/EscrowBar";
import { cn } from "@/components/ui";
import { Reveal, useInView } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { FestivalLoop } from "@/components/home/FestivalLoop";
import { FestivalLine } from "@/components/home/SplitShapes";
import { SPLIT_LABEL } from "@/lib/escrow";

/** How HeriTech works: the problem, the record, the loop and the split, moved off the shop page. */
export default function AboutPage() {
  const { translateSync, formatNumber, formatCurrency } = useTranslation();
  const { ref: stepsRef, inView: stepsIn } = useInView<HTMLOListElement>();

  const steps = [
    {
      icon: Camera,
      photo: "/photos/step-collect.jpg",
      alt: translateSync("Crumpled paper collected after a festival"),
      title: translateSync("Collect & classify"),
      body: translateSync("Officers photograph leftovers where they are collected. Gemini names the material and flags anything unsafe."),
      tech: "Gemini",
    },
    {
      icon: Handshake,
      photo: "/photos/step-match.jpg",
      alt: translateSync("Sorted fabric offcuts waiting for an artisan"),
      title: translateSync("Match to artisans"),
      body: translateSync("Safe material is logged with GPS and offered to verified artisans nearby, under a signed agreement."),
      tech: "Maps Platform · Firebase",
    },
    {
      icon: Hammer,
      photo: "/photos/step-craft.jpg",
      alt: translateSync("Paper lamp shades, the kind of piece made from it"),
      title: translateSync("Make and tag the piece"),
      body: translateSync("Artisans link each piece to its material ID. Gemini drafts its story for them to review."),
      tech: "Gemini · Cloud Translation",
    },
    {
      icon: QrCode,
      photo: "/photos/step-verify.jpg",
      alt: translateSync("A HeriTech Verified Impact Pass with its QR code"),
      title: translateSync("Buy & verify"),
      body: translateSync(`Buyers see the ${SPLIT_LABEL} split at checkout and get a Verified Impact Pass anyone can check.`),
      tech: "Google Wallet",
    },
  ];

  // Published figures only, each with its source.
  const problems = [
    {
      figure: "50,000+",
      photo: "/photos/yi-peng.jpg",
      alt: translateSync("Thousands of paper sky lanterns rising at Yi Peng in Chiang Mai"),
      value: 50000,
      suffix: "+",
      icon: Lamp,
      label: translateSync("sky lanterns released in a single night at Yi Peng, Chiang Mai (2017)."),
      note: translateSync("In 2025 the festival disrupted 161 flights at Chiang Mai airport."),
      source: "Khaosod English",
      href: "https://www.khaosodenglish.com/news/2017/11/03/yi-peng-lanterns-soar-sky-tonight-photo/",
    },
    {
      figure: "508 t",
      photo: "/photos/marigold-garland.jpg",
      alt: translateSync("Marigold garlands, the offerings collected after Ganesh Chaturthi"),
      value: 508,
      suffix: " t",
      icon: Flower2,
      label: translateSync("of floral offerings collected in Mumbai after Ganesh Chaturthi 2025."),
      note: "",
      source: "Greater Kashmir",
      href: "https://m.greaterkashmir.com/article/ganesh-festival-508-tonnes-of-floral-offerings-collected-in-post-immersion-drive/431563",
    },
    {
      figure: "30+ t",
      photo: "/photos/temple-flowers.jpg",
      alt: translateSync("A pile of spent offering flowers"),
      value: 30,
      suffix: "+ t",
      icon: Recycle,
      label: translateSync("of temple flower waste processed every day by Phool.co in India (2025)."),
      note: translateSync("Proof that festival leftovers can become products people buy."),
      source: "YourStory",
      href: "https://yourstory.com/2025/07/phool-flowercycling-sustainable-innovation",
    },
  ];


  const chapters = [
    { href: "#problem", label: translateSync("The leftovers"), note: translateSync("What one festival leaves behind"), photo: "/photos/yi-peng.jpg" },
    { href: "#record", label: translateSync("The record"), note: translateSync("Collect, match, make, verify"), photo: "/photos/step-collect.jpg" },
    { href: "#loop", label: translateSync("The loop"), note: translateSync("The same steps at every festival"), photo: "/photos/step-match.jpg" },
    { href: "#split", label: translateSync("The split"), note: translateSync(`Where the money goes: ${SPLIT_LABEL}`), photo: "/photos/step-verify.jpg" },
  ];

  return (
    <div className="w-full">
      {/* INTRO: the workshop where the leftovers end up, then a way into each part of the story */}
      <section className="relative isolate overflow-hidden bg-pine-900 text-white" aria-labelledby="about-title">
        <Image
          src="/photos/about-parol-maker.jpg"
          alt={translateSync("A lantern maker assembling a parol by hand in his workshop")}
          fill
          priority
          sizes="100vw"
          quality={80}
          className="about-hero-photo -z-20 object-cover object-[68%_50%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(20_40_30/0.96)_0%,rgb(20_40_30/0.75)_45%,rgb(20_40_30/0.35)_100%)] lg:bg-[linear-gradient(90deg,rgb(20_40_30/0.95)_0%,rgb(20_40_30/0.78)_40%,rgb(20_40_30/0.2)_75%,rgb(20_40_30/0.1)_100%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-36 pb-36 sm:pb-40 lg:pb-48">
          <h1
            id="about-title"
            className="rise max-w-[12ch] font-display text-[clamp(3rem,7vw,6rem)] leading-[0.94] font-semibold tracking-[-0.03em] text-balance text-white"
          >
            {translateSync("How HeriTech works")}
          </h1>
          <p className="rise mt-6 sm:mt-8 text-[17px] sm:text-[19px] text-white/85 leading-[1.6] max-w-[44ch] text-pretty" style={{ ["--rise-delay" as string]: "100ms" }}>
            {translateSync("From the night a festival ends to the shelf: who collects what it leaves behind, who makes something of it, and who gets paid.")}
          </p>
        </div>
      </section>

      {/* The four parts of the story, as cards that sit on the edge of the photo */}
      <nav aria-label={translateSync("On this page")} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 lg:-mt-32">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {chapters.map((c, i) => (
            <li key={c.href} className="rise" style={{ ["--rise-delay" as string]: `${180 + i * 70}ms` }}>
              <a href={c.href} className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface shadow-card hover:shadow-pop transition-shadow">
                <span className="relative block aspect-[16/10] overflow-hidden bg-pine-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-[scale] duration-700 ease-out group-hover:scale-[1.06]" />
                </span>
                <span className="flex flex-1 items-start justify-between gap-2 p-3.5 sm:p-5">
                  <span className="min-w-0">
                    <span className="block font-display text-[19px] sm:text-[22px] leading-tight font-semibold text-ink group-hover:text-brand-2 transition-colors">{c.label}</span>
                    <span className="mt-1 block text-[13px] sm:text-sm text-ink-3 leading-snug text-pretty">{c.note}</span>
                  </span>
                  <ArrowDown className="mt-1 w-4 h-4 shrink-0 text-ink-3 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-brand-2" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* THE PROBLEM: what festivals leave behind, in photographs */}
      <section id="problem" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32" aria-labelledby="problem-title">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-5 items-end">
          <Reveal className="lg:col-span-6">
            <h2 id="problem-title" className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.025em] text-balance text-ink">
              {translateSync("What a festival leaves behind")}
            </h2>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-6">
            <p className="text-[18px] text-ink-2 leading-[1.6] max-w-[48ch] text-pretty">
              {translateSync("The material is reusable. What's missing is a trusted record of who collects it, where it goes and who gets paid.")}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-12">
          {problems.map((p, i) => (
            <Reveal key={p.figure} delay={i * 90} className={cn("flex flex-col", i === 0 ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3")}>
              <figure className="relative overflow-hidden bg-pine-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className={cn("w-full object-cover problem-photo", i === 0 ? "aspect-[4/3] lg:aspect-[8/5]" : "aspect-[4/5]")}
                />
              </figure>
              <p className={cn("mt-5 font-display leading-none font-semibold tracking-[-0.02em] text-lantern-600 tabular", i === 0 ? "text-[clamp(3rem,6vw,5rem)]" : "text-[clamp(2.5rem,4vw,3.25rem)]")}>
                <span className="sr-only">{p.figure}</span>
                <span aria-hidden>
                  <CountUp value={p.value} format={formatNumber} />
                  {p.suffix}
                </span>
              </p>
              <p className="mt-3 text-[17px] text-ink leading-[1.5] text-pretty">{p.label}</p>
              {p.note && <p className="mt-2 text-[15px] text-ink-3 leading-[1.5] text-pretty">{p.note}</p>}
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-2 hover:text-brand">
                {translateSync("Source")}: {p.source}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS: one record along one rail */}
      <div className="bg-paper-2">
      <section id="record" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32" aria-labelledby="steps-title">
        <Reveal className="max-w-3xl">
          <h2 id="steps-title" className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.025em] text-balance text-ink">
            {translateSync("One record, from riverbank to shelf")}
          </h2>
          <p className="mt-6 text-[18px] text-ink-2 leading-[1.6] max-w-[48ch] text-pretty">
            {translateSync("Each step is recorded as it happens, so anyone can check the tag.")}
          </p>
        </Reveal>
        <ol ref={stepsRef} className={cn("relative mt-14 lg:mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12", stepsIn && "steps-in")}>
          <span className="hidden lg:block absolute left-0 right-0 top-[7px] h-[3px] rounded-full bg-paper-2" aria-hidden>
            <span className="step-rail-fill absolute inset-0 rounded-full bg-brand-2" />
          </span>
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s.title} className="relative">
                <span
                  aria-hidden
                  className={cn("step-dot relative z-10 hidden lg:block w-[17px] h-[17px] rounded-full bg-paper-2", last && "step-dot-last")}
                  style={{ transitionDelay: `${300 + i * 380}ms` }}
                />
                <Reveal delay={i * 90} className="lg:mt-7">
                  <figure className="overflow-hidden bg-pine-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.photo} alt={s.alt} loading="lazy" decoding="async" className="step-photo w-full aspect-[4/3] object-cover" />
                  </figure>
                  <h3 className="mt-6 font-display text-[28px] leading-[1.05] font-semibold tracking-[-0.015em] text-ink text-balance">{s.title}</h3>
                  <p className="mt-3 text-[16px] text-ink-2 leading-[1.6] text-pretty">{s.body}</p>
                  <p className={cn("mt-4 text-sm font-medium", last ? "text-lantern-600" : "text-brand-2")}>
                    {translateSync(`Built on ${s.tech.split(" · ").join(" and ")}`)}
                  </p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>
      </div>

      {/* CIRCULAR DIGITAL SYSTEM */}
      <section id="loop" className="scroll-mt-20 ledger-band loop-band text-white" aria-labelledby="loop-title">
        <FestivalLoop />
      </section>

      {/* WHERE THE MONEY GOES */}
      <div id="split" className="scroll-mt-20 relative overflow-x-clip">
      {/* A festival line across the top: a parol, banderitas and paper lanterns, the kind of
          work artisans make from what a festival leaves behind */}
      <FestivalLine className="h-[150px] lg:h-[170px]" />
      <section className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24 lg:pt-52 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center" aria-labelledby="split-title">
        <Reveal className="lg:col-span-5">
          <h2 id="split-title" className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.025em] text-balance text-ink">
            {translateSync("Every sale, split in the open")}
          </h2>
          <p className="mt-6 text-[18px] text-ink-2 leading-[1.6] max-w-[44ch] text-pretty">
            {translateSync("See the exact split before you pay. It goes on the public record, and your pass links to it.")}
          </p>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-7">
          <div className="split-ticket relative bg-surface p-7 sm:p-9 shadow-card">
            <div className="flex items-baseline justify-between mb-6">
              <span className="text-base text-ink-2">{translateSync("A piece sold for")}</span>
              <span className="tabular font-display text-[44px] leading-none font-semibold text-ink">{formatCurrency(85)}</span>
            </div>
            <EscrowBar amount={85} animate />
            <p className="relative mt-6 pt-4 border-t border-dashed border-line-strong flex items-center gap-2 text-sm text-ink-3">
              <span aria-hidden className="split-notch -left-[38px] sm:-left-[46px]" />
              <span aria-hidden className="split-notch -right-[38px] sm:-right-[46px]" />
              <QrCode className="w-4 h-4 shrink-0" aria-hidden />
              {translateSync("Logged on the public record, linked to the buyer's pass")}
            </p>
          </div>
        </Reveal>
      </section>
      </div>

      {/* WHAT NEXT: back to the pieces this record sits behind */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" aria-labelledby="about-next">
        <Reveal className="bg-pine-900 text-white px-7 py-10 sm:px-12 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-7 items-center">
          <div className="lg:col-span-7">
            <h2 id="about-next" className="text-white font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1] font-semibold tracking-[-0.02em] text-balance">
              {translateSync("Every piece in the shop has this record behind it")}
            </h2>
            <p className="mt-4 text-[17px] text-white/80 leading-[1.6] max-w-[46ch] text-pretty">
              {translateSync("Pick one, or check a pass you already have.")}
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
            <Link href="/#shop" className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white text-pine-900 font-medium hover:bg-white/90 transition-colors">
              {translateSync("Browse crafts")}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/#verify" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition-colors">
              <QrCode className="w-4 h-4" />
              {translateSync("Verify a pass")}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* PARTNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" aria-label={translateSync("Partners")}>
        <Reveal className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface px-7 py-7">
          <div className="flex items-center gap-4">
            <Image src="/university-of-assumption.png" alt="University of the Assumption" width={56} height={56} className="partner-seal h-14 w-auto object-contain" />
            <p className="text-base text-ink-2">
              <span className="font-medium text-ink">{translateSync("Built at University of the Assumption, Pampanga")}</span>
              <br />
              {translateSync("Presented at EDUtech Asia 2026, Planet Protectors Challenge")}
            </p>
          </div>
          <span className="inline-flex items-center bg-pine-900 px-4 py-3">
            <Image src="/EDUtech_asia-REV1200.webp" alt="EDUtech Asia" width={160} height={23} className="h-6 w-auto object-contain" />
          </span>
        </Reveal>
        <p className="mt-4 text-sm text-ink-3">
          {translateSync("Photographs")}: {"\u201cLK 02 loy krathong yi peng san sai\u201d by Takeaway, CC BY-SA 3.0"} · {"\u201cMarigold Flowers as garland\u201d by SnapMeUp, CC BY 4.0"}, {"“Man making Parol 2” by Elmer B. Domingo, CC BY-SA 4.0"}, {translateSync("via Wikimedia Commons")} · {translateSync("product and material photos from Unsplash")}
        </p>
      </section>
    </div>
  );
}
