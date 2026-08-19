import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "HeriTech V4 — Pan-Asian Circular Origin Ledger",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400;1,9..40,500;1,9..40,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--cream)] text-[var(--bark)] antialiased font-body">
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
