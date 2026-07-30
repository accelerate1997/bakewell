"use client";

import React, { useState, useEffect } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Avoid SSR hydration issues by checking localStorage after mounting
    const hasConsent = localStorage.getItem("dailybake-consent");
    if (!hasConsent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("dailybake-consent", "accepted");
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem("dailybake-consent", "declined");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-[#d4d9b8] p-6 shadow-2xl rounded-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3d5a2e]/10 flex items-center justify-center text-[#3d5a2e] flex-shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-playfair font-black text-lg text-[#1a2c1a] leading-tight uppercase tracking-tight">
                Freshly Baked Cookies?
              </h3>
              <p className="text-[10px] text-[#c8872a] font-extrabold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} /> Privacy & Cache Consent
              </p>
            </div>
          </div>
          <button 
            onClick={handleDecline}
            className="text-[#8a8a7a] hover:text-[#1a2c1a] transition-colors p-1 hover:bg-[#f0f2e8] rounded-full"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Text */}
        <p className="text-xs text-[#4a4a4a] leading-relaxed">
          We use cookies and cache storage to make your experience at Bakewell even sweeter. This helps us remember your shopping cart items, save your pincode, and speed up loading times.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-[#3d5a2e] border border-[#3d5a2e]/20 hover:bg-[#3d5a2e]/5 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white bg-[#3d5a2e] hover:bg-[#2e4422] transition-colors shadow-md hover:shadow-lg"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
