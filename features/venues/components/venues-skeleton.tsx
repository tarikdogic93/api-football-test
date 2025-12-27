import { Skeleton } from "@/components/ui/skeleton";

type VenuesSkeletonProps = {
  pageSize: number;
};

export default function VenuesSkeleton({ pageSize }: VenuesSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: pageSize }).map((_, i) => (
        <div
          key={i}
          className="p-4 shadow rounded flex flex-col items-center gap-1"
        >
          <Skeleton className="w-28 h-20" />
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
      ))}
    </div>
  );
}
