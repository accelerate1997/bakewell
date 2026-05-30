import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2e4f3a] text-[#FDFCF8] px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative warm glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#c8872a]/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#3d5a2e]/20 blur-[120px]" />

      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-8 z-10 animate-fade-in-up">
        {/* Main 404 Chef Illustration */}
        <div className="relative w-full max-w-xl aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#2d4f3b] group animate-chef-sway-float hover:scale-[1.03] active:scale-[0.99] transition-all duration-500">
          <Image
            src="/bakewell404.svg"
            alt="The Daily Bake Error 404 - Sad little chefs holding a wooden sign"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Text Details */}
        <div className="space-y-3 max-w-lg">
          <h1 className="font-playfair text-3xl md:text-5xl font-black text-[#E8C97A] tracking-tight uppercase">
            A Crumb-y Situation!
          </h1>
          <p className="text-base text-[#dce9cc] font-medium leading-relaxed">
            Our bakers searched every shelf and oven, but it seems this page didn't rise. Let's get you back to the fresh bakes!
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/"
            className="w-full sm:w-auto bg-[#c8872a] hover:bg-[#e8a845] text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storefront
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto border border-[#d4d9b8]/40 hover:border-white hover:bg-white/5 text-[#FDFCF8] px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Browse All Bakes
          </Link>
        </div>

        {/* Quick Links / Navigation Categories */}
        <div className="pt-6 border-t border-white/10 w-full max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9e7f] mb-4">
            Try exploring our collections instead:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/category/breads-loaves"
              className="flex flex-col items-center p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8C97A]/10 flex items-center justify-center text-[#E8C97A] mb-2 group-hover:scale-110 transition-transform">
                🍞
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dce9cc] group-hover:text-white">
                Breads
              </span>
            </Link>
            <Link
              href="/category/cakes-pastries"
              className="flex flex-col items-center p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8C97A]/10 flex items-center justify-center text-[#E8C97A] mb-2 group-hover:scale-110 transition-transform">
                🍰
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dce9cc] group-hover:text-white">
                Cakes
              </span>
            </Link>
            <Link
              href="/category/snacks-cookies"
              className="flex flex-col items-center p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8C97A]/10 flex items-center justify-center text-[#E8C97A] mb-2 group-hover:scale-110 transition-transform">
                🍪
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dce9cc] group-hover:text-white">
                Cookies
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
