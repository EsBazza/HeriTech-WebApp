"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Truck, MessageSquare, AlertCircle, Gift } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart, type CartProduct } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { apiJson } from "@/lib/api";
import { calculateEscrowSplit } from "@/lib/escrow";
import { LOYALTY, progressSummary, type LoyaltyState } from "@/lib/loyalty";
import { EscrowBar } from "@/components/EscrowBar";
import { ImpactPassCard } from "@/components/wallet/ImpactPassCard";
import { SuccessBurst } from "@/components/motion/SuccessBurst";
import { Button, Dialog, Input, cn, buttonClass } from "@/components/ui";
import { DemoSignIn } from "@/components/auth/DemoSignIn";

interface OrderResult {
  orders: { id: string; productId: string; amountPaid: number }[];
  passes: { serial: string; qrPayload: string; orderId: string }[];
  totalPaid: number;
  discount: number;
  loyalty: LoyaltyState;
  rewardUnlocked: boolean;
  paymentMode: "simulated";
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directProduct?: CartProduct | null;
}

export function CheckoutModal({ isOpen, onClose, directProduct }: CheckoutModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const { items, clearCart, removeFromCart } = useCart();
  const { formatCurrency, formatNumber, translateSync, currentCurrency } = useTranslation();
  // Prices are shown in the buyer's currency, but orders are always charged in US dollars.
  const usd = (n: number) => formatCurrency(n, "USD");

  const liveItems = directProduct ? [directProduct] : items;
  // Snapshot of what was bought, so the confirmation survives clearCart().
  const [purchased, setPurchased] = useState<CartProduct[] | null>(null);
  const checkoutItems = purchased ?? liveItems;
  const totalPrice = checkoutItems.reduce((acc, item) => acc + item.price, 0);
  const totalKg = checkoutItems.reduce((acc, item) => acc + (item.kgDiverted || 0), 0);

  const [step, setStep] = useState<1 | 2>(1);

  // A waiting HeriTech Circle reward; the server applies it, this only previews it.
  const [rewardAvailable, setRewardAvailable] = useState(false);
  useEffect(() => {
    if (!isOpen || !user) return;
    apiJson<LoyaltyState>("/api/loyalty").then((result) => setRewardAvailable(Boolean(result.success && result.data?.rewardAvailable)));
  }, [isOpen, user]);
  const discountPercent = rewardAvailable ? LOYALTY.discountPercent : 0;
  const discount = checkoutItems.reduce((acc, item) => acc + calculateEscrowSplit(item.price, { discountPercent }).discount, 0);
  const amountDue = Math.round((totalPrice - discount) * 100) / 100;

  // Delivery details, pre-filled from the buyer's profile where possible
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState(user?.country ?? "");
  const [postalCode, setPostalCode] = useState("");

  // A guest who signs in from step 1 gets their profile details filled in.
  useEffect(() => {
    if (!user) return;
    setFullName((v) => v || user.fullName || "");
    setCountry((v) => v || user.country || "");
  }, [user]);

  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Start fresh each time the modal is reopened after a completed order.
  useEffect(() => {
    if (isOpen && step === 2) {
      setStep(1);
      setPurchased(null);
      setOrderResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // The maker's automatic thank-you is waiting in Messages.
      window.dispatchEvent(new CustomEvent("new-message"));
      if (!directProduct) clearCart();
      setStep(2);
    } else {
      setOrderError(result.error ?? "We couldn't place this order. Please try again.");
    }
    setProcessing(false);
  };

  const steps = [translateSync("Delivery & payment"), translateSync("Your pass")];
  // The server names the piece that ran out ("Only 0 of "<title>" left in stock").
  const soldOutItem = orderError?.includes("left in stock") ? checkoutItems.find((i) => orderError.includes(`"${i.title}"`)) : undefined;

  const summary = (
    <div className="rounded-md bg-paper border border-line divide-y divide-line">
      {checkoutItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{translateSync(item.title)}</p>
            {item.artisanName && <p className="text-sm text-ink-3 truncate">{translateSync("by")} {translateSync(item.artisanName)}</p>}
          </div>
          <span className="tabular text-sm font-medium text-ink">{formatCurrency(item.price)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="text-ink-3">
          {formatNumber(totalKg)} {translateSync("kg of festival material diverted")}
        </span>
        <span className="tabular font-semibold text-ink">{formatCurrency(totalPrice)}</span>
      </div>
      {discount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm bg-pine-50">
          <span className="flex items-center gap-2 text-brand">
            <Gift className="w-4 h-4" />
            {translateSync("HeriTech Circle reward")} · {LOYALTY.discountPercent}%
          </span>
          <span className="tabular font-semibold text-brand">−{formatCurrency(discount)}</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      size="md"
      fullOnMobile
      // A payment in flight must not be abandoned halfway.
      dismissible={!processing}
      closeLabel={translateSync("Close")}
      title={step === 2 ? translateSync("Order confirmed") : translateSync("Checkout")}
      description={
        <ol className="mt-3 grid grid-cols-2 gap-2" aria-label={translateSync("Progress")}>
          {steps.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const current = step === n;
            return (
              <li key={label} className="space-y-1.5" aria-current={current ? "step" : undefined}>
                <div className={cn("h-1 rounded-full", done || current ? "bg-brand" : "bg-paper-2")} />
                <span className={cn("text-sm", current ? "text-ink font-medium" : "text-ink-3")}>
                  {n}. {label}
                </span>
              </li>
            );
          })}
        </ol>
      }
      footer={
        step === 1 ? (
          user ? (
            <Button type="submit" form="checkout-form" variant="accent" size="lg" className="w-full" loading={processing}>
              {!processing && <Lock className="w-4 h-4" />}
              {processing ? translateSync("Placing order and issuing pass…") : `${translateSync("Place demo order")} · ${formatCurrency(amountDue)}`}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button size="lg" className="w-full" onClick={signInWithGoogle}>
                {translateSync("Sign in with Google to order")}
              </Button>
              <DemoSignIn roles={["buyer"]} />
            </div>
          )
        ) : (
          <Link href="/profile#passes" onClick={onClose} className={buttonClass("primary", "lg", "w-full")}>
            {translateSync("Go to my passes")}
          </Link>
        )
      }
    >
      {/* Guests sign in first, before typing an address */}
      {step === 1 && !user && (
        <div className="space-y-5">
          {summary}
          <p className="rounded-md border border-line bg-paper p-4 text-[15px] text-ink-2">
            {translateSync("Sign in to place your order. Your Verified Impact Pass is saved to your account, so you can add it to Google Wallet and check it later.")}
          </p>
        </div>
      )}

      {/* STEP 1: Delivery details, money split and payment on one screen */}
      {step === 1 && user && (
        <form id="checkout-form" onSubmit={handleExecutePayment} className="space-y-5">
          {summary}

          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-sm font-medium text-ink mb-3">
              <Truck className="w-4 h-4 text-brand-2" />
              {translateSync("Deliver to")}
            </legend>
            <Input label={translateSync("Recipient name")} required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            <Input label={translateSync("Street address")} required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} autoComplete="street-address" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={translateSync("City")} required value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
              <Input label={translateSync("Postal code")} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} autoComplete="postal-code" />
            </div>
            <Input label={translateSync("Country")} required value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
          </fieldset>

          {currentCurrency !== "USD" && (
            <p className="text-sm text-ink-3">
              {translateSync("Prices are shown in your currency as an estimate. The order is charged in US dollars:")}{" "}
              <strong className="tabular text-ink">{usd(amountDue)}</strong>.
            </p>
          )}

          <section className="rounded-md border border-line p-4 space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink font-sans">{translateSync("Where your money goes")}</h3>
              <span className="tabular text-lg font-semibold text-ink">{formatCurrency(amountDue)}</span>
            </div>
            <EscrowBar amount={totalPrice} discountPercent={discountPercent} ngoName={checkoutItems[0]?.ngoFundName} compact />
            {discount > 0 && (
              <p className="text-sm text-ink-3">
                {translateSync("Your reward comes out of the developers' share. The artisan, local government and NGO are paid in full.")}
              </p>
            )}
          </section>

          {orderError && (
            <div className="flex items-start gap-2 rounded-md bg-danger-100 border border-danger/20 px-3 py-2.5 text-sm text-danger" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p>{translateSync(orderError)}</p>
                {/* Sold out while it sat in the cart: let the buyer drop it and carry on */}
                {soldOutItem && !directProduct && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      removeFromCart(soldOutItem.id);
                      setOrderError(null);
                    }}
                  >
                    {translateSync("Remove it and continue")}
                  </Button>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-ink-3">{translateSync("Demo payment: no card is charged. Payments go live once a payment provider is connected.")}</p>
        </form>
      )}

      {/* STEP 2: Order completed */}
      {step === 2 && orderResult && (
        <div className="space-y-6">
          <div className="flex items-start gap-4" role="status">
            <SuccessBurst size={48} scraps className="mt-0.5" />
            <p className="text-[15px] text-ink-2">
              {translateSync("You diverted")} <strong className="text-ink">{formatNumber(totalKg)} kg</strong>{" "}
              {translateSync("of festival material and supported")} <strong className="text-ink">{translateSync(checkoutItems[0]?.artisanName || "the artisan")}</strong>.{" "}
              {orderResult.passes.length > 1
                ? `${orderResult.passes.length} ${translateSync("Verified Impact Passes are ready, one per piece. They are saved to your profile too.")}`
                : translateSync("Your Verified Impact Pass is ready. It is saved to your profile too.")}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-brand-line bg-pine-50 px-4 py-3 text-sm text-brand">
            <Gift className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              {orderResult.discount > 0 && (
                <>
                  {translateSync("Your HeriTech Circle reward saved you")} <strong>{formatCurrency(orderResult.discount)}</strong>.{" "}
                </>
              )}
              {orderResult.rewardUnlocked
                ? translateSync(`You've unlocked ${LOYALTY.discountPercent}% off your next order.`)
                : translateSync(progressSummary(orderResult.loyalty)) + "."}
            </p>
          </div>

          {/* One pass per piece */}
          <div className="space-y-6">
            {orderResult.passes.map((pass) => {
              const order = orderResult.orders.find((o) => o.id === pass.orderId);
              const item = checkoutItems.find((i) => i.id === order?.productId);
              const origin = [item?.festivalName, item?.artisanCountry].filter(Boolean).join(", ") || null;
              return (
                <ImpactPassCard
                  key={pass.serial}
                  className="pass-reveal"
                  serial={pass.serial}
                  verifyUrl={pass.qrPayload}
                  title={item?.title ?? translateSync("Your piece")}
                  image={item?.image || null}
                  maker={item?.artisanWorkshop || item?.artisanName || null}
                  origin={origin}
                  kgDiverted={item?.kgDiverted ?? null}
                  issuedAt={new Date().toISOString()}
                  onNavigate={onClose}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3 text-sm">
            <p className="text-ink-2 min-w-0 flex-1 basis-48">
              {translateSync(checkoutItems[0]?.artisanName || "The artisan")} {translateSync("has been notified to prepare your order.")}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                const maker = checkoutItems[0];
                const detail = maker?.artisanId ? { threadId: maker.artisanId, name: maker.artisanWorkshop || maker.artisanName || "Maker" } : undefined;
                setTimeout(() => window.dispatchEvent(new CustomEvent("open-messages", { detail })), 200);
              }}
              className={buttonClass("secondary", "sm", "shrink-0")}
            >
              <MessageSquare className="w-4 h-4" />
              {translateSync("Messages")}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
