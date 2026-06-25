import React from "react";
import Link from "next/link";
import { FileText, Mail, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - The Daily Bake",
  description: "Read the Terms & Conditions for ordering, subscribing, and using services from The Daily Bake.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-[#f0f2e8] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#3d5a2e] hover:text-[#1a2c1a] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Title Card */}
        <div className="bg-white rounded-2xl border border-[#d4d9b8] p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#3d5a2e]/10 flex items-center justify-center text-[#3d5a2e] flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-playfair font-black text-3xl sm:text-4xl text-[#1a2c1a] leading-tight uppercase tracking-tight">
                Terms &amp; Conditions
              </h1>
              <p className="text-xs text-[#8a8a7a] font-bold uppercase tracking-widest mt-1">
                Last Updated: June 25, 2026
              </p>
            </div>
          </div>

          <hr className="border-[#f0f2e8]" />

          <div className="space-y-8 text-sm text-[#4a4a4a] leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the services provided by <strong>The Daily Bake™</strong> (referred to as "we," "us," or "our"), you agree to be bound by these Terms &amp; Conditions. If you do not agree to all of these terms, please do not access the website or use our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                2. Account Registration and Security
              </h2>
              <p>
                To place orders or manage subscriptions, you may be required to register for an account. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate, current, and complete information during the registration process.</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                <li>Promptly notify us if you discover or suspect any security breaches related to the Website or your account.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                3. Products, Ordering, and Pricing
              </h2>
              <p>
                All products, descriptions, and prices are subject to change at any time without notice.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Perishable Goods:</strong> Our products (breads, croissants, sourdough loaves) are freshly baked, artisanal items with no chemical preservatives. They are highly perishable and must be stored properly upon receipt.
                </li>
                <li>
                  <strong>Coupons and Offers:</strong> Coupons (e.g. <code>FRESHBAKE</code>) must be applied at checkout before order placement. Offers cannot be combined unless explicitly stated.
                </li>
                <li>
                  <strong>Order Rejections:</strong> We reserve the right to refuse or cancel any order for reasons including product availability, pricing errors, or suspicion of fraud.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                4. Delivery Slots and Serviceability
              </h2>
              <p>
                We deliver fresh products to selected pincodes based on local bakery routes.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Pincode Verification:</strong> You must verify delivery serviceability for your pincode. We are not responsible for orders placed for non-serviceable locations.
                </li>
                <li>
                  <strong>Delivery Slots:</strong> Customers select preferred morning or evening slots. While we aim to deliver within the specified slot, external factors (traffic, weather) may cause delays.
                </li>
                <li>
                  <strong>Subscriptions:</strong> Subscriptions (daily, alternate, or weekly) are generated automatically and charged accordingly. You can pause or cancel your subscription up to 24 hours before the scheduled dispatch date.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                5. Returns, Refunds, and Cancellations
              </h2>
              <p>
                Due to the perishable nature of fresh bread, we do not accept returns on food items.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Cancellations:</strong> Single orders can be cancelled before they enter the baking phase. Once baking has begun, cancellations are not permitted.
                </li>
                <li>
                  <strong>Damaged or Incorrect Items:</strong> If you receive an incorrect product or the packaging is damaged, please contact our support team within 4 hours of delivery along with photographic proof for a replacement or store credit.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                6. Limitation of Liability
              </h2>
              <p>
                In no event shall The Daily Bake, its directors, employees, or suppliers be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of the services, products, or website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                7. Contact Information
              </h2>
              <p>
                If you have any questions or require clarification regarding these Terms &amp; Conditions, please reach out to us:
              </p>
              <div className="bg-[#f0f2e8] p-4 rounded-xl border border-[#d4d9b8]/50 flex items-center gap-3 text-[#1a2c1a]">
                <Mail className="text-[#3d5a2e]" size={20} />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">Email Support</p>
                  <p className="font-black text-[#3d5a2e]">info@thedailybake.com</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
