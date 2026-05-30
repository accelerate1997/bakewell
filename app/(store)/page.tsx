import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { CategorySlider } from "@/components/store/CategorySlider";
import { ArrowRight, Star, ShieldCheck, Clock, Truck } from "lucide-react";
import { BreadProcess } from "@/components/store/BreadProcess";
import { HeroImage } from "@/components/store/HeroImage";

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

const RECIPES = [
  { name: "Dessert", img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000&auto=format&fit=crop" },
  { name: "Burger", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop" },
  { name: "Pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop" },
  { name: "Sandwich", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=1000&auto=format&fit=crop" }
];

export default async function StoreHomePage() {
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

      {/* Recipes */}
      <section id="story" className="py-12" style={{ backgroundColor: '#F0F5EA' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold uppercase mb-6" style={{ color: '#3A4A2E' }}>
            Flavour-First, Healthy Recipes.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RECIPES.map((recipe) => (
              <div key={recipe.name} className="group cursor-pointer relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="aspect-[4/3] relative" style={{ backgroundColor: '#DCE9CC' }}>
                  <Image src={recipe.img} alt={recipe.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold text-base tracking-wider uppercase">{recipe.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
