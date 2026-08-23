import React from "react";
import Link from "next/link";
import { Undo2, Mail, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy - Bakewell",
  description: "Read the Return and Refund Policy of Bakewell to understand order availability, damaged products, cancellations, and refunds.",
};

export default function RefundPolicyPage() {
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
              <Undo2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-playfair font-black text-3xl sm:text-4xl text-[#1a2c1a] leading-tight uppercase tracking-tight">
                Return &amp; Refund Policy
              </h1>
              <p className="text-xs text-[#8a8a7a] font-bold uppercase tracking-widest mt-1">
                Last Updated: June 25, 2026
              </p>
            </div>
          </div>

          <hr className="border-[#f0f2e8]" />

          <div className="space-y-8 text-sm text-[#4a4a4a] leading-relaxed">
            <section className="space-y-3">
              <p>
                At <strong>Bakewell™</strong>, customer satisfaction is our priority. We strive to provide freshly prepared, high-quality baked goods and excellent service. If you experience any issue with your order, please contact us as soon as possible so we can assist you.
              </p>
              <p>
                Refunds are considered only under the following circumstances:
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                1. Order Availability
              </h2>
              <p>
                If an order cannot be fulfilled due to unavailability of products, ingredients, or unforeseen circumstances from our side, you may choose either:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>A full refund,</li>
                <li>Store credit, or</li>
                <li>A replacement product of equal value.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                2. Delivery Area
              </h2>
              <p>
                Please confirm with our Customer Care team that delivery is available in your location before placing your order.
              </p>
              <p>
                If an order has been placed for a location outside our delivery zone, a refund will be processed after deducting any applicable payment gateway or transaction charges, if any.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                3. Incorrect or Excess Payment
              </h2>
              <p>
                If an excess payment has been made, the additional amount can either be:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Adjusted against a future order, or</li>
                <li>Refunded upon request.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                4. Damaged or Incorrect Products
              </h2>
              <p>
                If you receive a damaged, defective, or incorrect product, please contact us within 2 hours of delivery with clear photographs of the product and packaging.
              </p>
              <p>
                After verification, Bakewell Baking Concept will arrange a replacement, store credit, or refund, depending on the situation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                5. Order Cancellations
              </h2>
              <p>
                Orders may be cancelled only if preparation has not yet begun.
              </p>
              <p>
                Once baking or customization has started, cancellations and refunds cannot be accepted, as all products are freshly made to order.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                6. Customized &amp; Personalized Orders
              </h2>
              <p>
                Cakes, desserts, gift hampers, or any customized or personalized orders are non-refundable once production has started, unless the product is damaged, incorrect, or defective upon delivery.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                7. Perishable Products
              </h2>
              <p>
                As our baked goods are perishable in nature, refunds or exchanges will not be provided for reasons such as change of mind, taste preference, or failure to collect the order at the scheduled time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                8. Refund Processing
              </h2>
              <p>
                Approved refunds will be processed using the original mode of payment wherever possible. In cases where this is not feasible, the refund may be issued via bank transfer or cheque in the customer's name.
              </p>
              <p>
                Refunds are typically processed within 7–15 business days after approval.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                9. Contact Us
              </h2>
              <p>
                For any questions or assistance regarding your order, please contact our Customer Care team. We are always happy to help.
              </p>
              <div className="bg-[#f0f2e8] p-4 rounded-xl border border-[#d4d9b8]/50 flex items-center gap-3 text-[#1a2c1a]">
                <Mail className="text-[#3d5a2e]" size={20} />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">Email Support</p>
                  <p className="font-black text-[#3d5a2e]">info@bakewellbreads.com</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
