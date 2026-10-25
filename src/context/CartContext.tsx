"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from "react";
import { ACCOUNT_CHANGED_EVENT, DEVICE_KEYS } from "@/lib/deviceSession";

export interface CartProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  image: string;
  artisanId?: string;
  artisanName?: string;
  cooperativeName?: string;
  artisanCountry?: string;
  artisanWorkshop?: string;
  artisanLat?: number;
  artisanLng?: number;
  kgDiverted?: number;
  ngoFundName?: string;
  sourceBatchId?: string;
  festivalName?: string;
  region?: string;
  unit?: string;
  quantity?: number;
}

export interface CartContextType {
  items: CartProduct[];
  isOpen: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: CartProduct) => void;
  /** The piece just added, for the confirmation toast; null once it is dismissed. */
  lastAdded: CartProduct | null;
  dismissLastAdded: () => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  subtotal: number;
  totalKgDiverted: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  isOpen: false,
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  setIsCartOpen: () => {},
  addToCart: () => {},
  lastAdded: null,
  dismissLastAdded: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalAmount: 0,
  subtotal: 0,
  totalKgDiverted: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  // Saving waits until the saved cart has been read, or the empty first render would overwrite it.
  const [loaded, setLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartProduct | null>(null);
  const dismissLastAdded = useCallback(() => setLastAdded(null), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEVICE_KEYS.cart);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load cart from storage:", e);
    }
    setLoaded(true);
  }, []);

  // Another account on this device starts with an empty cart.
  useEffect(() => {
    const reset = () => {
      setItems([]);
      setLastAdded(null);
    };
    window.addEventListener(ACCOUNT_CHANGED_EVENT, reset);
    return () => window.removeEventListener(ACCOUNT_CHANGED_EVENT, reset);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DEVICE_KEYS.cart, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart:", e);
    }
  }, [items, loaded]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: CartProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev;
      }
      return [...prev, product];
    });
    // A toast confirms it; opening the drawer would cover the whole phone screen mid-browse.
    setLastAdded(product);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const subtotal = totalAmount;
  const totalKgDiverted = items.reduce((sum, item) => sum + (item.kgDiverted || 0), 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen: isCartOpen,
        isCartOpen,
        openCart,
        closeCart,
        setIsCartOpen,
        addToCart,
        lastAdded,
        dismissLastAdded,
        removeFromCart,
        clearCart,
        totalAmount,
        subtotal,
        totalKgDiverted,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
