import { Skeleton } from "@/components/ui/skeleton";

export default function SeasonsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-[58px]" />
      ))}
    </div>
  );
}
