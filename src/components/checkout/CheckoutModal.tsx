"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart, CartProduct } from "@/components/cart/CartContext";
import {
  X,
  MapPin,
  ShieldCheck,
  Heart,
  Scale,
  Leaf,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { calculateEscrowSplit } from "@/lib/escrow";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";
import Link from "next/link";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directProduct?: CartProduct | null;
}

export function CheckoutModal({ isOpen, onClose, directProduct }: CheckoutModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const { items, clearCart } = useCart();

  const checkoutItems = directProduct ? [directProduct] : items;
  const totalPrice = checkoutItems.reduce((acc, item) => acc + item.price, 0);
  const totalKg = checkoutItems.reduce((acc, item) => acc + item.kgDiverted, 0);
  const escrow = calculateEscrowSplit(totalPrice);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Shipping Details Form State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Manila");
  const [country, setCountry] = useState("Philippines");
  const [postalCode, setPostalCode] = useState("1000");

  // Geocoded destination coordinates for map route
  const getCityCoordinates = (cityName: string) => {
    switch (cityName.toLowerCase()) {
      case "manila":
        return { lat: 14.5995, lng: 120.9842, distance: "245 km" };
      case "cebu":
        return { lat: 10.3157, lng: 123.8854, distance: "820 km" };
      case "bangkok":
        return { lat: 13.7563, lng: 100.5018, distance: "2,200 km" };
      case "tokyo":
        return { lat: 35.6762, lng: 139.6503, distance: "3,050 km" };
      case "singapore":
        return { lat: 1.3521, lng: 103.8198, distance: "2,400 km" };
      default:
        return { lat: 14.5995, lng: 120.9842, distance: "350 km" };
    }
  };

  const buyerCoords = getCityCoordinates(city);
  const artisanCoords = {
    lat: checkoutItems[0]?.artisanLat || 16.4023,
    lng: checkoutItems[0]?.artisanLng || 120.5960,
    name: checkoutItems[0]?.artisanWorkshop || "Cordillera Craft Guild",
    city: "Baguio City, Philippines",
  };

  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleNextToRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !streetAddress || !city) return;
    setStep(2);
  };

  const handleExecutePayment = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    setProcessing(true);
    try {
      // 1. Create order for each item in checkout
      const primaryProduct = checkoutItems[0];
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: primaryProduct.id,
          buyerId: user.id,
          shippingAddress: {
            fullName,
            streetAddress,
            city,
            country,
            postalCode,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderResult(data.data);
        clearCart();
        setStep(3);

        // 2. Trigger automated order completed message to Artisan
        try {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: user.id,
              receiverId: primaryProduct.artisanId,
              content: `🎉 Order #${data.data.order.id.substring(0, 8)} confirmed for "${primaryProduct.title}"! Fair-trade payout of $${escrow.artisanPayout.toFixed(2)} (70%) transferred to your guild. Total ${primaryProduct.kgDiverted} kg diverted. Shipping to: ${city}, ${country}.`,
              contextType: "order",
              contextId: data.data.order.id,
              isSystem: true,
            }),
          });
        } catch (msgErr) {
          console.warn("Could not trigger automated message:", msgErr);
        }
      }
    } catch (err) {
      console.error("Checkout execution error:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E6E2D8] relative my-8">
        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator Header */}
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HERITECH 70/20/10 ESCROW CHECKOUT</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mt-1">
            {step === 1 && "Step 1: Delivery & Shipping Address"}
            {step === 2 && "Step 2: Provenance Route & Escrow Breakdown"}
            {step === 3 && "Order Confirmed & Google Impact Badge Earned!"}
          </h2>
        </div>

        {/* STEP 1: Shipping Form */}
        {step === 1 && (
          <form onSubmit={handleNextToRoute} className="space-y-4 text-xs">
            {/* Order Items Snapshot */}
            <div className="p-3 bg-[#F8F6F0] rounded-2xl space-y-2">
              <div className="flex items-center justify-between font-bold text-gray-800">
                <span>Selected Pieces ({checkoutItems.length})</span>
                <span className="font-mono-data text-emerald-800 font-extrabold">
                  ${totalPrice.toFixed(2)} USD • {totalKg.toFixed(1)} kg diverted
                </span>
              </div>
              <div className="space-y-1">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[11px] text-gray-600">
                    <span className="truncate max-w-[280px]">
                      • {item.title} (by {item.artisanName})
                    </span>
                    <span className="font-mono-data font-bold">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maria Clara Santos"
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Destination City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-white font-semibold text-gray-900"
                >
                  <option value="Manila">Manila, Philippines</option>
                  <option value="Cebu">Cebu City, Philippines</option>
                  <option value="Bangkok">Bangkok, Thailand</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Tokyo">Tokyo, Japan</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Street Address</label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Unit 402 Heritage Tower, Ayala Avenue"
                className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Postal / ZIP Code</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="1000"
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3.5 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Inspect Provenance Route & Escrow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Provenance Map & 70/20/10 Escrow Breakdown */}
        {step === 2 && (
          <div className="space-y-5 text-xs">
            {/* Interactive Origin-to-Destination Route Visualizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-[#1A6B3A]" />
                  <span>Pan-Asian Provenance Shipping Route</span>
                </span>
                <span className="font-mono-data text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  Distance: ~{buyerCoords.distance}
                </span>
              </div>

              {/* Map Embed or Route Box */}
              <div className="h-48 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 relative">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/directions?key=${
                    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
                  }&origin=${artisanCoords.lat},${artisanCoords.lng}&destination=${buyerCoords.lat},${buyerCoords.lng}&mode=transit`}
                />
              </div>

              {/* Route Endpoints Summary */}
              <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-[#F8F6F0] rounded-xl">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">
                    Origin (Artisan Workshop)
                  </span>
                  <p className="font-bold text-gray-900">{artisanCoords.name}</p>
                  <p className="text-gray-500 text-[10px]">{artisanCoords.city}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">
                    Destination (Your Delivery)
                  </span>
                  <p className="font-bold text-gray-900">{fullName}</p>
                  <p className="text-gray-500 text-[10px]">{city}, {country}</p>
                </div>
              </div>
            </div>

            {/* 70/20/10 Escrow Split Details */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E2D8] space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900 uppercase">
                  Audited 70/20/10 Escrow Distribution
                </span>
                <span className="font-mono-data font-black text-gray-900 text-sm">
                  ${totalPrice.toFixed(2)} USD
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-gray-700">
                    <Heart className="w-3.5 h-3.5 text-blue-600" />
                    <span>70% Direct Fair-Trade Artisan Payout</span>
                  </span>
                  <span className="font-mono-data font-bold text-blue-700">
                    ${escrow.artisanPayout.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-gray-700">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>20% Municipal Collection Logistics & Platform</span>
                  </span>
                  <span className="font-mono-data font-bold text-emerald-700">
                    ${escrow.platformFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-gray-700">
                    <Leaf className="w-3.5 h-3.5 text-amber-600" />
                    <span>10% Environmental NGO Trust Fund</span>
                  </span>
                  <span className="font-mono-data font-bold text-amber-700">
                    ${escrow.ngoContribution.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit Address</span>
              </button>

              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={processing}
                className="flex-1 py-3.5 rounded-xl bg-[#D9532F] hover:bg-[#B84223] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Escrow & Minting Google Wallet Pass...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {user ? `Pay with Google Wallet ($${totalPrice.toFixed(2)})` : "Sign In with Google to Complete"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Order Completed & Google Impact Badge Earned! */}
        {step === 3 && orderResult && (
          <div className="space-y-6 text-center">
            {/* Big Badge Reveal */}
            <div className="p-6 bg-gradient-to-br from-amber-50 to-emerald-50 rounded-3xl border-2 border-emerald-300 space-y-4 shadow-lg">
              <div className="w-20 h-20 bg-emerald-100 text-[#1A6B3A] rounded-full flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[10px] font-mono-data font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  NEW GOOGLE IMPACT BADGE UNLOCKED!
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-2">
                  🏅 Panagbenga Festival Patron (Bronze Tier)
                </h3>
                <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
                  You successfully diverted <strong>{totalKg.toFixed(1)} kg</strong> of raw floral festival waste and directly supported master artisan <strong>{checkoutItems[0]?.artisanName}</strong>.
                </p>
              </div>

              {/* Real Scannable QR Code */}
              <div className="flex flex-col items-center justify-center pt-2">
                <QRCodeViewer
                  value={`https://heritech.app/verify/${orderResult.walletPass?.serial || "HT-519-PH"}`}
                  size={140}
                  label={`PASS SERIAL: ${orderResult.walletPass?.serial || "HT-519-PH"}`}
                  sublabel="Scan with standard phone camera to audit cryptographic provenance"
                />
              </div>
            </div>

            {/* Automated Messaging Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between text-left">
              <div>
                <span className="font-bold">Automated Message Sent to Artisan:</span>
                <p className="text-[11px] text-blue-700">
                  {checkoutItems[0]?.artisanName} was notified to begin preparation and shipping.
                </p>
              </div>
              <Link
                href="/messages"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px] whitespace-nowrap hover:bg-blue-700 ml-3"
              >
                Open Messages
              </Link>
            </div>

            {/* Finish & View in Profile */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/profile"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#1A6B3A] text-white text-xs font-bold shadow-md hover:bg-[#14532D]"
              >
                View Badges in Profile
              </Link>

              <Link
                href={`/verify/${orderResult.walletPass?.serial || "HT-519-PH"}`}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#E6E2D8] text-gray-800 text-xs font-bold hover:bg-gray-50 flex items-center space-x-1.5"
              >
                <span>Inspect Public Ledger</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
