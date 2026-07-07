import clsx from "clsx";

/**
 * Skeleton
 * A shimmer loading placeholder. Use in place of content while data is loading.
 *
 * @param {string} className - Additional Tailwind classes for sizing/layout
 * @param {boolean} rounded - If true, uses rounded-full (for avatars)
 */
export default function Skeleton({ className = "", rounded = false }) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gradient-to-r from-[#1e222e] via-[#2a2e3d] to-[#1e222e] bg-[length:200%_100%]",
        rounded ? "rounded-full" : "rounded-xl",
        className
      )}
      style={{
        animation: "shimmer 1.8s ease-in-out infinite",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

/**
 * SkeletonCard — a preset skeleton block matching a stat card
 */
export function SkeletonCard({ className = "" }) {
  return (
    <div className={clsx("p-5 rounded-2xl bg-[#171a21] border border-border space-y-3", className)}>
      <div className="flex justify-between">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-10 h-4" />
      </div>
      <Skeleton className="w-2/3 h-3 mt-2" />
      <Skeleton className="w-1/2 h-8 mt-1" />
    </div>
  );
}

/**
 * SkeletonList — a preset skeleton for a list of rows
 */
export function SkeletonList({ rows = 3, className = "" }) {
  return (
    <div className={clsx("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-[#171a21] border border-border flex gap-4">
          <Skeleton className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-full h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
