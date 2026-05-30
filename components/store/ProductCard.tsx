"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/store/CartContext";
import { useWishlist } from "@/lib/store/WishlistContext";
import { Heart } from "lucide-react";

interface Variant {
  id: string;
  label: string;
  price: number;
  stock: number;
  sku: string;
}

interface ProductWithVariants {
  id: string;
  name: string;
  slug: string;
  images: string[];
  nutritionTags: string[];
  category: {
    name: string;
    slug: string;
  };
  variants: Variant[];
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wish = isWishlisted(product.id);

  const defaultVariant = product.variants[0] || {
    id: "fallback",
    label: "Standard",
    price: 99,
    stock: 10,
    sku: "FALLBACK-SKU",
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to PDP
    addToCart({
      productId: product.id,
      variantId: defaultVariant.id,
      name: product.name,
      variantLabel: defaultVariant.label,
      price: defaultVariant.price,
      image: product.images[0] || "",
      quantity: 1,
      maxStock: defaultVariant.stock,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const badgeText = product.nutritionTags[0] || product.category.name || "Bestseller";

  return (
    <div 
      className="rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow flex flex-col items-center text-center relative group" 
      style={{ backgroundColor: '#FDFCF8', border: '1px solid #DCE9CC' }}
    >
      {/* Top Badge */}
      <div 
        className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow-sm z-10" 
        style={{ backgroundColor: '#E8C97A', color: '#3A4A2E' }}
      >
        {badgeText}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all z-10 border border-[#DCE9CC] text-[#3A4A2E] cursor-pointer"
        aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart 
          size={16} 
          className={wish ? "fill-[#A32D2D] text-[#A32D2D]" : "text-[#3A4A2E] hover:text-[#A32D2D]"} 
        />
      </button>

      {/* Image Container */}
      <Link href={`/product/${product.slug}`} className="w-full aspect-square relative mb-6 block overflow-hidden rounded-2xl">
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500 bg-[#F0F5EA]">
            🍞
          </div>
        )}
      </Link>

      {/* Title */}
      <Link href={`/product/${product.slug}`} className="block group-hover:opacity-80 transition-opacity w-full">
        <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-2 h-12 flex items-center justify-center leading-snug" style={{ color: '#231F14' }}>
          {product.name}
        </h3>
      </Link>

      {/* Description / Variant Info */}
      <p className="text-xs mb-6 font-medium line-clamp-1" style={{ color: '#84a066' }}>
        {product.nutritionTags.slice(1).join(" | ") || defaultVariant.label}
      </p>

      {/* Add to Cart CTA */}
      <div className="mt-auto w-full pt-2">
        <button
          onClick={handleQuickAdd}
          disabled={defaultVariant.stock < 1}
          className="w-full py-3 rounded-xl font-bold uppercase hover:opacity-85 transition-opacity flex items-center justify-center gap-1 text-xs md:text-sm tracking-wider shadow-md"
          style={{ 
            backgroundColor: defaultVariant.stock < 1 ? '#A32D2D' : '#3A4A2E', 
            color: '#F0F5EA' 
          }}
        >
          <span>{defaultVariant.stock < 1 ? "SOLD OUT" : "ADD TO CART"}</span>
          <span>|</span>
          <span>₹{defaultVariant.price}</span>
        </button>
      </div>
    </div>
  );
}
