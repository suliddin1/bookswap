import Link from "next/link";
import { BookOpen } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#5b3c25] bg-[#e8decd] py-12">
      <div className="container-shell flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <Link href="/" className="display flex items-center gap-2 text-xl font-semibold"><BookOpen size={18} className="text-orange" /> BookSwap</Link>
          <p className="mt-3 max-w-sm text-xs leading-6 text-gray-500">A second-hand book fair, open every day.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs font-bold text-gray-500">
          <Link href="/listings">Browse</Link><Link href="/listings/new">Sell</Link><Link href="/messages">Messages</Link><Link href="/favorites">Favorites</Link><Link href="/profile">Dashboard</Link><span>© 2026 BookSwap</span>
        </div>
      </div>
    </footer>
  );
}
