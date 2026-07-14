import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AZ_COPY } from "@/lib/i18n";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#5b3c25] bg-[#e8decd] py-12">
      <div className="container-shell grid gap-9 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="display flex items-center gap-2 text-xl font-semibold"
          >
            <BookOpen size={18} className="text-orange" /> BookSwap
          </Link>
          <p className="mt-3 max-w-sm text-xs leading-6 text-gray-500">
            {AZ_COPY.footer.description}
          </p>
        </div>
        <nav
          className="grid content-start gap-3 text-xs font-bold text-gray-600"
          aria-label={AZ_COPY.footer.marketplace}
        >
          <span className="eyebrow">{AZ_COPY.footer.marketplace}</span>
          <Link href="/listings">{AZ_COPY.footer.browse}</Link>
          <Link href="/listings/new">{AZ_COPY.footer.sell}</Link>
          <Link href="/safety">{AZ_COPY.footer.safety}</Link>
          <Link href="/faq">{AZ_COPY.footer.faq}</Link>
        </nav>
        <nav
          className="grid content-start gap-3 text-xs font-bold text-gray-600"
          aria-label={AZ_COPY.footer.legal}
        >
          <span className="eyebrow">{AZ_COPY.footer.rights}</span>
          <Link href="/privacy">{AZ_COPY.footer.privacy}</Link>
          <Link href="/terms">{AZ_COPY.footer.terms}</Link>
          <Link href="/user-rights">{AZ_COPY.footer.userRights}</Link>
          <span className="pt-2 text-[9px] font-normal text-gray-500">
            {AZ_COPY.footer.copyright}
          </span>
        </nav>
      </div>
    </footer>
  );
}
