"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, CheckCircle2, Lock, ArrowRight, ArrowLeft, Truck, ExternalLink, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart, CartProduct } from "@/components/cart/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { apiJson } from "@/lib/api";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";
import { EscrowBar } from "@/components/EscrowBar";
import { Button, Input, Select, cn, buttonClass } from "@/components/ui";

interface OrderResult {
  orders: { id: string; productId: string; amountPaid: number }[];
  passes: { serial: string; qrPayload: string; orderId: string }[];
  totalPaid: number;
  paymentMode: "simulated";
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directProduct?: CartProduct | null;
}

export function CheckoutModal({ isOpen, onClose, directProduct }: CheckoutModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const { items, clearCart } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();

  const liveItems = directProduct ? [directProduct] : items;
  // Snapshot of what was bought, so the confirmation survives clearCart().
  const [purchased, setPurchased] = useState<CartProduct[] | null>(null);
  const checkoutItems = purchased ?? liveItems;
  const totalPrice = checkoutItems.reduce((acc, item) => acc + item.price, 0);
  const totalKg = checkoutItems.reduce((acc, item) => acc + (item.kgDiverted || 0), 0);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Shipping Details Form State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Manila");
  const [country, setCountry] = useState("Philippines");
  const [postalCode, setPostalCode] = useState("1000");

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
    lng: checkoutItems[0]?.artisanLng || 120.596,
    name: checkoutItems[0]?.artisanWorkshop || "Cordillera Artisan Cooperative",
    city: "Baguio City, Philippines",
  };

  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Start fresh each time the modal is reopened after a completed order.
  useEffect(() => {
    if (isOpen && step === 3) {
      setStep(1);
      setPurchased(null);
      setOrderResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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
    setOrderError(null);
    // One request for the whole cart; the server creates an order, pass and artisan
    // notification per line, and checks stock atomically.
    const result = await apiJson<OrderResult>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: checkoutItems.map((item) => ({ productId: item.id, quantity: 1 })),
        shippingAddress: { fullName, streetAddress, city, country, postalCode },
      }),
    });

    if (result.success && result.data) {
      setPurchased(checkoutItems);
      setOrderResult(result.data);
      if (!directProduct) clearCart();
      setStep(3);
    } else {
      setOrderError(result.error ?? "We couldn't place this order. Please try again.");
    }
    setProcessing(false);
  };

  const serial = orderResult?.passes[0]?.serial ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const steps = [translateSync("Delivery"), translateSync("Review & pay"), translateSync("Your pass")];

  return (
    <div className="fixed inset-0 z-50 bg-pine-900/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-xl min-h-full sm:min-h-0 sm:rounded-lg shadow-pop relative sm:my-8"
      >
        {/* Header with step indicator */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <h2 id="checkout-title" className="font-display text-[28px] leading-tight font-semibold text-ink">
              {step === 3 ? translateSync("Order confirmed") : translateSync("Checkout")}
            </h2>
            <button onClick={onClose} className="-mr-2 w-10 h-10 rounded-md flex items-center justify-center text-ink-3 hover:bg-paper-2 hover:text-ink cursor-pointer" aria-label={translateSync("Close")}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <ol className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const current = step === n;
              return (
                <li key={label} className="space-y-1.5">
                  <div className={cn("h-1 rounded-full", done || current ? "bg-pine-700" : "bg-paper-2")} />
                  <span className={cn("text-xs", current ? "text-ink font-medium" : "text-ink-3")}>
                    {n}. {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {/* STEP 1: Shipping Form */}
          {step === 1 && (
            <form onSubmit={handleNextToRoute} className="space-y-5">
              <div className="rounded-md bg-paper border border-line divide-y divide-line">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{translateSync(item.title)}</p>
                      {item.artisanName && <p className="text-xs text-ink-3 truncate">{translateSync("by")} {translateSync(item.artisanName)}</p>}
                    </div>
                    <span className="tabular text-sm font-medium text-ink">{formatCurrency(item.price)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-ink-3">
                    {formatNumber(totalKg)} {translateSync("kg of festival material diverted")}
                  </span>
                  <span className="tabular font-semibold text-ink">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={translateSync("Recipient name")} required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={translateSync("e.g. Maria Clara Santos")} autoComplete="name" />
                <Select label={translateSync("City")} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="Manila">Manila, Philippines</option>
                  <option value="Cebu">Cebu City, Philippines</option>
                  <option value="Bangkok">Bangkok, Thailand</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Tokyo">Tokyo, Japan</option>
                </Select>
              </div>
              <Input label={translateSync("Street address")} required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder={translateSync("e.g. Unit 402 Heritage Tower, Ayala Avenue")} autoComplete="street-address" />
              <div className="grid grid-cols-2 gap-4">
                <Input label={translateSync("Country")} required value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
                <Input label={translateSync("Postal code")} required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1000" autoComplete="postal-code" />
              </div>

              <Button type="submit" size="lg" className="w-full">
                {translateSync("Continue to review")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* STEP 2: Route + payment split */}
          {step === 2 && (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-ink">
                    <Truck className="w-4 h-4 text-pine-500" />
                    {translateSync("Shipping route")}
                  </span>
                  <span className="text-ink-3 tabular">~{buyerCoords.distance}</span>
                </div>
                <div className="h-44 rounded-md overflow-hidden border border-line bg-paper-2">
                  <iframe
                    title={translateSync("Shipping route map")}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&origin=${artisanCoords.lat},${artisanCoords.lng}&destination=${buyerCoords.lat},${buyerCoords.lng}&mode=transit`}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-ink-3">{translateSync("From")}</dt>
                    <dd className="font-medium text-ink">{translateSync(artisanCoords.name)}</dd>
                    <dd className="text-xs text-ink-3">{translateSync(artisanCoords.city)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">{translateSync("To")}</dt>
                    <dd className="font-medium text-ink">{fullName}</dd>
                    <dd className="text-xs text-ink-3">
                      {city}, {country}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-md border border-line p-4 space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-ink font-sans">{translateSync("Where your money goes")}</h3>
                  <span className="tabular text-lg font-semibold text-ink">{formatCurrency(totalPrice)}</span>
                </div>
                <EscrowBar amount={totalPrice} ngoName={checkoutItems[0]?.ngoFundName} compact />
              </section>

              {orderError && (
                <div className="flex items-start gap-2 rounded-md bg-danger-100 border border-danger/20 px-3 py-2.5 text-sm text-danger" role="alert">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {translateSync(orderError)}
                </div>
              )}

              <p className="text-xs text-ink-3">
                {translateSync("Demo payment: no card is charged. Payments go live once a payment provider is connected.")}
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button variant="secondary" size="lg" type="button" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" />
                  {translateSync("Back")}
                </Button>
                <Button variant="primary" size="lg" className="flex-1" onClick={handleExecutePayment} loading={processing}>
                  {!processing && <Lock className="w-4 h-4" />}
                  {processing
                    ? translateSync("Placing order and issuing pass…")
                    : user
                    ? `${translateSync("Place demo order")} · ${formatCurrency(totalPrice)}`
                    : translateSync("Sign in with Google to order")}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Completed */}
          {step === 3 && orderResult && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                <p className="text-[15px] text-ink-2">
                  {translateSync("You diverted")} <strong className="text-ink">{formatNumber(totalKg)} kg</strong>{" "}
                  {translateSync("of festival material and supported")} <strong className="text-ink">{translateSync(checkoutItems[0]?.artisanName || "the artisan")}</strong>.{" "}
                  {orderResult.passes.length > 1
                    ? `${orderResult.passes.length} ${translateSync("Verified Impact Passes are ready, one per piece. The first is shown below; all are on your profile.")}`
                    : translateSync("Your Verified Impact Pass is ready.")}
                </p>
              </div>

              <div className="flex justify-center rounded-md bg-paper border border-line py-6">
                <QRCodeViewer
                  value={`${origin}/verify/${serial}`}
                  size={148}
                  label={`${translateSync("Pass")} ${serial}`}
                  sublabel={translateSync("Scan with a phone camera to view the full origin record")}
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border border-line px-4 py-3 text-sm">
                <p className="text-ink-2">
                  {translateSync(checkoutItems[0]?.artisanName || "The artisan")} {translateSync("has been notified to prepare your order.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => window.dispatchEvent(new CustomEvent("open-messages")), 200);
                  }}
                  className={buttonClass("ghost", "sm", "shrink-0")}
                >
                  <MessageSquare className="w-4 h-4" />
                  {translateSync("Messages")}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Link href={`/verify/${serial}`} onClick={onClose} className={buttonClass("primary", "lg")}>
                  {translateSync("View public record")}
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/profile" onClick={onClose} className={buttonClass("secondary", "lg")}>
                  {translateSync("Go to my passes")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
