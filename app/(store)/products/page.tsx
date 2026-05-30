import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { Prisma } from "@prisma/client";
import { SlidersHorizontal, X } from "lucide-react";

export const revalidate = 30;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; tag?: string; sort?: string }>;
}) {
  const { search, category, tag, sort } = await searchParams;

  const currentSearch = search || "";
  const currentCategory = category || "";
  const currentTag = tag || "";
  const currentSort = sort || "";

  const buildQuery = (updates: Record<string, string>) => {
    const sp = new URLSearchParams();
    const s = updates.search !== undefined ? updates.search : currentSearch;
    const c = updates.category !== undefined ? updates.category : currentCategory;
    const t = updates.tag !== undefined ? updates.tag : currentTag;
    const srt = updates.sort !== undefined ? updates.sort : currentSort;

    if (s) sp.set("search", s);
    if (c) sp.set("category", c);
    if (t) sp.set("tag", t);
    if (srt) sp.set("sort", srt);
    return sp.toString();
  };

  // Build Prisma where clause
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (tag) {
    where.nutritionTags = { has: tag };
  }

  // Build Prisma orderBy clause
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-asc") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "price-desc") {
    orderBy = { createdAt: "desc" };
  }

  // Fetch Products
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
    orderBy,
  });

  // Sort products in memory if price sorting is requested (since price is on variants)
  if (sort === "price-asc") {
    products.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
  } else if (sort === "price-desc") {
    products.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
  }

  // Fetch Categories for filter sidebar
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });

  // Fetch all tags for filter sidebar
  const allProductsForTags = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { nutritionTags: true },
  });
  const allTags = Array.from(
    new Set(allProductsForTags.flatMap((p) => p.nutritionTags))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="border-b border-[#d4d9b8] pb-8 mb-12">
        <h1 className="font-playfair font-black text-4xl sm:text-5xl text-[#1a2c1a] uppercase tracking-tight">
          {category ? `${category.replace("-", " ")}` : search ? `Search: "${search}"` : "All Fresh Bakes"}
        </h1>
        <p className="text-sm text-[#8a8a7a] font-bold uppercase tracking-widest mt-2">
          Showing {products.length} artisanal products
        </p>

        {/* Active Filters Summary */}
        {(category || tag || search) && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] mr-2">Active Filters:</span>
            {category && (
              <Link href={`/products?${buildQuery({ category: "" })}`}>
                <span className="bg-[#c8872a] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  Category: {category} <X className="w-3.5 h-3.5" />
                </span>
              </Link>
            )}
            {tag && (
              <Link href={`/products?${buildQuery({ tag: "" })}`}>
                <span className="bg-[#3d5a2e] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  Tag: {tag} <X className="w-3.5 h-3.5" />
                </span>
              </Link>
            )}
            {search && (
              <Link href={`/products?${buildQuery({ search: "" })}`}>
                <span className="bg-[#1a2c1a] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  Search: {search} <X className="w-3.5 h-3.5" />
                </span>
              </Link>
            )}
            <Link href="/products" className="text-xs font-bold text-[#c8872a] hover:underline uppercase tracking-wider ml-2">
              Clear All
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8 divide-y divide-[#d4d9b8]/50">
          {/* Categories Filter */}
          <div>
            <h3 className="font-playfair font-bold text-lg text-[#1a2c1a] uppercase tracking-wider mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#c8872a]" />
              Categories
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/products?${buildQuery({ category: "" })}`}
                  className={`flex items-center justify-between text-sm font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${
                    !category ? "bg-[#3d5a2e] text-white" : "text-[#4a4a4a] hover:bg-[#e8ead8]"
                  }`}
                >
                  <span>All Categories</span>
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?${buildQuery({ category: cat.slug })}`}
                    className={`flex items-center justify-between text-sm font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${
                      category === cat.slug ? "bg-[#3d5a2e] text-white" : "text-[#4a4a4a] hover:bg-[#e8ead8]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${category === cat.slug ? "bg-white/20 text-white" : "bg-[#f0f2e8] text-[#8a8a7a]"}`}>
                      {cat._count.products}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dietary Tags Filter */}
          <div className="pt-8">
            <h3 className="font-playfair font-bold text-lg text-[#1a2c1a] uppercase tracking-wider mb-4">
              Dietary & Nutrition
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => {
                const isActive = tag === t;
                return (
                  <Link
                    key={t}
                    href={`/products?${buildQuery({ tag: isActive ? "" : t })}`}
                    className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                      isActive
                        ? "bg-[#c8872a] border-[#c8872a] text-white shadow-md"
                        : "bg-white border-[#d4d9b8] text-[#4a4a4a] hover:border-[#c8872a]"
                    }`}
                  >
                    {t}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sorting */}
          <div className="pt-8">
            <h3 className="font-playfair font-bold text-lg text-[#1a2c1a] uppercase tracking-wider mb-4">
              Sort By
            </h3>
            <div className="space-y-2">
              {[
                { label: "Newest Bakes", value: "newest" },
                { label: "Price: Low to High", value: "price-asc" },
                { label: "Price: High to Low", value: "price-desc" },
              ].map((s) => {
                const isActive = sort === s.value || (!sort && s.value === "newest");
                return (
                  <Link
                    key={s.value}
                    href={`/products?${buildQuery({ sort: s.value })}`}
                    className={`block text-sm font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${
                      isActive ? "bg-[#1a2c1a] text-[#c8872a]" : "text-[#4a4a4a] hover:bg-[#e8ead8]"
                    }`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#d4d9b8] p-16 text-center space-y-4">
              <div className="text-6xl">🔍</div>
              <h3 className="font-playfair font-bold text-2xl text-[#1a2c1a]">No bakes found</h3>
              <p className="text-[#8a8a7a] text-sm max-w-md mx-auto">
                We couldn&apos;t find any products matching your selected filters or search query. Try clearing some filters to see more results.
              </p>
              <Link href="/products" className="inline-block pt-2">
                <span className="bg-[#3d5a2e] text-white font-bold uppercase tracking-widest px-6 py-3 rounded-full text-xs shadow-md">
                  Reset All Filters
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
