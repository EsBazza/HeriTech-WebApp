import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About HeriTech",
  description: "How HeriTech traces festival leftovers to artisans, records every step, and splits every sale in the open.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
