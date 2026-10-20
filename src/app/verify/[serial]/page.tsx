import type { Metadata } from "next";
import { headers } from "next/headers";
import { passRecord } from "@/lib/server/passRecord";
import { VerifyPass } from "./VerifyPass";

type Props = { params: Promise<{ serial: string }> };

/** A shared pass link previews as the piece itself, with its product photo. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { serial } = await params;
  try {
    const record = await passRecord(serial);
    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    const festival = record.originHarvest?.festival;
    const title = `${record.product.title} · Verified Impact Pass`;
    const description = `Made from ${record.product.kgDiverted} kg of recovered festival material${festival ? ` from ${festival}` : ""}. See where it came from and who was paid.`;
    const image = record.product.image ? `${origin}/api/wallet/hero/${encodeURIComponent(record.serial)}` : undefined;
    return {
      title,
      description,
      openGraph: { title, description, siteName: "HeriTech", type: "website", images: image ? [{ url: image }] : undefined },
      twitter: { card: image ? "summary_large_image" : "summary", title, description },
    };
  } catch {
    return { title: `Impact pass ${serial} · HeriTech` };
  }
}

export default async function VerifyPage({ params }: Props) {
  const { serial } = await params;
  return <VerifyPass serial={serial} />;
}
