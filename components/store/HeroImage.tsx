"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface HeroImageProps {
  imageUrl: string;
}

export function HeroImage({ imageUrl }: HeroImageProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setScrollY(window.scrollY);
    
    const handleScroll = () => {
      window.requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax factor: 0.3 means it moves down at 30% of scroll speed
  const translateY = scrollY * 0.3;

  return (
    <div className="lg:w-1/2 relative mt-6 lg:mt-0 w-full aspect-[16/9] lg:aspect-auto lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-[60vw] z-0 animate-slide-up-from-bottom">
      <div 
        className="w-full h-full relative"
        style={{
          transform: `translateY(${translateY}px)`,
          willChange: "transform",
        }}
      >
        <Image 
          src={imageUrl} 
          alt="Hero Bakery Banner" 
          fill
          className="object-contain w-full h-full object-bottom lg:object-right-bottom"
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
      </div>
    </div>
  );
}
