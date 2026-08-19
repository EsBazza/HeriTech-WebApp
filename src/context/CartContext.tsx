"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  removeFromCart: () => {},
  clearCart: () => {},
  totalAmount: 0,
  subtotal: 0,
  totalKgDiverted: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("heritech_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load cart from storage:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("heritech_cart", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart:", e);
    }
  }, [items]);

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
    setIsCartOpen(true);
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
