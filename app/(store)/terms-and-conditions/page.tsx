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
              <p>
                Welcome to <strong>Bakewell™</strong>. By accessing or using the Bakewell website (&quot;the Website&quot;), you agree to be bound by these Terms &amp; Conditions. Please read them carefully before placing an order.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                1. Orders
              </h2>
              <p>
                All products listed on the Website are an invitation to offer, not an offer for sale. When you place an order, you are making an offer to purchase, which Bakewell may accept or decline. An order confirmation sent via email or SMS is only an acknowledgment of receipt and does not constitute acceptance. Your order is accepted only once it has been processed and dispatched.
              </p>
              <p>
                Bakewell reserves the right to cancel any order in cases of product unavailability, payment discrepancies, pricing errors, or suspected fraudulent activity. In such cases, any amount paid will be refunded in accordance with our Refund Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                2. Eligibility
              </h2>
              <p>
                By using this Website, you confirm that you are legally capable of entering into a binding contract under Indian law. Users under the age of 18 may use the Website only with the involvement and supervision of a parent or legal guardian. If you are registering on behalf of a business, you confirm that you have the authority to bind that organization to these Terms. At present, Bakewell delivers only within India.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                3. Account &amp; Registration
              </h2>
              <p>
                You agree to provide accurate, current, and complete information when creating an account, and to keep your login credentials confidential. You are responsible for all activity that occurs under your account and must notify us immediately of any unauthorized use. Bakewell reserves the right to suspend or terminate any account found to contain false or misleading information, or that violates these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                4. Customer Responsibilities
              </h2>
              <p>
                By using this Website, you agree to use it only for lawful purposes, provide accurate and complete delivery information, ensure someone is available to receive perishable items at the specified time, and refrain from any activity that misuses, disrupts, or interferes with the Website's functioning.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                5. Product Information
              </h2>
              <p>
                Product images are for illustrative purposes only. As our breads and bakery items are handcrafted, slight variations in appearance, size, or finish from the images shown may occur. Prices and product availability are subject to change without prior notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                6. Payments
              </h2>
              <p>
                Bakewell reserves the right to refuse or cancel any order where payment cannot be verified, where a pricing error has occurred, where the product is no longer available, or where fraudulent activity is suspected.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                7. Delivery
              </h2>
              <p>
                We make every effort to deliver orders within the selected timeframe. However, Bakewell shall not be held liable for delays caused by factors beyond our reasonable control, including but not limited to adverse weather, traffic conditions, public holidays, or delivery details incorrectly provided by the customer.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                8. Intellectual Property
              </h2>
              <p>
                All content on this Website &mdash; including logos, product images, text, and design elements &mdash; is the property of Bakewell and is protected under applicable intellectual property laws. No content may be copied, reproduced, or used without our prior written permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                9. Limitation of Liability
              </h2>
              <p>
                Bakewell shall not be liable for any indirect, incidental, or consequential damages arising from the use of this Website or our products. Our maximum liability in any circumstance shall not exceed the total value of the relevant order.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                10. Changes to These Terms
              </h2>
              <p>
                Bakewell reserves the right to update or modify these Terms &amp; Conditions at any time without prior notice. Continued use of the Website following any changes constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                11. Contact Us
              </h2>
              <p>
                If you have any questions or concerns regarding these Terms &amp; Conditions, please reach out to us directly:
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
