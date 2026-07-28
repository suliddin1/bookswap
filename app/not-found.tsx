import Link from "next/link";
import { AZ_COPY } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="container-shell grid min-h-[650px] place-items-center py-16">
      <div className="text-center">
        <span className="display text-8xl font-bold text-orange">404</span>
        <h1 className="display mt-4 text-4xl font-bold">
          {AZ_COPY.global.notFoundTitle}
        </h1>
        <p className="mt-3 text-xs text-gray-500">
          {AZ_COPY.global.notFoundBody}
        </p>
        <Link href="/listings" className="btn-primary mt-7">
          {AZ_COPY.global.notFoundAction}
        </Link>
      </div>
    </div>
  );
}
