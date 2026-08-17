"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  artisanId: string;
  artisanName: string;
  artisanCountry?: string;
  artisanWorkshop?: string;
  artisanLat?: number;
  artisanLng?: number;
  kgDiverted: number;
  ngoFundName: string;
  sourceBatchId: string;
  festivalName?: string;
}

interface CartContextType {
  items: CartProduct[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalKgDiverted: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalAmount: 0,
  totalKgDiverted: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
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

  // Save cart changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("heritech_cart", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart:", e);
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addToCart = (product: CartProduct) => {
    if (!items.some((i) => i.id === product.id)) {
      setItems((prev) => [...prev, product]);
    }
    setIsOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem("heritech_cart");
    } catch (e) {}
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const totalKgDiverted = items.reduce((sum, item) => sum + item.kgDiverted, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        clearCart,
        totalAmount,
        totalKgDiverted,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
