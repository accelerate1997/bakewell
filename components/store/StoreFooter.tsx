"use client";

import React from "react";
import Link from "next/link";

const FOOTER_LINKS = {
  SHOP: [
    { name: "Bestsellers", href: "/products" },
    { name: "No Maida", href: "/products" },
    { name: "High Protein", href: "/products" },
    { name: "Multigrain", href: "/products" },
    { name: "Vegan", href: "/products" }
  ],
  "ABOUT US": [
    { name: "Our Story", href: "/#story" },
    { name: "Find Us", href: "/#story" },
    { name: "Bulk Enquiry", href: "/bulk-enquiry" },
    { name: "Blog", href: "/blog" },
    { name: "Clean Label Promise", href: "/#story" }
  ],
  "OUR PRODUCTS": [
    { name: "No Maida Whole Wheat", href: "/products" },
    { name: "No Maida Multigrain", href: "/products" },
    { name: "No Maida Protein Bread", href: "/products" },
    { name: "No Maida Milk Bread", href: "/products" },
    { name: "No Maida Rusks", href: "/products" },
    { name: "No Maida Low GI Bread", href: "/products" },
    { name: "No Maida Classic Sourdough", href: "/products" },
    { name: "No Maida Pizza Base", href: "/products" },
    { name: "No Maida Burger Bun", href: "/products" }
  ],
  HELP: [
    { name: "Account", href: "/account" },
    { name: "Help & FAQs", href: "/products" },
    { name: "Refund Policy", href: "/refund-policy" }
  ]
};

export function StoreFooter() {
  return (
    <footer className="text-white pt-20 pb-10" style={{ backgroundColor: '#3A4A2E' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black uppercase mb-4">No Maida. No compromise.</h2>
          <p className="text-lg italic font-medium" style={{ color: '#DCE9CC' }}>
            &quot;We&apos;re here to rethink everyday food and make real health effortless. Bread is just the beginning.&quot;
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pt-16 mb-16" style={{ borderTop: '1px solid rgba(240,245,234,0.2)' }}>
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-bold text-3xl tracking-tight flex items-center mb-2">
                <span>THE </span><span className="mx-1" style={{ color: '#DCE9CC' }}>DAILY BAKE</span><span>™</span>
              </span>
            </Link>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(240,245,234,0.7)' }}>
              Love The Daily Bake breads? Get healthy, hustle-friendly recipes straight to your inbox.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm" style={{ color: '#DCE9CC' }}>{title}</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(240,245,234,0.7)' }}>
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-white transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 text-xs tracking-wider uppercase font-semibold" style={{ borderTop: '1px solid rgba(240,245,234,0.2)', color: 'rgba(240,245,234,0.5)' }}>
          <p>© 2026 The Daily Bake™. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:mt-0 justify-center md:justify-end">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
