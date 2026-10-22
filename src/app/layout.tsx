import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/context/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingBubble } from "@/components/FloatingBubble";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DemoBanner } from "@/components/DemoBanner";
import { IntroSplash } from "@/components/motion/IntroSplash";
import { INTRO_HEAD_SCRIPT } from "@/lib/intro";
import { THEME_HEAD_SCRIPT } from "@/lib/theme";

const title = "HeriTech — Traceable heritage craft from festival waste";
const description =
  "HeriTech traces festival waste from collection to finished craft, pays artisans fairly and shows where every sale's money goes.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: "HeriTech", type: "website" },
  twitter: { card: "summary", title, description },
};

/**
 * Colours the phone's status bar to match the app when installed, and lets the
 * page reach under notches so the env(safe-area-inset-*) paddings take effect.
 */
export const viewport: Viewport = { themeColor: "#1c2140", viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marks JS as available so scroll-reveal content can start hidden without hurting no-JS readers */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');" + THEME_HEAD_SCRIPT + INTRO_HEAD_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Root layout in the App Router, so this loads on every page; the canvas pickup code also needs the real "Figtree" family name. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Figtree:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-paper text-ink-2 antialiased font-body pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <TranslationProvider>
          <AuthProvider>
            <CartProvider>
              <IntroSplash />
              <DemoBanner />
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
              <FloatingBubble />
              <BottomTabBar />
            </CartProvider>
          </AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
