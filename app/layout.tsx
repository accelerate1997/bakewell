import type { Metadata } from "next";
import { dmSans, playfair } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/store/SessionProvider";

export const metadata: Metadata = {
  title: "Bakewell | Admin Panel",
  description: "B2C bakery and FMCG e-commerce admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
