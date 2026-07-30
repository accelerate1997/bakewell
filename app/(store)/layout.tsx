import React, { Suspense } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CookieConsent } from "@/components/store/CookieConsent";
import { CartProvider } from "@/lib/store/CartContext";
import { WishlistProvider } from "@/lib/store/WishlistContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bakewell™ | Fresh Artisanal Bakery & FMCG Essentials",
  description: "Artisanal sourdoughs, decadent pastries, and premium FMCG essentials baked fresh every morning with zero preservatives.",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex flex-col min-h-screen bg-[#f0f2e8]">
          <Suspense fallback={<div className="h-20 bg-[#F0F5EA]" />}>
            <StoreHeader />
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <StoreFooter />
          <CartDrawer />
          <CookieConsent />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
