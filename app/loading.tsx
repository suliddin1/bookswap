import { AZ_COPY } from "@/lib/i18n";

export default function Loading() {
  return (
    <div className="container-shell grid min-h-[600px] place-items-center">
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#dedad1] border-t-orange" />
        <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
          {AZ_COPY.global.loading}
        </p>
      </div>
    </div>
  );
}
