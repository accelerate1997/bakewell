import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - The Daily Bake",
  description: "Learn how The Daily Bake collects, uses, and safeguards your personal data, browser cache, and cookie choices.",
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-playfair font-black text-3xl sm:text-4xl text-[#1a2c1a] leading-tight uppercase tracking-tight">
                Privacy Policy
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
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>The Daily Bake™</strong>. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy policy or our practices regarding your personal info, please contact us at info@thedailybake.com.
              </p>
              <p>
                When you visit our website and use our services (browsing loaves, placing orders, subscribing to daily deliveries, or registering accounts), you trust us with your personal information. We take your privacy very seriously.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                2. Information We Collect
              </h2>
              <p>
                We collect personal information that you voluntarily provide to us when registering on the Website, expressing an interest in obtaining information about us or our products, or placing orders.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Personal Data Provided by You:</strong> Names, phone numbers, email addresses, billing addresses, delivery slots, and shipping addresses.
                </li>
                <li>
                  <strong>Payment Credentials:</strong> All payments are processed securely through verified third-party gateways (e.g. UPI, Card processors). We do not store raw card numbers or UPI PINs on our servers.
                </li>
                <li>
                  <strong>Device Data & Cookies:</strong> We collect IP addresses, browser specifications, operating systems, and website interaction stats.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                3. Cookies and Local Cache Storage
              </h2>
              <p>
                We use cookies and local browser storage (such as <code>localStorage</code>) to enhance your shopping experience and optimize our site's loading speeds. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Persistent Cart:</strong> Storing items in your shopping cart so you don't lose them when you refresh the page.
                </li>
                <li>
                  <strong>User Preferences:</strong> Storing default pincodes and delivery slots to check serviceability instantly.
                </li>
                <li>
                  <strong>Authentication:</strong> Keeping you securely signed in to your account during your checkout journey.
                </li>
              </ul>
              <p>
                You can manage or decline cookie storage choices through our Cookie Consent Banner or your browser settings. Declining cookies may limit some checkout actions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                4. How We Use Your Information
              </h2>
              <p>
                We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. Specifically, we use it to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Facilitate account creation, user sign-in processes, and profile settings.</li>
                <li>Fulfill and manage your orders, payments, returns, and daily/weekly subscriptions.</li>
                <li>Deliver fresh artisanal loaves to your door via our service network.</li>
                <li>Send service-related transactional notices (e.g. order confirmation, delivery slots details).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                5. Data Security
              </h2>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal info, transmission of personal info to and from our Website is at your own risk.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                6. Contact Us
              </h2>
              <p>
                If you have questions or comments about this policy, you may email us or contact us by post at:
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
