import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "BookSwap | Give books a second life",
    template: "%s | BookSwap",
  },
  description:
    "A private-library marketplace for pre-loved books, textbooks, and reader-to-reader exchange.",
  applicationName: "BookSwap",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BookSwap",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "BookSwap",
    title: "BookSwap | Give books a second life",
    description: "Buy and sell pre-loved books directly with nearby readers.",
  },
  twitter: {
    card: "summary",
    title: "BookSwap",
    description: "A reader-to-reader marketplace for pre-loved books.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
