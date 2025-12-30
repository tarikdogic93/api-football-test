import { Skeleton } from "@/components/ui/skeleton";

type SeasonsSkeletonPropsType = {
  pageSize: number;
};

export default function SeasonsSkeleton({
  pageSize,
}: SeasonsSkeletonPropsType) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: pageSize }).map((_, i) => (
        <Skeleton key={i} className="h-14.5" />
      ))}
    </div>
  );
}
