import { Skeleton } from "@/components/ui";

/** Shown while a route's code loads; pages keep their own data-loading states. */
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-28 mb-4" />
      <Skeleton className="h-10 w-3/4 max-w-md mb-3" />
      <Skeleton className="h-4 w-full max-w-lg mb-10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-md" />
        ))}
      </div>
    </div>
  );
}
