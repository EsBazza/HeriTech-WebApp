import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "HeriTech V4 — Pan-Asian Circular Provenance Ledger",
  description:
    "Intercepting festival waste across Asia with Google Gemini AI, coordinating with certified artisans, and issuing verifiable Google Wallet Impact Passes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#141312] antialiased">
        <TranslationProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-grow">{children}</main>
              <CartDrawer />
              <Footer />
            </CartProvider>
          </AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
