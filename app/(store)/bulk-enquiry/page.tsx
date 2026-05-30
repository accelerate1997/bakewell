import { prisma } from "@/lib/prisma";
import BulkEnquiryForm from "@/components/store/BulkEnquiryForm";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 300; // Cache for 5 minutes

export const metadata: Metadata = {
  title: "Bulk Purchase Enquiry | The Daily Bake",
  description: "Request wholesale pricing, custom recipe formulations, or corporate bulk enquiries for fresh-baked organic breads and pastries from The Daily Bake.",
};

export default async function BulkEnquiryPage() {
  // Fetch active categories and active products
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: "asc" },
  });

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#fafaf7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#1a2c1a] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#1a2c1a] transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-[#1a2c1a]">Bulk Enquiry</span>
        </nav>

        {/* Heading Hierarchy (SEO Single H1) */}
        <div className="text-center space-y-2">
          <h1 className="font-playfair font-black text-3xl sm:text-4xl text-[#1a2c1a] uppercase tracking-wide">
            Wholesale & Custom Orders
          </h1>
          <p className="text-xs text-[#8a8a7a] font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
            Planning an event, corporate supply, or retail partnership? Let us know your requirements.
          </p>
        </div>

        {/* Form Component */}
        <BulkEnquiryForm categories={categories} products={products} />
      </div>
    </main>
  );
}
