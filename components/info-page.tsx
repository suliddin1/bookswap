import type { ReactNode } from "react";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="container-shell py-12 md:py-16">
      <header className="max-w-4xl border-b-2 border-[#5b3c25] pb-8">
        <span className="bookmark-badge">{eyebrow}</span>
        <h1 className="display mt-5 break-words text-5xl font-semibold leading-none md:text-7xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600">
          {intro}
        </p>
      </header>
      <div className="prose-book mt-10 max-w-4xl space-y-9 text-sm leading-7 text-gray-700">
        {children}
      </div>
    </div>
  );
}

export function InfoSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="display break-words text-3xl font-semibold text-ink"
      >
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
