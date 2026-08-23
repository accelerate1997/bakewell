import type { Metadata } from "next";
import { dmSans, playfair } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/store/SessionProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://bakewellbreads.com"),
  title: {
    default: "Bakewell | Fresh Artisanal Breads & Bakery",
    template: "%s | Bakewell",
  },
  description: "No Maida. No compromise. Fresh artisanal breads and clean label bakery products delivered daily.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bakewellbreads.com",
    siteName: "Bakewell",
    title: "Bakewell | Fresh Artisanal Breads & Bakery",
    description: "No Maida. No compromise. Fresh artisanal breads and clean label bakery products delivered daily.",
  },
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
