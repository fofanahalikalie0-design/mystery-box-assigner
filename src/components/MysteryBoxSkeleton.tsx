import { Skeleton } from "@/components/ui/skeleton";

interface MysteryBoxSkeletonProps {
  count?: number;
}

export function MysteryBoxSkeleton({ count = 10 }: MysteryBoxSkeletonProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl border border-border bg-card overflow-hidden">
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
