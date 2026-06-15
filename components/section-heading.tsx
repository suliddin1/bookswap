export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div>
      <span className="eyebrow text-orange">{eyebrow}</span>
      <h2 className="display mt-4 max-w-2xl text-4xl font-bold leading-[1.02] md:text-5xl">{title}</h2>
      {body && <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500">{body}</p>}
    </div>
  );
}
