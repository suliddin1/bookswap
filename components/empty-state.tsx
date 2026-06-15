import Link from "next/link";
import { BookOpen } from "lucide-react";

export function EmptyState({
  title,
  body,
  action,
  href,
}: {
  title: string;
  body: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><BookOpen size={22} /></span>
      <h3 className="display text-3xl font-semibold">{title}</h3>
      <p>{body}</p>
      {action && href && <Link href={href} className="btn-primary mt-5">{action}</Link>}
    </div>
  );
}
