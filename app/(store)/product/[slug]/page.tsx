import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/store/ProductDetailView";
import { Metadata } from "next";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return {};
  }

  return {
    title: `${product.metaTitle || product.name} | Bakewell™`,
    description: product.metaDescription || product.description || "Freshly baked artisanal product from Bakewell.",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  let relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: "ACTIVE",
    },
    take: 8,
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (relatedProducts.length < 8) {
    const existingIds = [product.id, ...relatedProducts.map((p) => p.id)];
    const extraProducts = await prisma.product.findMany({
      where: {
        id: { notIn: existingIds },
        status: "ACTIVE",
      },
      take: 8 - relatedProducts.length,
      include: {
        category: true,
        variants: {
          orderBy: { price: "asc" },
        },
      },
    });
    relatedProducts = [...relatedProducts, ...extraProducts];
  }

  // Create JSON-LD structured data for Google Search and AI Engine (AEO/GEO) crawlability
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description || product.metaDescription || "Freshly baked product from Bakewell.",
    "category": product.category.name,
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": product.variants[0]?.price || 0,
      "highPrice": product.variants[product.variants.length - 1]?.price || 0,
      "offerCount": product.variants.length,
      "availability": "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </>
  );
}
