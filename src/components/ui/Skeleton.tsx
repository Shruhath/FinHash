interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = "var(--radius-sm)",
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

/** Card-shaped placeholder used while a section's query resolves. */
export function SkeletonCard({ lines = 3, height }: { lines?: number; height?: number }) {
  return (
    <div className="card skeleton-card" style={height ? { height } : undefined}>
      <Skeleton width="45%" height={14} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? "70%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-list__row" key={i}>
          <Skeleton width={40} height={40} radius="var(--radius-md)" />
          <div className="skeleton-list__text">
            <Skeleton width="60%" height={13} />
            <Skeleton width="35%" height={11} />
          </div>
          <Skeleton width={64} height={14} />
        </div>
      ))}
    </div>
  );
}
