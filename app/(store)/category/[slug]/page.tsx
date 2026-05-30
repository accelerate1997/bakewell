import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const revalidate = 30;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const normalizedSlug = slug.includes("bread") ? "breads" : slug.includes("cake") ? "cakes" : slug.includes("fmcg") ? "fmcg" : slug.includes("snack") ? "snacks" : slug;

  // Fetch Category
  const category = await prisma.category.findFirst({
    where: { 
      OR: [
        { slug },
        { slug: normalizedSlug }
      ]
    },
  });

  if (!category) {
    notFound();
  }

  // Fetch Products for this category
  const products = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      status: "ACTIVE",
    },
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back link & Header */}
      <div>
        <Link href="/products" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a7a] hover:text-[#c8872a] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Products</span>
        </Link>
        <div className="bg-[#1a2c1a] rounded-3xl p-8 sm:p-16 text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c8872a_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="bg-[#c8872a] text-[#1a2c1a] text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block">
              ✨ CATEGORY SPECIAL
            </span>
            <h1 className="font-playfair font-black text-4xl sm:text-6xl uppercase tracking-tighter">
              {category.name}
            </h1>
            <p className="text-[#e8ead8] text-base leading-relaxed">
              Explore our freshly baked artisanal selection of {category.name.toLowerCase()}, made with zero preservatives and 100% natural ingredients.
            </p>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div>
        <div className="flex justify-between items-center mb-8 border-b border-[#d4d9b8] pb-4">
          <h2 className="font-playfair font-bold text-2xl text-[#1a2c1a] uppercase tracking-tight">
            Available {category.name} ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#d4d9b8] p-16 text-center space-y-4">
            <div className="text-6xl">🍞</div>
            <h3 className="font-playfair font-bold text-2xl text-[#1a2c1a]">No bakes ready yet</h3>
            <p className="text-[#8a8a7a] text-sm max-w-md mx-auto">
              We are currently preparing fresh batches for this category. Please check back later or explore our other delicious selections!
            </p>
            <Link href="/products" className="inline-block pt-2">
              <span className="bg-[#3d5a2e] text-white font-bold uppercase tracking-widest px-6 py-3 rounded-full text-xs shadow-md">
                Explore All Bakes
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
