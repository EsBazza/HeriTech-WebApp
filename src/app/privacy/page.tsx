import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy policy · HeriTech",
  description: "What HeriTech collects, why, who processes it, and how to delete your account.",
};

const UPDATED = "22 October 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[26px] leading-tight font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

/** The privacy policy linked from the Google Play listing and the Wallet issuer profile. */
export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-[40px] sm:text-[48px] leading-[1.05] font-semibold text-ink">Privacy policy</h1>
        <p className="text-ink-3">Last updated {UPDATED}</p>
        <p className="text-[15px] leading-relaxed text-ink-2">
          HeriTech traces festival materials from collection to the artisans who turn them into handmade pieces, and gives every piece a public record of
          where it came from and where the money went. This page explains what we collect to do that, and what you can do about it.
        </p>
      </header>

      <Section title="What we collect">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-ink">Your Google account basics</strong> when you sign in with Google: your name, email address and profile photo.
          </li>
          <li>
            <strong className="text-ink">Profile details you add</strong>: country, workshop or station name, and, if an artisan chooses to show it, their
            workshop location. Applications to become an artisan or local government officer include the details written in the form.
          </li>
          <li>
            <strong className="text-ink">Orders and claims</strong>: what you bought or claimed, the price, the shipping address you enter at checkout, and the
            Impact Pass issued for it. Payments are simulated; we never ask for or store card details.
          </li>
          <li>
            <strong className="text-ink">Messages</strong> you send to other people in the app, and automatic order and pickup notices.
          </li>
          <li>
            <strong className="text-ink">Material records</strong> made by local government officers: photos of collected material, its weight, type and
            condition, and the location where it was collected.
          </li>
          <li>
            <strong className="text-ink">Location</strong>: only when you allow it, to pin a collection point, set a workshop location or show directions on the
            map. Directions use your location on your device and don&apos;t store it.
          </li>
        </ul>
        <p>
          Stored only on your device: your cart, your chosen language, message drafts and your conversation with the HeriTech assistant. We don&apos;t use
          advertising or analytics trackers.
        </p>
      </Section>

      <Section title="What is public">
        <p>
          Every Impact Pass opens a public record: the piece, its maker and workshop, the material it came from, the festival, the collection point, the
          officer who logged it, and how the money was split. The buyer is never shown. Anyone with the pass serial or QR code can view it.
        </p>
      </Section>

      <Section title="Services that process data for us">
        <ul className="list-disc pl-5 space-y-2">
          <li>Google Firebase (sign-in, database and file storage) and Vercel (hosting the website).</li>
          <li>Google Gemini, to classify material photos, help artisans draft product stories and answer the in-app assistant.</li>
          <li>Google Cloud Translation, to show the app in your language.</li>
          <li>Google Maps, for the material map, directions and 3D journey views.</li>
          <li>Google Wallet, when you choose to save a pass or loyalty card there.</li>
        </ul>
        <p>We don&apos;t sell personal data or share it with anyone else.</p>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can delete your account at any time in the app (Profile → Settings → Delete my account) or on the{" "}
          <Link href="/delete-account" className="text-brand-2 underline underline-offset-2 hover:text-brand">
            account deletion page
          </Link>
          . Your profile, sign-in, messages and loyalty progress are deleted straight away. Orders and Impact Passes stay as anonymous public records, with
          your shipping address removed.
        </p>
      </Section>

      {CONTACT_EMAIL && (
        <Section title="Contact">
          <p>
            Questions about your data:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-2 underline underline-offset-2 hover:text-brand">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      )}
    </article>
  );
}
