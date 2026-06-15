import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-shell grid min-h-[650px] place-items-center py-16">
      <div className="text-center"><span className="display text-8xl font-bold text-orange">404</span><h1 className="display mt-4 text-4xl font-bold">That page left the shelf.</h1><p className="mt-3 text-xs text-gray-500">It may have been sold, moved, or never existed.</p><Link href="/listings" className="btn-primary mt-7">Browse available books</Link></div>
    </div>
  );
}
