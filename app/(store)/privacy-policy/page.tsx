import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Bakewell",
  description: "Learn how Bakewell collects, uses, and safeguards your personal data, browser cache, and cookie choices.",
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
              <p>
                At <strong>Bakewell™</strong>, we value your trust and are committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and the choices you have regarding your data when you visit or make a purchase on <a href="https://www.bakewell.in" target="_blank" rel="noopener noreferrer" className="text-[#3d5a2e] font-semibold hover:underline">www.bakewell.in</a> (&quot;the Website&quot;).
              </p>
              <p>
                By using our Website, you agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                1. Information We Collect
              </h2>
              <p>
                When you interact with our Website, we may collect the following types of information:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Personal Details:</strong> Name, email address, phone number, and delivery address.
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment details are processed securely through our third-party payment gateway partners; Bakewell does not store your full card or banking details on our servers.
                </li>
                <li>
                  <strong>Order Information:</strong> Products purchased, order history, delivery preferences, and special instructions (e.g., cake messages, delivery timing).
                </li>
                <li>
                  <strong>Account Information:</strong> Login credentials, if you choose to create an account with us.
                </li>
                <li>
                  <strong>Technical Information:</strong> IP address, browser type, device information, and browsing behaviour on our Website, collected automatically through cookies and similar technologies.
                </li>
                <li>
                  <strong>Communication Data:</strong> Any information you provide when contacting our customer support team.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Process and fulfil your orders, including delivery and payment confirmation.</li>
                <li>Communicate with you regarding order status, delivery updates, and customer support.</li>
                <li>Send promotional offers, new product updates, and marketing communications (where you have opted in).</li>
                <li>Improve our Website, products, and overall customer experience.</li>
                <li>Detect and prevent fraud, unauthorized transactions, or misuse of our Website.</li>
                <li>Comply with applicable legal and regulatory obligations.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                3. Sharing of Information
              </h2>
              <p>
                Bakewell does not sell your personal information to third parties. We may share your information only with:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Delivery Partners</strong>, to fulfil and dispatch your orders.</li>
                <li><strong>Payment Gateway Providers</strong>, to securely process your transactions.</li>
                <li><strong>Service Providers</strong>, who assist us with website hosting, analytics, or marketing, and are bound by confidentiality obligations.</li>
                <li><strong>Legal Authorities</strong>, where required by law, regulation, or a valid legal process.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                4. Data Retention
              </h2>
              <p>
                We retain your personal information only for as long as necessary to fulfil the purposes outlined in this Policy, including order processing, legal compliance, dispute resolution, and enforcement of our agreements. Once no longer required, your information will be securely deleted or anonymized.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                5. Cookies &amp; Tracking Technologies
              </h2>
              <p>
                Our Website uses cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can manage or disable cookies through your browser settings; however, doing so may affect certain features of the Website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                6. Your Choices
              </h2>
              <p>
                You have control over your personal information at any time. You may update your account details, opt out of receiving marketing communications, or request that your account be deleted. Please note that even if you opt out of marketing, we will continue to send essential order-related communications, such as order confirmations, delivery updates, and service notifications, as these are necessary to fulfil your orders.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                7. Security &amp; Access
              </h2>
              <p>
                Bakewell uses reasonable technical and organizational safeguards to protect your personal information from unauthorized access, misuse, or disclosure. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
              </p>
              <p>
                You may request access to the personal information we hold about you, or ask us to correct any inaccuracies. To protect your privacy, we may need to verify your identity before processing such requests.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                8. Third-Party Links
              </h2>
              <p>
                Our Website may contain links to third-party websites for your convenience. Bakewell is not responsible for the privacy practices, content, or security of any linked third-party sites, and we encourage you to review their privacy policies independently before sharing any personal information with them.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                9. Children's Privacy
              </h2>
              <p>
                Our Website is not intended for use by individuals under the age of 18 without parental or guardian supervision. We do not knowingly collect personal information from minors without appropriate consent.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                10. Policy Updates
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. Any changes will be posted on this page along with a revised effective date. Your continued use of the Website after such changes constitutes your acceptance of the updated Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-playfair font-black text-xl text-[#1a2c1a] uppercase tracking-tight">
                11. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or wish to make a data-related request, please reach out to us directly:
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
