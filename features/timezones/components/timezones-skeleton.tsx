import { Skeleton } from "@/components/ui/skeleton";

type TimezonesSkeletonProps = {
  pageSize: number;
};

export default function TimezonesSkeleton({
  pageSize,
}: TimezonesSkeletonProps) {
  return (
    <section className="divide-y rounded-xl border">
      {Array.from({ length: pageSize }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      ))}
    </section>
  );
}
