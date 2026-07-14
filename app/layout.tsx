import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AZ_COPY, DOCUMENT_LANGUAGE } from "@/lib/i18n";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
});
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: AZ_COPY.metadata.title,
    template: "%s | BookSwap",
  },
  description: AZ_COPY.metadata.description,
  applicationName: "BookSwap",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BookSwap",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "az_AZ",
    siteName: "BookSwap",
    title: AZ_COPY.metadata.title,
    description: AZ_COPY.metadata.openGraphDescription,
  },
  twitter: {
    card: "summary",
    title: "BookSwap",
    description: AZ_COPY.metadata.socialDescription,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={DOCUMENT_LANGUAGE} dir="ltr" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
