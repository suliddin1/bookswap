import Link from "next/link";
import { BookOpen } from "lucide-react";

export function EmptyState({
  title,
  body,
  action,
  href,
  headingLevel = "h3",
}: {
  title: string;
  body: string;
  action?: string;
  href?: string;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <BookOpen size={22} />
      </span>
      <Heading className="display text-3xl font-semibold">{title}</Heading>
      <p>{body}</p>
      {action && href && (
        <Link href={href} className="btn-primary mt-5">
          {action}
        </Link>
      )}
    </div>
  );
}
