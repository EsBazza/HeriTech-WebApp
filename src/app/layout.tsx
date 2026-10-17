import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/context/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingBubble } from "@/components/FloatingBubble";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "HeriTech — Traceable heritage craft from festival waste",
  description:
    "HeriTech traces festival waste from collection to finished craft, pays artisans fairly and publishes every donation on a public ledger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marks JS as available so scroll-reveal content can start hidden without hurting no-JS readers */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-paper text-ink-2 antialiased font-body pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <TranslationProvider>
          <AuthProvider>
            <CartProvider>
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
