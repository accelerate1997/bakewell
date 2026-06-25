import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { CategorySlider } from "@/components/store/CategorySlider";
import { ArrowRight, Star, ShieldCheck, Clock, Truck, Calendar, User, BookOpen } from "lucide-react";
import { BreadProcess } from "@/components/store/BreadProcess";
import { HeroImage } from "@/components/store/HeroImage";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const INGREDIENTS = [
  { label: '100% Whole Wheat',          icon: '/ingredient-1.svg' },
  { label: 'No Colours',                icon: '/ingredient-2.svg' },
  { label: 'No Emulsifiers',            icon: '/ingredient-3.svg' },
  { label: 'No Chemical Preservatives', icon: '/ingredient-4.svg' },
  { label: 'Source of Protein & Fibre', icon: '/ingredient-5.svg' },
];

const ONLINE_PARTNERS = ['Swiggy Instamart', 'Blinkit', 'Zepto', 'BigBasket'];
const OFFLINE_PARTNERS = ["Nature's Basket", 'Star Bazaar', 'Reliance Smart', '7-Eleven'];



export default async function StoreHomePage() {
  // Fetch latest 3 published blog posts
  const latestPosts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    include: {
      category: true,
      author: {
        select: { name: true }
      }
    },
    orderBy: { publishedAt: "desc" },
    take: 3
  });

  // Fetch active Hero Banners
  const banners = await prisma.banner.findMany({
    where: {
      position: "HERO",
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch Categories with product count
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: { where: { status: "ACTIVE" } } },
      },
    },
  });

  // Fetch Bestsellers / Featured Active Products
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const heroBanner = banners[0] || {
    title: "Making Health Your Everyday Staple",
    imageUrl: "/hero-image-v3.png",
    linkUrl: "/products",
    subtitle: "No maida. No preservatives. Just good bread, done better.",
  };

  return (
    <div className="font-sans overflow-x-clip" style={{ backgroundColor: '#F0F5EA', color: '#231F14' }}>
      {/* Hero Section */}
      <section className="relative pt-12 pb-0 lg:pt-0 lg:pb-0" style={{ backgroundColor: '#F0F5EA' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            <div className="lg:w-[45%] lg:pr-8 text-center lg:text-left z-10 py-8 lg:py-12">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase leading-[0.9]" style={{ color: '#3A4A2E' }}>
                {heroBanner.title.includes("Making Health") ? (
                  <>Making<br />Health Your<br />Everyday Staple</>
                ) : heroBanner.title.toLowerCase().includes("fresh bakes at your door") ? (
                  <>Fresh Bakes at<br />your<br />Door Step</>
                ) : (
                  heroBanner.title
                )}
              </h1>
              <p className="mt-6 text-lg md:text-xl font-medium" style={{ color: '#231F14' }}>
                {(heroBanner as any).subtitle || "No maida. No preservatives. Just good bread, done better."}
              </p>
              <p className="mt-4 text-2xl md:text-3xl font-bold" style={{ color: '#E8C97A' }}>
                Bread Badlo. Aadat Nahi.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={heroBanner.linkUrl || "/products"}>
                  <button className="px-10 py-4 rounded-full font-bold uppercase tracking-widest transition-opacity hover:opacity-80 shadow-lg text-sm" style={{ backgroundColor: '#E8C97A', color: '#3A4A2E' }}>
                    Shop Now
                  </button>
                </Link>
              </div>
            </div>
            <HeroImage imageUrl={heroBanner.imageUrl} />
          </div>
        </div>
      </section>

      {/* Shop By Top Ranges Slider */}
      <section className="relative z-10 py-16" style={{ borderTop: '10px solid #2E3B25', background: 'linear-gradient(to right, #DCE9CC, #F0F5EA)' }}>
        <CategorySlider categories={categories} />
      </section>

      {/* What's In Our Bread */}
      <section className="py-20 text-center" style={{ backgroundColor: '#3A4A2E', color: '#F0F5EA' }}>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase mb-6 leading-tight">
            What's In Our Bread ?<br />Only What Belongs.
          </h2>
          <p className="text-lg md:text-xl font-semibold mb-12 uppercase tracking-widest" style={{ color: '#DCE9CC' }}>
            Made with 100% Chakki-Fresh Aata
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            {INGREDIENTS.map((item, index) => (
              <div
                key={item.label}
                className="flex flex-col items-center animate-ingredient-fade-up ingredient-icon-wrap"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <div
                  className="w-40 h-40 flex items-center justify-center mb-4 animate-ingredient-float"
                  style={{ animationDelay: `${index * 0.4}s`, animationDuration: `${3.2 + index * 0.3}s` }}
                >
                  <Image src={item.icon} alt={item.label} width={160} height={160} className="object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110" unoptimized />
                </div>
                <p className="font-semibold text-sm md:text-base uppercase max-w-[120px] text-center">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xl italic font-medium opacity-90">
            &quot;It takes longer to bake, but that&apos;s what makes it better.&quot;
          </p>
        </div>
      </section>

      {/* Loaves India Loves */}
      <section className="py-24" style={{ backgroundColor: '#F0F5EA' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-extrabold uppercase text-center mb-16" style={{ color: '#3A4A2E' }}>
            Loaves India Loves.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/products">
              <button 
                className="bg-transparent px-10 py-4 rounded-full font-bold uppercase tracking-widest transition-all hover:bg-[#3A4A2E] hover:text-[#F0F5EA] text-sm" 
                style={{ border: '2px solid #3A4A2E', color: '#3A4A2E' }}
              >
                View All Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Breadmaking Process Section */}
      <BreadProcess />



      {/* Stories From Our Oven (Blog Section) */}
      <section className="py-20 border-t border-[#2E3B25]/10" style={{ backgroundColor: '#F0F5EA' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="space-y-3 text-left">
              <span className="inline-block bg-[#3d5a2e]/10 text-[#3d5a2e] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#3d5a2e]/20">
                Freshly Written
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold uppercase leading-none text-[#3A4A2E]">
                Stories From Our Oven
              </h2>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#8a8a7a]">
                Baking science, sourdough secrets, and wholesome recipes from our kitchen
              </p>
            </div>
            <Link href="/blog" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#3d5a2e] hover:text-[#1a2c1a] transition-colors group">
              Read All Stories
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestPosts.map((post) => {
              const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
              return (
                <div key={post.id} className="bg-white rounded-2xl border border-[#d4d9b8] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
                  <div className="relative h-56 bg-[#e8ead8] overflow-hidden">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#8a8a7a]">
                        <BookOpen className="w-12 h-12 opacity-35" />
                      </div>
                    )}
                    {post.category && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-[#3d5a2e] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shadow-sm">
                          {post.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-left">
                      <h3 className="font-playfair font-black text-lg text-[#1a2c1a] uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-[#3d5a2e] transition-colors">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-xs text-[#8a8a7a] line-clamp-2 leading-relaxed">
                        {post.excerpt || "Read about our baking processes, sourdough guides, and delicious kitchen stories."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#f0f2e8] flex items-center justify-between text-[11px] text-[#8a8a7a] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-[#3d5a2e]" />
                          {post.author?.name || "Daily Bake"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#c8872a]" />
                          {format(publishedDate, "dd MMM")}
                        </span>
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-[10px] font-black text-[#3d5a2e] hover:text-[#1a2c1a] flex items-center gap-1 group-hover:underline"
                      >
                        Read <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
