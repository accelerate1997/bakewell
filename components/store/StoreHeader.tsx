"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/store/CartContext";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export function StoreHeader() {
  const { totalItems, setIsCartOpen } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { data: session } = useSession();
  const user = session?.user as any;

  let userLink = "/login?callbackUrl=/account";
  let userTitle = "Sign In / Register";
  let mobileLinkLabel = "SIGN IN / REGISTER";

  if (user) {
    userTitle = `Account (${user.name || user.email || user.phone})`;
    if (user.role === "ADMIN" || user.role === "STAFF") {
      userLink = "/admin";
      mobileLinkLabel = "ADMIN DASHBOARD";
    } else {
      userLink = "/account";
      mobileLinkLabel = "MY ACCOUNT";
    }
  }

  const [announcement, setAnnouncement] = useState({
    text: "🍞 FRESH BAKED DAILY • FREE DELIVERY OVER ₹499 • USE CODE FRESHBAKE FOR 15% OFF 🥐",
    highlightText: "FRESHBAKE",
    linkUrl: "/products"
  });

  useEffect(() => {
    setMounted(true);
    async function loadAnnouncement() {
      try {
        const res = await fetch("/api/store/announcement");
        if (res.ok) {
          const data = await res.json();
          setAnnouncement({
            text: data.text,
            highlightText: data.highlightText,
            linkUrl: data.linkUrl
          });
        }
      } catch (err) {
        console.error("Failed to load storefront announcement:", err);
      }
    }
    loadAnnouncement();
  }, []);

  const renderAnnouncementText = () => {
    const { text, highlightText } = announcement;
    if (!text) return null;
    if (!highlightText) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${highlightText})`, "gi"));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === highlightText.toLowerCase() ? (
            <span key={index} style={{ color: '#E8C97A' }} className="font-bold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    } else {
      router.push("/products");
    }
  };

  const navLinks = [
    { name: "SHOP NOW", href: "/products" },
    { name: "BREADS & LOAVES", href: "/category/breads-loaves" },
    { name: "CAKES & PASTRIES", href: "/category/cakes-pastries" },
    { name: "FMCG ESSENTIALS", href: "/category/fmcg-essentials" },
    { name: "SNACKS & COOKIES", href: "/category/snacks-cookies" },
    { name: "BULK ENQUIRY", href: "/bulk-enquiry" },
    { name: "BLOG", href: "/blog" },
    { name: "OUR STORY", href: "/#story" },
  ];

  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: '#F0F5EA', borderBottom: '1px solid #DCE9CC' }}>
      {/* Top Banner */}
      <div className="text-white text-xs py-2 text-center uppercase tracking-wider font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#3A4A2E' }}>
        {announcement.linkUrl ? (
          <Link href={announcement.linkUrl} className="hover:opacity-90 transition-opacity">
            {renderAnnouncementText()}
          </Link>
        ) : (
          renderAnnouncementText()
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-8">
          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ color: '#3A4A2E' }}
              className="p-2 hover:bg-[#DCE9CC]/50 rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 hidden lg:flex items-center">
            <Link href="/" className="flex items-center">
              <img src="/logo.svg" alt="Bakewell Logo" className="h-12 md:h-14 w-auto object-contain transition-all" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-bold transition-colors tracking-wide hover:opacity-70"
                style={{ color: '#3A4A2E' }}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions: Search & Location & Admin & Cart */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-52 lg:w-64">
              <input
                type="text"
                placeholder="Search bakes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-full pl-4 pr-9 py-2 border focus:outline-none transition-all"
                style={{ backgroundColor: '#DCE9CC', color: '#231F14', borderColor: 'transparent' }}
              />
              <button
                type="submit"
                className="absolute right-3 hover:opacity-70 transition-opacity"
                style={{ color: '#3A4A2E' }}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Admin Portal or Account Link */}
            <Link href={mounted ? userLink : "/login?callbackUrl=/account"}>
              <button 
                style={{ color: '#3A4A2E' }} 
                className="p-2 hover:opacity-70 transition-opacity flex items-center" 
                title={mounted ? userTitle : "Sign In / Register"}
              >
                <User size={20} />
              </button>
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ color: '#3A4A2E' }}
              className="p-2 hover:opacity-70 transition-opacity relative flex items-center"
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={20} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#3A4A2E' }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu & Search */}
      {isMobileMenuOpen && (
        <div className="lg:hidden shadow-lg px-4 py-6 space-y-6 animate-in slide-in-from-top duration-200" style={{ backgroundColor: '#F0F5EA', borderTop: '1px solid #DCE9CC' }}>
          <form onSubmit={handleSearch} className="flex items-center relative w-full">
            <input
              type="text"
              placeholder="Search bakes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm rounded-full pl-4 pr-10 py-3 border focus:outline-none transition-all"
              style={{ backgroundColor: '#DCE9CC', color: '#231F14', borderColor: 'transparent' }}
            />
            <button
              type="submit"
              className="absolute right-4 hover:opacity-70 transition-opacity"
              style={{ color: '#3A4A2E' }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-bold text-sm uppercase tracking-wider pb-2 transition-colors"
                style={{ color: '#3A4A2E', borderBottom: '1px solid #DCE9CC' }}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href={mounted ? userLink : "/login?callbackUrl=/account"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-bold text-sm uppercase tracking-wider pb-2 flex items-center gap-2"
              style={{ color: '#E8C97A', borderBottom: '1px solid #DCE9CC' }}
            >
              <User className="w-5 h-5" />
              {mounted ? mobileLinkLabel : "SIGN IN / REGISTER"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
