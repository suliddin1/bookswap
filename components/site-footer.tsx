import Link from "next/link";
import { BookOpen } from "lucide-react";

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
            A reader-to-reader book marketplace. BookSwap does not process
            payments or take possession of listed books.
          </p>
        </div>
        <nav
          className="grid content-start gap-3 text-xs font-bold text-gray-600"
          aria-label="Marketplace"
        >
          <span className="eyebrow">Marketplace</span>
          <Link href="/listings">Browse books</Link>
          <Link href="/listings/new">Sell a book</Link>
          <Link href="/safety">Safety center</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <nav
          className="grid content-start gap-3 text-xs font-bold text-gray-600"
          aria-label="Legal"
        >
          <span className="eyebrow">Your rights</span>
          <Link href="/privacy">Privacy notice</Link>
          <Link href="/terms">Terms of use</Link>
          <Link href="/user-rights">User rights</Link>
          <span className="pt-2 text-[9px] font-normal text-gray-500">
            © 2026 BookSwap
          </span>
        </nav>
      </div>
    </footer>
  );
}
