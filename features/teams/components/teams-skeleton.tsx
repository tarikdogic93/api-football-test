import { Skeleton } from "@/components/ui/skeleton";

type TeamsSkeletonPropsType = {
  pageSize: number;
};

export default function TeamsSkeleton({ pageSize }: TeamsSkeletonPropsType) {
  return (
    <section className="divide-y rounded-xl border">
      {Array.from({ length: pageSize }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5.5 w-32" />
              <Skeleton className="h-5.5 w-14.5" />
              <Skeleton className="h-5.5 w-20.5" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
