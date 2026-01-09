import { Skeleton } from "@/components/ui/skeleton";

type SeasonsSkeletonPropsType = {
  pageSize: number;
};

export default function SeasonsSkeleton({
  pageSize,
}: SeasonsSkeletonPropsType) {
  return (
    <section className="divide-y rounded-xl border">
      {Array.from({ length: pageSize }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </section>
  );
}
