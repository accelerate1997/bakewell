"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RotateCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Next.js Error Boundary caught an exception:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2e4f3a] text-[#FDFCF8] px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative warm glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#c8872a]/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#3d5a2e]/20 blur-[120px]" />

      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-8 z-10 animate-fade-in-up">
        {/* Main 505 Chef Illustration */}
        <div className="relative w-full max-w-xl aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#2d4f3b] group animate-error-pulse-float hover:scale-[1.03] active:scale-[0.99] transition-all duration-500">
          <Image
            src="/bakewell505.svg"
            alt="The Daily Bake Error 505 - Server Error"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Text Details */}
        <div className="space-y-3 max-w-lg">
          <h1 className="font-playfair text-3xl md:text-5xl font-black text-[#E8C97A] tracking-tight uppercase">
            A Half-Baked Request!
          </h1>
          <p className="text-base text-[#dce9cc] font-medium leading-relaxed">
            Our server encountered an unexpected error while preparing this page. Let's try reheating it, or head back to the main storefront.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#c8872a] hover:bg-[#e8a845] text-white px-8 py-6 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border-0"
          >
            <RotateCw className="w-4 h-4 animate-spin-slow" />
            Try Reheating
          </Button>
          <Link
            href="/"
            className="w-full sm:w-auto border border-[#d4d9b8]/40 hover:border-white hover:bg-white/5 text-[#FDFCF8] px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storefront
          </Link>
        </div>

        {/* Development Diagnostic Information */}
        {isDev && (
          <div className="mt-8 p-6 rounded-2xl border border-dashed border-[#A32D2D]/40 bg-[#A32D2D]/5 max-w-xl w-full text-left space-y-3">
            <div className="flex items-center gap-2 text-[#E8C97A] font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[#A32D2D]" />
              Developer Diagnostics (Visible in Dev Mode Only)
            </div>
            <pre className="text-[10px] font-mono text-[#fcdad7] whitespace-pre-wrap break-all bg-black/35 p-3 rounded-lg border border-white/5 select-text overflow-x-auto max-h-40">
              {error.stack || error.message || "An unknown runtime error occurred."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
