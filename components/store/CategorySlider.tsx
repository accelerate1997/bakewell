"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  _count: {
    products: number;
  };
}

export function CategorySlider({ categories }: { categories: Category[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8">
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Header with Navigation Arrows */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-left" style={{ color: '#3A4A2E' }}>
          Shop by Top Ranges
        </h2>
        <div className="flex items-center gap-2 pb-1">
          <button 
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full bg-[#3A4A2E] text-[#F0F5EA] hover:bg-[#2a3520] flex items-center justify-center transition-all shadow-md group shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button 
            onClick={scrollRight}
            className="w-10 h-10 rounded-full bg-[#3A4A2E] text-[#F0F5EA] hover:bg-[#2a3520] flex items-center justify-center transition-all shadow-md group shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Slider Container */}
      <div 
        ref={containerRef}
        className="flex overflow-x-auto gap-5 pb-4 pt-2 snap-x snap-mandatory scroll-smooth no-scrollbar items-stretch"
      >
        {categories.map((cat) => (
          <Link 
            key={cat.id} 
            href={`/category/${cat.slug}`} 
            className="flex-none w-[170px] sm:w-[190px] md:w-[210px] snap-start group cursor-pointer block"
          >
            <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-3 bg-[#3A4A2E] shadow-sm">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all z-10" />
              {cat.imageUrl ? (
                <Image 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  fill 
                  sizes="(max-w-768px) 170px, 210px"
                  className="object-cover group-hover:scale-110 transition-transform duration-500 z-0" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl z-0 opacity-80 group-hover:scale-110 transition-transform duration-500">
                  {cat.slug.includes("bread") ? "🍞" : cat.slug.includes("cake") ? "🍰" : cat.slug.includes("cookie") ? "🍪" : "🍯"}
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 z-20 text-left">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E8C97A] text-[#3A4A2E] uppercase tracking-wider inline-block mb-1 shadow-sm">
                  {cat._count.products} Bakes
                </span>
              </div>
            </div>
            <h3 className="text-base md:text-lg font-bold uppercase tracking-wide group-hover:opacity-80 transition-opacity text-left line-clamp-1" style={{ color: '#3A4A2E' }}>
              {cat.name}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
