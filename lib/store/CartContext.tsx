"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSubscriptionCheckout: boolean;
  setIsSubscriptionCheckout: (val: boolean) => void;
  subscriptionFrequency: 'DAILY' | 'ALTERNATING' | 'WEEKLY' | 'CUSTOM_DAYS';
  setSubscriptionFrequency: (val: 'DAILY' | 'ALTERNATING' | 'WEEKLY' | 'CUSTOM_DAYS') => void;
  subscriptionCustomDays: string[];
  setSubscriptionCustomDays: (val: string[]) => void;
  subscriptionStartDate: string;
  setSubscriptionStartDate: (val: string) => void;
  subscriptionEndDate: string;
  setSubscriptionEndDate: (val: string) => void;
  subscriptionDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Subscription Checkout states
  const [isSubscriptionCheckout, setIsSubscriptionCheckout] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<'DAILY' | 'ALTERNATING' | 'WEEKLY' | 'CUSTOM_DAYS'>('DAILY');
  const [subscriptionCustomDays, setSubscriptionCustomDays] = useState<string[]>([]);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
  const [subscriptionDiscount, setSubscriptionDiscount] = useState(10);

  // Load from localStorage and config on mount
  useEffect(() => {
    setIsMounted(true);
    const storedCart = localStorage.getItem("dailybake_cart");
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
    
    // Load subscription discount from settings config
    async function loadDiscountConfig() {
      try {
        const res = await fetch("/api/store/payment/config");
        if (res.ok) {
          const data = await res.json();
          if (data.subscriptionDiscount !== undefined) {
            setSubscriptionDiscount(data.subscriptionDiscount);
          }
        }
      } catch (error) {
        console.error("Failed to load discount config:", error);
      }
    }
    loadDiscountConfig();
  }, []);

  // Save to localStorage on items change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("dailybake_cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (newItem: CartItem) => {
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.variantId === newItem.variantId
      );

      if (existingIndex > -1) {
        const existingItem = currentItems[existingIndex];
        const newQty = existingItem.quantity + newItem.quantity;
        
        if (newQty > newItem.maxStock) {
          toast.error(`Cannot add more. Only ${newItem.maxStock} in stock.`);
          return currentItems;
        }

        const updated = [...currentItems];
        updated[existingIndex] = { ...existingItem, quantity: newQty };
        toast.success(`Updated quantity for ${newItem.name} (${newItem.variantLabel})`);
        return updated;
      } else {
        toast.success(`Added ${newItem.name} (${newItem.variantLabel}) to cart`);
        return [...currentItems, newItem];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (variantId: string) => {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
    toast.info("Item removed from cart");
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(variantId);
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.variantId === variantId) {
          if (quantity > item.maxStock) {
            toast.error(`Only ${item.maxStock} units available in stock.`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("dailybake_cart");
    setIsSubscriptionCheckout(false);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const discountFactor = (100 - subscriptionDiscount) / 100;
    const price = isSubscriptionCheckout ? Math.round(item.price * discountFactor * 100) / 100 : item.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isSubscriptionCheckout,
        setIsSubscriptionCheckout,
        subscriptionFrequency,
        setSubscriptionFrequency,
        subscriptionCustomDays,
        setSubscriptionCustomDays,
        subscriptionStartDate,
        setSubscriptionStartDate,
        subscriptionEndDate,
        setSubscriptionEndDate,
        subscriptionDiscount,
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
