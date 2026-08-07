import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { AZ_COPY, DOCUMENT_LANGUAGE } from "@/lib/i18n";
import { getLegalIdentity } from "@/lib/legal";
import { isPrivateBeta } from "@/lib/private-beta";
import { getSiteUrl } from "@/lib/site-url";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
});
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
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
  robots: isPrivateBeta()
    ? {
        index: false,
        follow: false,
        noarchive: true,
        nocache: true,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const privateBeta = isPrivateBeta();
  getLegalIdentity();

  return (
    <html lang={DOCUMENT_LANGUAGE} dir="ltr" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <a href="#main-content" className="skip-link">
          {AZ_COPY.navigation.skipToContent}
        </a>
        <SiteHeader />
        {privateBeta && (
          <aside
            aria-label={AZ_COPY.privateBeta.label}
            className="border-b border-[#d8cbb5] bg-[#f2e4c9] px-4 py-2 text-center text-xs leading-5 text-ink"
          >
            <strong>{AZ_COPY.privateBeta.label}.</strong>{" "}
            {AZ_COPY.privateBeta.notice}
          </aside>
        )}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <WebVitalsReporter
          enabled={process.env.WEB_VITALS_ENABLED === "true"}
        />
      </body>
    </html>
  );
}
