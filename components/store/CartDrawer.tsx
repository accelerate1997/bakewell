"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/store/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    isSubscriptionCheckout,
    setIsSubscriptionCheckout,
    subscriptionDiscount,
  } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg bg-white border-l border-[#d4d9b8] p-6">
        <SheetHeader className="pb-6 border-b border-[#d4d9b8]">
          <SheetTitle className="font-playfair text-2xl font-black uppercase text-[#1a2c1a] flex items-center gap-2 tracking-tight">
            <ShoppingBag className="w-6 h-6 text-[#c8872a]" />
            Your Shopping Bag ({items.reduce((acc, item) => acc + item.quantity, 0)})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6 divide-y divide-[#d4d9b8]/50 pr-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f0f2e8] flex items-center justify-center text-[#8a8a7a]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-playfair text-xl font-bold text-[#1a2c1a]">Your bag is empty</p>
              <p className="text-sm text-[#8a8a7a] max-w-xs">
                Looks like you haven&apos;t added any fresh baked goods to your bag yet.
              </p>
              <Link href="/products" onClick={() => setIsCartOpen(false)} className="mt-2 w-full max-w-[200px]">
                <Button
                  className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold tracking-widest uppercase w-full"
                >
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex gap-4 pt-6 first:pt-0">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#f0f2e8] flex-shrink-0 border border-[#d4d9b8]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍞
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-[#1a2c1a] text-base leading-tight">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-[#8a8a7a] hover:text-red-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-[#c8872a] mt-0.5">
                      {item.variantLabel}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center border border-[#d4d9b8] rounded bg-white overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="px-2 py-1 text-[#4a4a4a] hover:bg-[#f0f2e8] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-bold text-[#1a2c1a] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="px-2 py-1 text-[#4a4a4a] hover:bg-[#f0f2e8] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      {isSubscriptionCheckout ? (
                        <>
                          <span className="font-bold text-[#1a2c1a] text-base block">
                            ₹{Math.round(item.price * 0.9 * item.quantity * 100) / 100}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block line-through">
                            ₹{item.price * item.quantity}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-[#1a2c1a] text-base">
                          ₹{item.price * item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="flex flex-col border-t border-[#d4d9b8] pt-6 space-y-4">
            {/* Subscription Upsell Toggle Banner */}
            {isSubscriptionCheckout ? (
              <div className="bg-[#c8872a]/10 border border-[#c8872a]/30 rounded-xl p-3 text-xs text-[#a86e1e] font-bold uppercase tracking-wide flex justify-between items-center w-full">
                <span>🎉 Subscribe & Save {subscriptionDiscount}% applied!</span>
                <button
                  onClick={() => setIsSubscriptionCheckout(false)}
                  className="text-[#1a2c1a] hover:underline uppercase text-[9px] tracking-wider bg-white px-2.5 py-1 rounded border border-[#d4d9b8] cursor-pointer"
                >
                  One-Time
                </button>
              </div>
            ) : (
              <div className="bg-[#fcfdfa] border border-[#d4d9b8] rounded-xl p-3 text-xs text-[#3d5a2e] font-bold uppercase tracking-wide flex justify-between items-center w-full">
                <span className="text-gray-600">Want morning delivery? Save {subscriptionDiscount}%</span>
                <button
                  onClick={() => setIsSubscriptionCheckout(true)}
                  className="bg-[#c8872a] hover:bg-[#a86e1e] text-white uppercase text-[9px] tracking-wider px-2.5 py-1 rounded font-extrabold cursor-pointer"
                >
                  Subscribe
                </button>
              </div>
            )}

            <div className="flex justify-between items-center w-full text-[#1a2c1a]">
              <span className="text-base font-bold uppercase tracking-wider">Subtotal</span>
              <span className="font-playfair text-2xl font-black">₹{subtotal}</span>
            </div>
            <p className="text-xs text-[#8a8a7a]">
              {isSubscriptionCheckout 
                ? "Recurring schedule details and slot are configured at checkout." 
                : "Shipping and taxes calculated at checkout."}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(false)}
                className="border-[#d4d9b8] text-[#1a2c1a] hover:bg-[#f0f2e8] font-bold uppercase tracking-widest w-full"
              >
                Continue Shopping
              </Button>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="w-full">
                <Button 
                  className={`font-bold uppercase tracking-widest w-full py-6 shadow-none ${
                    isSubscriptionCheckout 
                      ? "bg-[#c8872a] hover:bg-[#a86e1e] text-white" 
                      : "bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white"
                  }`}
                >
                  {isSubscriptionCheckout ? "Subscribe" : "Checkout"}
                </Button>
              </Link>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
