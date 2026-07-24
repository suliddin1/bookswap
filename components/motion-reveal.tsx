export function MotionReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`motion-reveal ${className}`}
      style={{ "--motion-reveal-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
